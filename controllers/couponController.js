const Coupon = require('../models/CouponModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')


const loadCoupon = async (req, res) => {
  try {
    const limit = 5;
    const page = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * limit;
    const coupons = await Coupon.find({})
      .skip(startIndex)
      .limit(limit);
    const total = await Coupon.countDocuments({});
    res.render('coupons', { coupons, page, limit, total });
  } catch (error) {
    console.error(error);
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
    res.redirect('/admin/errorpage')
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
    res.status(200).json({ success: true, message: 'Coupon status updated successfully', updatedCoupon });
  } catch (error) {
    console.error('Error:', error);
    res.redirect('/admin/errorpage')
  }
};


const applyCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    const userId = req.session.user_id;
    const cart = await Cart.findOne({ owner: userId });
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid coupon' });
    }
    const today = new Date();
    if (today < coupon.startDate || today > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Coupon is expired' });
    }
    if (cart.billTotal < coupon.minimumAmount) {
      return res.status(400).json({ success: false, message: `Minimum purchase amount for this coupon is ${coupon.minimumAmount}` });
    }
    const couponDiscount1 = cart.billTotal * (coupon.discount / 100);
    let updatedTotalAmount;
    if (couponDiscount1 > coupon.maximumAmount) {
      updatedTotalAmount = cart.billTotal - coupon.maximumAmount;
    } else {
      updatedTotalAmount = cart.billTotal - couponDiscount1;
    }
    const couponDiscount = cart.billTotal - updatedTotalAmount
    cart.billTotal = updatedTotalAmount;
    cart.couponDiscount = couponDiscount;
    await cart.save();
    res.status(200).json({ success: true, message: 'Coupon applied successfully', couponDiscount, updatedTotalAmount });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.redirect('/pagenotfound');
  }
};


const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cart = await Cart.findOne({ owner: userId });
    cart.billTotal = cart.billTotal + cart.couponDiscount;
    cart.couponDiscount = 0;
    await cart.save();
    res.status(200).json({ success: true, message: 'Coupon removed successfully', updatedTotalAmount: cart.billTotal });
  } catch (error) {
    console.error('Error removing coupon:', error);
    res.redirect('/pagenotfound');
  }
};


const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    await Coupon.findByIdAndDelete(couponId);
    res.status(200).json({ message: 'Coupon successfully deleted' });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }
};


const getCoupons = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    const currentDate = new Date();
    const { startDate, endDate, status } = coupon;

    if (status !== 'Active' || currentDate < startDate || currentDate > endDate) {
      return res.status(400).json({ error: 'Coupon is not active or has expired' });
    }

    res.json(coupon);
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.redirect('/pagenotfound');
  }
};


module.exports = {
  loadCoupon,
  addCoupon,
  changeCouponStatus,
  applyCoupon,
  removeCoupon,
  deleteCoupon,
  getCoupons
}
