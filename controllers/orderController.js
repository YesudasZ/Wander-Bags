const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')
const { v4: uuidv4 } = require('uuid');
const axios = require('axios')
const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel")
const Coupon  = require('../models/CouponModel');
const Wishlist = require('../models/wishlistModel')
require('dotenv').config();




const loadCheckout = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({ _id: user_id }).populate('address');
  
    const coupons= await Coupon.find({})
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    res.render('checkOut', { cart: cart, user: userData, coupons:coupons ,   cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0,});
  } catch (error) {
    return res.redirect('/admin/errorpage')
  }
}


const placeOrder = async (req, res) => {
  try {


    const { addressId, paymentMethod, orderNotes,paymentStatus } = req.body;
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

    let PaymentStatus = "";
    if (paymentMethod === "Cash On Delivery") {
      PaymentStatus = "Pending";
    } else if (paymentMethod === 'Wallet') {
      PaymentStatus = 'Success';
     
      const wallet = await Wallet.findOne({ user: user_id });
      if (!wallet) {
        return res.status(400).json({ success: false, message: 'Wallet not found' });
      }
      // if (wallet.walletBalance < totalAmount) {
      //   return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      // }
      wallet.walletBalance -= cart.billTotal;
      wallet.amountSpent += cart.billTotal;
      wallet.transactions.push({
        amount: cart.billTotal,
        description: `Payment for Order #${oId}`,
        type: 'Debit',
        transactionDate: new Date(),
      });
      await wallet.save();
    } else {
      PaymentStatus = paymentStatus ;
    }



   

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
      paymentStatus: PaymentStatus,
    
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
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    res.render('orderPlaced', { user: userData, orders: order ,   cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0,});
  } catch (error) {
    return res.redirect('/admin/errorpage')
  }
}

const loadOderfailed = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const userData = await User.findById({ _id: user_id })
    const order = await Order.findOne({ user: user_id })
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    res.render('orderFailed', { user: userData, orders: order ,   cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0,});
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
    const orderId = req.params.id;
    const { cancellationReason } = req.body;

    const order = await Order.findById(orderId).populate('items.productId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update the countInStock of each product in the order
    for (const item of order.items) {
      const product = item.productId;
      const updatedCountInStock = product.countInStock + item.quantity;
      await Product.findByIdAndUpdate(product._id, { countInStock: updatedCountInStock });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: 'Cancelled',
        cancellationReason
      },
      { new: true }
    );

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'An error occurred while cancelling the order' });
  }
};



const razorpayOrder = async (data)=>{
  try {
   
    const respose = await axios.post('https://api.razorpay.com/v1/orders',data,{
      headers:{
        'Content-Type':"application/json",
        "Authorization": `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET_KEY}`).toString('base64')}`
      }
    })
    const  orderData = respose.data;
  
     return orderData   
  } catch (error) {
    console.error('Error creating RazorPay order:', error);
        throw new Error('Failed to create RazorPay order');
  }

}

const manageRazorpayOrder =  async (req,res)=> {
  try {

  

    const cart = await Cart.findOne({ owner: req.session.user_id })

  const cartId = cart._id
  const  billTotal = cart.billTotal

    if (!cart) {
    return res.status(400).json({ success: false, message: 'Cart not found' });
    }    
    let data={
      amount : billTotal*100,   //In INR
      currency:"INR",  
      receipt:`receipt_${cartId}`,
      payment_capture:1,
     
    }
    const orderData = await razorpayOrder(data);
   
    res.status(200).json(orderData);
  } catch (error) {
    console.error('Error creating RazorPay order:', error);
    res.status(500).json({success:false,message:'Internal Server Error'});
  }
}


const retryRazorpayOrder =  async (req,res)=> {
  const { orderId, billTotal } = req.body;
  try {
    const orderData1 = await Order.findById(orderId);
    if (!orderData1) {
      res.status(404).json({ success: false, message: "Order not found" });
    }

     
    let data={
      amount : billTotal*100,   //In INR
      currency:"INR",  
      receipt:`receipt_${orderId}`,
      payment_capture:1,
     
    }
    const orderData = await razorpayOrder(data);
   
    res.status(200).json(orderData);
  } catch (error) {
    console.error('Error creating RazorPay order:', error);
    res.status(500).json({success:false,message:'Internal Server Error'});
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
    return res.status(500).json({ success: false, message: "Internal Server Error" });
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
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    console.log("reqbody is receving", req.body);

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.paymentStatus = status;

    //Handling quantity for success payment
    if (order.paymentStatus === "Success")
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { countInStock: -item.quantity },
        });
      }

    const updatedOrder = await order.save();
    console.log("Updated order:", updatedOrder);

    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
  getWalletBalance
}