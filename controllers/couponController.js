const Coupon  = require('../models/CouponModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')


const loadCoupon = async(req,res)=>{
  try {
    const coupons= await Coupon.find({})
    res.render('coupons',{coupons:coupons});
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

    res.status(200).json({success:true, message: 'Coupon status updated successfully', updatedCoupon });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user_id;

    // Find the coupon by the provided code
    const coupon = await Coupon.findOne({ couponCode, isActive: 1 });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code.' });
    }

    // Check if the coupon is active and not expired
    const currentDate = new Date();

    if (currentDate < coupon.startDate || currentDate > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Coupon is not active or has expired.' });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ owner: userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    // Check if the cart total meets the minimum amount requirement for the coupon
    if (cart.billTotal < coupon.minimumAmount) {
      return res.status(400).json({ success: false, message: 'Minimum order amount not met for this coupon.' });
    }

    // Calculate the coupon discount amount
    const couponDiscount = (cart.billTotal * coupon.discount) / 100;
    const newTotalAmount = cart.billTotal - couponDiscount;

    // Apply the coupon to the user's cart
    cart.couponApplied = {
      couponCode: coupon.couponCode,
      discount: couponDiscount,
    };
    cart.billTotal = newTotalAmount;
    await cart.save();

    return res.status(200).json({ success: true, couponDiscount, newTotalAmount });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};




module.exports = {
  loadCoupon,
  addCoupon,
  changeCouponStatus,
  applyCoupon
}
