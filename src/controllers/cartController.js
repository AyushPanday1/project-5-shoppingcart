const cartModel = require('../models/cartModel')
let {isValidObjectId} = require('mongoose');
const userModel = require('../models/userModel');
const productModel = require('../models/productModel')
let {isValidId, isValidInstallments} = require('../utils/validator')



const createCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body;
        let { totalPrice, totalItems, cartId ,productId, quantity } = data
        if(Object.keys(data).length== 0){
            return res.status(400).send({ status: false, message:"body can not be empty" })
        }
         if(!isValidId(userId)){
            return res.status(400).send({ status: false, message:"invalid userId" })
         }
         let findUser = await userModel.findById(userId)
         if (!findUser) {
           return res.status(404).send({ status: false, message: `User with this Id ${userId} doesn't exist` })
         }
         if(!productId){
        return res.status(400).send({ status: false, message:"productId is mandatory" })
         }
         if(!isValidId(productId)){
            return res.status(400).send({ status: false, message:"please provide a valid productId" })
         }
         let findProduct = await productModel.findOne({_id: productId, isDeleted: false})
         if(!findProduct){
            return res.status(400).send({ status: false, message:`product with this ID ${productId}does not exist` })
         }
         if(!quantity){
            quantity = 1  // MINIMUM QUANTITY 1 || ATLEAST 1 QUANTITY MUST BE PRESENT
         }
         quantity = JSON.parse(quantity)
         if(quantity || quantity == ''){
            if(!isValidInstallments(quantity)){
                return res.status(400).send({ status: false, message: "Quantity is not Valid" })
            }
         }
         if (cartId || cartId == '') {
            if (!isValidId(cartId)) {
                return res.status(400).send({ status: false, message: "Cart id is not Valid" })
            }
        }
        let findUserCart = await cartModel.findOne({userId: userId})
        if(!findUserCart){
        let createData = {
           userId,
           items: [{productId: productId, quantity: quantity}],
           totalPrice: (findProduct.price * quantity).toFixed(2),    // toFixes()= how many digits would be there after the decimals  
           totalItems: 1
        }
         let newCart = await cartModel.create(createData);
         return res.status(201).send({status: false, message: "success", data: newCart})
    }
    
    if (findUserCart) {
        if (!cartId) {
          return res.status(400).send({ status: false, message: "Please provide cart id to add items in the cart" })
      }
      if (findUserCart._id.toString() !== cartId) {
        return res.status(400).send({ status: false, message: "Cart id is not matching" })
    }
    
}
        
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const updateCart = async function(req,res){
    try{

        userId = req.params.userId;
        
        if(!isValidId(userId)) return res.status(400).send({status:false,message:"User id is invalid."});

        let checkUser  = await userModel.find({_id:userId,isDeleted:false})
        if(!checkUser)  return res.status(404).send({status:false,message:"User not found."});


        const {cartId,productId,removeProduct} = req.body;

        if(!cartId) return res.status(400).send({status:false,message:"CartID is missing"});
        if(!productId) return res.status(400).send({status:false,message:"ProductID is missing"});

        if(!isValidId(cartId))  return res.status(400).send({status:false,message:"Cart id is invalid."});
        if(!isValidId(productId))  return res.status(400).send({status:false,message:"Product id is invalid."});

        if(!removeProduct)  return res.status(400).send({status:false,message:"Remove product is mandatory."});
        if(!(removeProduct==0 || removeProduct==1))
        return res.status(400).send({status:false,message:"Remove product can only be 0 or 1."});
  

        let checkCartinDB = await cartModel.findById(cartId)
        if(!checkCartinDB)  return res.status(404).send({status:false,message:"Cart does not found in DB."});
  
        let checkProductinDB = await productModel.findById(productId)
        if(!checkProductinDB)  return res.status(404).send({status:false,message:"Product does not found in DB."});


        if (checkCartinDB.items.length == 0)return res.status(400).send({status: false,message: "No products in cart or cart is empty"});

        let findQuantity = checkCartinDB.items.find(x => x.productId.toString() === productId)

        if (removeProduct === 0) {
            let totalAmount = checkCartinDB.totalPrice - (checkProductinDB.price * findQuantity.quantity) 

            await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true })

            let quantity = checkCartinDB.totalItems - 1
            let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true }) 

            return res.status(200).send({ status: true, message: `${productId} is been removed`, data: data })
        }


        let totalAmount = checkCartinDB.totalPrice - checkProductinDB.price
        let itemsArr = checkCartinDB.items

        for (i in itemsArr) {
            if (itemsArr[i].productId.toString() == productId) {
                itemsArr[i].quantity = itemsArr[i].quantity - 1

                if (itemsArr[i].quantity < 1) {
                    await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true })
                    let quantity = checkCartinDB.totalItems - 1

                    let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true }) //update the cart with total items and totalprice

                    return res.status(200).send({ status: true, message: `No such quantity/product exist in cart`, data: data })
                }
            }
        }
        let data = await cartModel.findOneAndUpdate({ _id: cartId }, { items: itemsArr, totalPrice: totalAmount }, { new: true })

        return res.status(200).send({ status: true, message: `${productId} quantity is been reduced By 1`, data: data })


    } catch(error){
        return res.status(500).send({status:false,message:error.message})
    }
}

module.exports = { createCart , updateCart}