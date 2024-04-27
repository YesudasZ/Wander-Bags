const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')
const { v4: uuidv4 } = require('uuid');
const axios = require('axios')
const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel")
const Coupon = require('../models/CouponModel');
const Wishlist = require('../models/wishlistModel')
require('dotenv').config();




const loadCheckout = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const userData = await User.findById({ _id: user_id }).populate('address');
    const currentDate = new Date();
    const coupons = await Coupon.find({
      status: 'Active',
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    });
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    res.render('checkOut', {
      cart: cart,
      user: userData,
      coupons: coupons,
      cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0
    });
  } catch (error) {
    console.error(error);
    return res.redirect('/pagenotfound');
  }
};


const placeOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, orderNotes, paymentStatus, totalAmount, couponDiscount } = req.body;
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
        if (product.countInStock < item.quantity) {
          return res.status(400).json({ success: false, message: `${product.name} is out of stock` });
        }
        const updatedCountInStock = product.countInStock - item.quantity;
        await Product.findByIdAndUpdate(product._id, {
          countInStock: updatedCountInStock,
        });
        return {
          productId: product._id,
          title: product.name,
          image: product.images,
          productPrice: product.discountPrice ? product.discountPrice : product.price,
          quantity: item.quantity,
          price: product.discountPrice ? product.discountPrice * item.quantity : product.price * item.quantity,
        };
      })
    );
    const oId = uuidv4();
    let PaymentStatus = '';
    if (paymentMethod === 'Cash On Delivery') {
      PaymentStatus = 'Pending';
    } else if (paymentMethod === 'Wallet') {
      PaymentStatus = 'Success';
      const wallet = await Wallet.findOne({ user: user_id });
      if (!wallet) {
        return res.status(400).json({ success: false, message: 'Wallet not found' });
      }
      if (wallet.walletBalance < totalAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }
      wallet.walletBalance -= totalAmount;
      wallet.amountSpent += totalAmount;
      wallet.transactions.push({
        amount: totalAmount,
        description: `Payment for Order #${oId}`,
        type: 'Debit',
        transactionDate: new Date(),
      });
      await wallet.save();
    } else {
      PaymentStatus = paymentStatus;
    }
    const orderData = {
      user: user._id,
      cart: cart._id,
      oId,
      orderStatus: 'Pending',
      items: orderItems,
      billTotal: totalAmount,
      shippingAddress: userAddress,
      paymentMethod,
      orderNotes,
      paymentStatus: PaymentStatus,
      couponAmount: couponDiscount,
    };
    cart.items = [];
    cart.billTotal = 0;
    await cart.save();
    const order = new Order(orderData);
    await order.save();
    return res.status(200).json({ success: true, message: 'Proceeded to checkout page successfully' });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound');
  }
};


const loadOderplaced = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({ _id: user_id })
    const order = await Order.findOne({ user: user_id })
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    res.render('orderPlaced', {
      user: userData, orders: order, cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0,
    });
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound');
  }
}


const loadOderfailed = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({ _id: user_id })
    const order = await Order.findOne({ user: user_id })
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    res.render('orderFailed', {
      user: userData, orders: order, cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0,
    });
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound');
  }
}


const loadOrders = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({ _id: user_id })
    const order = await Order.findOne({ user: user_id })
    res.render('orders', { user: userData, orders: order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.redirect('/pagenotfound');
  }
}


const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const itemIndex = req.params.itemIndex;
    const { cancellationReason } = req.body;
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const item = order.items[itemIndex];
    const product = item.productId;
    const updatedCountInStock = product.countInStock + item.quantity;
    await Product.findByIdAndUpdate(product._id, { countInStock: updatedCountInStock });
    if (order.paymentStatus === 'Success') {
      const refundAmount = item.price;
      let wallet = await Wallet.findOne({ user: req.session.user_id });
      if (!wallet) {
        wallet = new Wallet({
          user: req.session.user_id,
          walletBalance: 0,
          transactions: []
        });
      }
      let couponAmount = 0;
      console.log("od amt",order);
      if (order.couponAmount > 0) {
        couponAmount = order.couponAmount * (item.price / order.billTotal);
      }
      wallet.walletBalance += refundAmount - couponAmount;
      wallet.refundAmount += refundAmount - couponAmount;
      // Add transaction details
      wallet.transactions.push({
        amount: refundAmount - couponAmount,
        description: `Refund for item #${item.title} in order #${order.oId}`,
        type: 'Refund',
        transactionDate: new Date()
      });
      await wallet.save();
    }
    order.items.splice(itemIndex, 1);
    order.billTotal -= item.price-order.couponAmount;
    order.billTotal -= order.couponAmount;
    if (order.items.length === 0) {
      order.orderStatus = 'Cancelled';
    }

    await order.save();
    res.json({ success: true, message: 'Item cancelled successfully', updatedOrder: order });
  } catch (error) {
    console.error('Error canceling order item:', error);
    res.redirect('/pagenotfound');
  }
};


