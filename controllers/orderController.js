const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')
const { v4: uuidv4 } = require('uuid');
const Order =  require("../models/orderModel");




const loadCheckout = async(req,res)=>{
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({_id:user_id})
    const cart = await Cart.findOne({owner:req.session.user_id})
    res.render('checkOut', { cart:cart,user:userData });
  } catch (error) {
    
  }
}


const placeOrder = async (req, res) => {
  try {
console.log("WOrking order");

    const { addressId, paymentMethod, orderNotes } = req.body;
    const user_id = req.session.user_id
    const user= await User.findById({_id:user_id})
   
    const cart = await Cart.findOne({ owner:user_id }).populate('items.productId');

    if (!cart) {
      return res.status(400).json({ success: false, message: 'Cart Not Found' });
    }

    const userAddress = user.address.find((addr) => addr._id.toString() === addressId);

    if (!userAddress) {
      return res.status(400).json({ success: false, message: 'Invalid address' });
    }

    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = item.productId;
        let productStatus = 'active';
        if (product.countInStock - item.quantity === 0) {
          productStatus = 'out-of-stock';
        }
        await Product.findByIdAndUpdate(product._id, { status: productStatus });
        return {
          productId: product._id,
          title: product.name,
          image: product.image,
          productPrice: item.productPrice,
          quantity: item.quantity,
          price: item.price,
          productStatus: productStatus,
        };
      })
    );
console.log("test -2");
    const oId = uuidv4(); // Generate a unique order ID

    const orderData = {
      user: user._id,
      cart: cart._id,
      oId,
      orderStatus: 'Pending',
      items: orderItems,
      billTotal: cart.billTotal,
      shippingAddress: userAddress,
      paymentMethod,
      orderNotes,
    };

    cart.items = [];
    cart.billTotal = 0;
    await cart.save();

    const order = new Order(orderData);
    await order.save();

    return res.status(200).json({ success: true, message: 'Proceeded to checkout page successfully' });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


module.exports = {
  loadCheckout,
  placeOrder
}