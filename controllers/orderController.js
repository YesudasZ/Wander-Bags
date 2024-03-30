const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')
const { v4: uuidv4 } = require('uuid');
const Order = require("../models/orderModel");




const loadCheckout = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({ _id: user_id })
    const cart = await Cart.findOne({ owner: req.session.user_id })
    res.render('checkOut', { cart: cart, user: userData });
  } catch (error) {
    return res.redirect('/admin/errorpage')
  }
}


const placeOrder = async (req, res) => {
  try {


    const { addressId, paymentMethod, orderNotes } = req.body;
    const user_id = req.session.user_id;
    const user = await User.findById({ _id: user_id });

    const cart = await Cart.findOne({ owner: user_id }).populate('items.productId');

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
        const updatedCountInStock = product.countInStock - item.quantity;

        if (updatedCountInStock === 0) {
          productStatus = 'out-of-stock';
        }


        await Product.findByIdAndUpdate(product._id, {
          countInStock: updatedCountInStock,
          status: productStatus,
        });

        return {
          productId: product._id,
          title: product.name,
          image: product.images,
          productPrice: item.productPrice,
          quantity: item.quantity,
          price: item.price,
          productStatus: productStatus,
        };
      })
    );


    const oId = uuidv4();

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


const loadOderplaced = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({ _id: user_id })
    const order = await Order.findOne({ user: user_id })
    res.render('orderPlaced', { user: userData, orders: order });
  } catch (error) {
    return res.redirect('/admin/errorpage')
  }
}


const loadOrders = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({ _id: user_id })
    const order = await Order.findOne({ user: user_id })
    res.render('oders', { user: userData, orders: order });
  } catch (error) {
    return res.redirect('/admin/errorpage')
  }
}


const cancelOrder = async (req, res) => {
  try {
    console.log("working");
    const orderId = req.params.id;
    const { cancellationReason } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: 'Cancelled',
        cancellationReason
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'An error occurred while cancelling the order' });
  }
};



module.exports = {
  loadCheckout,
  placeOrder,
  loadOderplaced,
  loadOrders,
  cancelOrder
}