const razorpayOrder = async (data) => {
  try {
    const respose = await axios.post('https://api.razorpay.com/v1/orders', data, {
      headers: {
        'Content-Type': "application/json",
        "Authorization": `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET_KEY}`).toString('base64')}`
      }
    })
    const orderData = respose.data;
    return orderData
  } catch (error) {
    console.error('Error creating RazorPay order:', error);
    throw new Error('Failed to create RazorPay order');
  }

}


const manageRazorpayOrder = async (req, res) => {
  try {
    const { totalAmount } = req.body;
    const cart = await Cart.findOne({ owner: req.session.user_id })
    const cartId = cart._id
    if (!cart) {
      return res.status(400).json({ success: false, message: 'Cart not found' });
    }
    let data = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_${cartId}`,
      payment_capture: 1,
    }
    const orderData = await razorpayOrder(data);
    res.status(200).json(orderData);
  } catch (error) {
    console.error('Error creating RazorPay order:', error);
    res.redirect('/pagenotfound');
  }
}


const retryRazorpayOrder = async (req, res) => {
  const { orderId, billTotal } = req.body;
  try {
    const orderData1 = await Order.findById(orderId);
    if (!orderData1) {
      res.status(404).json({ success: false, message: "Order not found" });
    }
    let data = {
      amount: billTotal * 100,
      currency: "INR",
      receipt: `receipt_${orderId}`,
      payment_capture: 1,
    }
    const orderData = await razorpayOrder(data);
    res.status(200).json(orderData);
  } catch (error) {
    console.error('Error creating RazorPay order:', error);
    res.redirect('/pagenotfound');
  }
}


const returnOrderAndRefund = async (req, res) => {
  const orderId = req.params.id;
  const { returnReason } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    order.orderStatus = 'Returned';
    order.paymentStatus = 'Refunded';
    order.returnReason = returnReason;
    await order.save();
    const refundAmount = order.billTotal;
    let wallet = await Wallet.findOne({ user: req.session.user_id });
    if (!wallet) {
      wallet = new Wallet({
        user: req.session.user_id,
        walletBalance: 0,
        transactions: []
      });
    }
    wallet.walletBalance += refundAmount;
    wallet.refundAmount += refundAmount;
    // Add transaction details
    wallet.transactions.push({
      amount: refundAmount,
      description: `Refund for order #${order.oId}`,
      type: 'Refund',
      transactionDate: new Date()
    });
    await wallet.save();
    return res.status(200).json({ success: true, message: "Order returned successfully and refund processed to wallet" });
  } catch (error) {
    console.error("Error returning order and refunding amount:", error);
    res.redirect('/pagenotfound');
  }
};


const getWalletBalance = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const wallet = await Wallet.findOne({ user: user_id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    return res.status(200).json({ success: true, walletBalance: wallet.walletBalance });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound');
  }
};


const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    order.paymentStatus = status;
    if (order.paymentStatus === "Success")
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { countInStock: -item.quantity },
        });
      }
    const updatedOrder = await order.save();
    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error(error.message);
    res.redirect('/pagenotfound');
  }
};


const checkQuantity = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cart = await Cart.findOne({ owner: userId }).populate({
      path: 'items.productId',
      model: 'Product',
      select: 'name countInStock',
    });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    const cartItems = cart.items.map(item => ({
      productId: {
        name: item.productId.name,
        countInStock: item.productId.countInStock,
      },
      quantity: item.quantity,
    }));
    res.status(200).json({ items: cartItems });
  } catch (error) {
    console.error('Error retrieving cart items:', error);
    res.redirect('/pagenotfound');
  }
};


module.exports = {
  loadCheckout,
  placeOrder,
  loadOderplaced,
  loadOrders,
  cancelOrder,
  manageRazorpayOrder,
  returnOrderAndRefund,
  loadOderfailed,
  retryRazorpayOrder,
  updatePaymentStatus,
  getWalletBalance,
  checkQuantity
}