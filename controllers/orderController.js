const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')


const loadCheckout = async(req,res)=>{
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({_id:user_id})
    const cart = await Cart.findOne({owner:req.session.user_id})
    res.render('checkOut', { cart:cart,user:userData });
  } catch (error) {
    
  }
}

module.exports = {
  loadCheckout
}