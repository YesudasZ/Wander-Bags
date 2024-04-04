const Coupon  = require('../models/CouponModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Order = require("../models/orderModel");


const loadCoupon = async(req,res)=>{
  try {
    const coupon= await Coupon.find({})
    res.render('coupons',{coupons:coupon});
  } catch (error) {
    return res.redirect('/admin/errorpage')
  }
}




const addCoupon = async (req, res) => {
  try {
    const {
      name,
      startDate,
      endDate,
      minimumAmount,
      maximumAmount,
      discount,
      couponCode
    } = req.body;

    const newCoupon = new Coupon({
      name,
      startDate,
      endDate,
      minimumAmount,
      maximumAmount,
      discount,
      couponCode
    });

    await newCoupon.save();
    res.status(200).json({ message: 'Coupon added successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const changeCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.params;
    const { status } = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, { status }, { new: true });

    if (!updatedCoupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon status updated successfully', updatedCoupon });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Route



module.exports = {
  loadCoupon,
  addCoupon,
  changeCouponStatus
}
