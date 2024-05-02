const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require("../models/orderModel");
const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer");
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const Wallet = require("../models/walletModel")
const Category = require('../models/categoryModel');
const path = require('path');
const ejs = require("ejs");
// const pdf = require('html-pdf');
require('dotenv').config();




const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
}


let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.user,
    pass: process.env.pass
  }
})


function generatingRefferalCode() {
  const characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;
  let refferalCode = "";
  const codeLength = 8;
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    refferalCode += characters[randomIndex];
  }
  return refferalCode;
}


const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
}


const successGoogleLogin = (req, res) => {
  if (!req.user)
    res.redirect('/failure');
  console.log(req.user);
  res.send("Welcome " + req.user.displayName);
}


const failureGoogleLogin = (req, res) => {
  res.send("Error");
}


const pagenotfound = async (req, res) => {
  res.render('pagenotfound')
}


const landingLoad = async (req, res) => {
  try {
    const products = await Product.find();
    res.render('landing', { products });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


const insertuser = async (req, res) => {
  try {
    const email = req.body.email;
    const mobileNumber = req.body.mobile;
    const existingemail = await User.findOne({ email: email })
    const existingnumber = await User.findOne({ mobile: mobileNumber })
    if (existingemail) {
      return res.render("signup", { message: "Email already exists" })
    }
    if (existingnumber) {
      return res.render("signup", { message: "Mobile already exists" })
    }
    if (req.body.referedBy) {
      const referrer = await User.findOne({ refCode: req.body.referedBy });
      if (!referrer) {
        console.log("Invalid referral code");
        return res.render("signup", {
          message: "Invalid Referral Code",
        });
      }
    }



    const refCode = generatingRefferalCode();
    const otp = generateOTP();
    console.log(otp);
    console.log("ref", refCode);
    const details = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: req.body.password,
      is_admin: 0,
      is_verified: 0,
      otp: otp,
      otpExpiration: Date.now() + 60000,
      refCode: refCode,
      referedBy: req.body.referedBy

    };

    req.session.details = details
    req.session.save();
    res.redirect('/otpverify')

    const mailoptions = {
      from: "wanderbags29@gmail.com",
      to: req.body.email,
      subject: 'OTP Verification',
      text: `Your OTP for verification is: ${otp}`
    }
    await transporter.sendMail(mailoptions);
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


const sendotp = (email, otp) => {
  const mailoptions = {
    from: 'wanderbags29@gmail.com',
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP for verification is: ${otp}`
  }
  transporter.sendMail(mailoptions);
}


const regenerateOTP = (email) => {
  try {
    const otp = generateOTP();
    sendotp(email, otp);
    return otp;
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound')
  }
}


const resendotp = async (req, res) => {
  try {
    const details = req.session.details;
    const otp = regenerateOTP(details.email);
    console.log('resend', otp);
    req.session.details.otp = otp;
    req.session.details.otpExpiration = Date.now() + 60000
    req.session.save();
    res.json({ success: true, message: 'OTP resend successfully' });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound');
  }
}


const loginLoad = async (req, res) => {
  try {
    res.render('login')
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


const loadRegister = async (req, res) => {
  try {
    res.render('signup');
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


const verifylogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password)
      if (passwordMatch) {
        if (userData.is_verified == 0) {
          res.render('login', { message: "Unauthorized Access." })
        } else {
          req.session.user_id = userData._id;
          req.session.user = true;
          res.redirect('/home');
        }
      } else {
        res.render('login', { message: "Password is incorrect" });
      }
    } else {
      res.render('login', { message: "*Invalid username and password" });
    }
  } catch (error) {
    console.log(error.message)
    res.redirect('/pagenotfound')
  }
};


const loadotpverify = async (req, res) => {
  try {
    res.render('otpverify');
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


const otpverify = async (req, res) => {
  try {
    const otpcheck = parseInt(req.body.otp);
    const dbotp = req.session.details.otp;
    if (dbotp === otpcheck) {
      if (req.session.details.otpExpiration < Date.now()) {
        return res.json({ success: false, message: 'OTP has expired' });
      }
      const spassword = await securePassword(req.session.details.password);
      const user = new User({
        name: req.session.details.name,
        email: req.session.details.email,
        mobile: req.session.details.mobile,
        refCode: req.session.details.refCode,
        referedBy: req.session.details.referedBy,
        password: spassword,
        is_admin: 0,
        is_verified: 1,
      });
      const userData = await user.save();
      const wallet = new Wallet({
        user: userData._id,
        walletBalance: userData.referredUserReward,
        transactions: [
          {
            amount: userData.referredUserReward,
            description: 'Sign up bonus',
            type: 'Credit',
          }
        ]
      });
      await wallet.save();
      if (req.session.details.referedBy) {
        const referrer = await User.findOne({ refCode: req.session.details.referedBy });
        if (referrer) {
          const referrerWallet = await Wallet.findOneAndUpdate(
            { user: referrer._id },
            { $inc: { walletBalance: referrer.referringUserReward } },
            { new: true, upsert: true }
          );
          referrerWallet.transactions.push({
            amount: referrer.referringUserReward,
            description: `Referal bonus for ${userData.name}`,
            type: 'Credit',
          });
          await referrerWallet.save();
        }
      }
      req.session.user_id = userData._id;
      req.session.user = true;
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound');
  }
};


const loadshop = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const categories = await Category.find({ status: "active" });
    const currentPage = req.query.page || 1;
    const perPage = 9;
    let products;
    let totalProducts;
    if (req.query.searchQuery) {
      const searchRegex = new RegExp(req.query.searchQuery, 'i');
      products = await Product.find({ name: { $regex: searchRegex }, status: { $ne: "deleted", $ne: "inactive" } })
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
      totalProducts = await Product.countDocuments({ name: { $regex: searchRegex }, status: { $ne: "deleted", $ne: "inactive" } });
    } else {
      products = await Product.find({ status: { $ne: "deleted", $ne: "inactive" } })
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
      totalProducts = await Product.countDocuments({ status: { $ne: "deleted", $ne: "inactive" } });
    }
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    const totalPages = Math.ceil(totalProducts / perPage);
    res.render('shop', { categories, products, user: userData, currentPage, totalPages, cartCount: cart?.items?.length || 0, wishlistCount: wishlist?.items?.length || 0 });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound');
  }
};


const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const products = await Product.find({ status: { $ne: 'deleted', $ne: 'inactive' } })
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    res.render('home', {
      products,
      user: userData,
      cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound');
  }
};


const sortProducts = async (req, res) => {
  try {
    const { sortOption, searchQuery } = req.body;
    let sortQuery = {};
    let searchRegex = {};
    if (searchQuery) {
      searchRegex = { name: { $regex: new RegExp(searchQuery, 'i') } };
    }
    switch (sortOption) {
      case 'priceLowToHigh':
        sortQuery = { discountPrice: 1 };
        break;
      case 'priceHighToLow':
        sortQuery = { discountPrice: -1 };
        break;
      case 'releaseDate':
        sortQuery = { productAddDate: -1 };
        break;
      case 'aAtoZZ':
        sortQuery = { name: 1 };
        break;
      case 'zZtoaA':
        sortQuery = { name: -1 };
        break;
      default:
        sortQuery = {};
    }
    const sortedProducts = await Product.find(searchRegex).sort(sortQuery);
    res.json(sortedProducts);
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound');
  }
};


const loadforgetpassword = async (req, res) => {
  try {
    res.render('forgetpassword')
  } catch (error) {
    console.log(error.message);
  }
}


const filterProducts = async (req, res) => {
  try {
    const { sortOption, searchQuery, selectedCategory } = req.body;
    let sortQuery = {};
    let searchRegex = {};
    let categoryFilter = {};
    if (searchQuery) {
      searchRegex = { name: { $regex: new RegExp(searchQuery, 'i') } };
    }
    if (selectedCategory) {
      const categore = await Category.findById({ _id: selectedCategory });
      categoryFilter = { category: categore.name };
    }
    switch (sortOption) {
      case 'priceLowToHigh':
        sortQuery = { discountPrice: 1 };
        break;
      case 'priceHighToLow':
        sortQuery = { discountPrice: -1 };
        break;
      case 'releaseDate':
        sortQuery = { productAddDate: -1 };
        break;
      case 'aAtoZZ':
        sortQuery = { name: 1 };
        break;
      case 'zZtoaA':
        sortQuery = { name: -1 };
        break;
      default:
        sortQuery = {};
    }
    const filteredProducts = await Product.find({ ...searchRegex, ...categoryFilter }).sort(sortQuery);
    const totalProducts = await Product.countDocuments({ ...searchRegex, ...categoryFilter });
    res.json({ products: filteredProducts, totalProducts });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound');
  }
};


const loadforgetpasswordotp = async (req, res) => {
  try {
    res.render('forgetpasswordotp')
  } catch (error) {
    console.log(error.message);
  }
}


const verifyEmail = async (req, res) => {
  try {
    console.log("Test for");
    const email = req.body.email;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.render('forgetpassword', { message: 'User with this email does not exist' });
    }
    const otp = generateOTP();
    console.log("passwordresetotp" + otp);
    req.session.otp = otp;
    req.session.userEmail = email;
    req.session.otpExpiration = Date.now() + 60000;
    const mailOptions = {
      from: 'wanderbags29@gmail.com',
      to: email,
      subject: 'OTP for Password Reset',
      text: `Your OTP for password reset is: ${otp}`,
    };
    await transporter.sendMail(mailOptions);
    res.redirect('/forgetpasswordotp');
  } catch (error) {
    console.error('Error verifying email:', error);

  }
};


const verifyForgetPasswordOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    if (req.session.otp !== parseInt(otp)) {
      return res.render('forgetpasswordotp', { message: 'Invalid OTP' });
    }
    if (req.session.otpExpiration < Date.now()) {
      return res.render('forgetpasswordotp', { message: 'OTP has expired' });
    }
    res.redirect('/resetpassword');
  } catch (error) {
    console.error('Error verifying forget password OTP:', error);

  }
};


const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.render('passwordreset', { message: 'Passwords do not match' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { email: req.session.userEmail },
      { password: hashedPassword },
      { new: true }
    );
    if (!user) {
      return res.render('passwordreset', { message: 'User not found' });
    }
    res.redirect('/login');
  } catch (error) {
    console.error('Error resetting password:', error);

  }
};


const loadresetpassword = async (req, res) => {
  try {
    res.render('passwordreset')
  } catch (error) {
    console.log(error.message);
  }
}


const getProductDetails = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id })
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    res.render('productdetails', {
      product, user: userData, cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0,
    });
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound')

  }
};


const userLogout = (req, res) => {
  try {
    req.session.user_id = null;
    req.session.user = false;
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound')
  }

}


const loadprofile = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const orders = await Order.find({ user: user_id }).sort({ orderDate: -1 })
      .populate('cart')
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'title image productPrice'
      }).populate('user', 'name')
      .populate({
        path: 'items.productId',
        select: 'title image productPrice'
      });
    ;
    const userData = await User.findById({ _id: req.session.user_id })
    const wallet = await Wallet.findOne({ user: user_id })
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');
    wallet.transactions.sort((a, b) => b.transactionDate - a.transactionDate);
    res.render('profile', {
      user: userData, orders: orders, wallet: wallet, errorMessage: null, successMessage: null, cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0,
    })
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound')
  }
}


const updateName = async (req, res) => {
  try {
    const { newName } = req.body;
    const userId = req.session.user_id;
    await User.findByIdAndUpdate(userId, { name: newName });
    res.status(200).send('Name updated successfully');
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound');
  }
};


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).send('Current password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
    res.status(200).send('Password changed successfully');
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound');
  }
};


const addAddress = async (req, res) => {
  try {
    const { houseName, street, city, state, country, postalCode, addressType } = req.body;
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    user.address.push({ houseName, street, city, state, country, postalCode, type: addressType });
    await user.save();
    res.status(200).send('Address added successfully');
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound');
  }
};


const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updatedAddress = {
      houseName: req.body.houseName,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      postalCode: req.body.postalCode,
    };
    const user = await User.findOneAndUpdate(
      { _id: req.session.user_id, 'address._id': addressId },
      { $set: { 'address.$': updatedAddress } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.redirect('/pagenotfound');
  }
};


const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.session.user_id
    const user = await User.findByIdAndUpdate({ _id: userId }, { $pull: { address: { _id: addressId } } }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.redirect('/pagenotfound');
  }
};


const loadWishlist = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id })
    const wishlist = await Wishlist.findOne({ user: userData._id }).populate('items.productId');
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate('items.productId');
    res.render('wishList', {
      user: userData, wishlist: wishlist, cartCount: cart?.items?.length || 0,
      wishlistCount: wishlist?.items?.length || 0,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ sucess: false, message: "Product Not Found" });
    }
    let userId = req.session.user_id;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user is not found" });
    }
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        items: [],
        status: "added",
      });
    }


    if (
      wishlist.items.some((item) => item.productId.toString() === productId)
    ) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Item already exists in the wishlist",
        });
    }

    if (wishlist) {
      wishlist.items.push({
        productId: productId,
      });
    }
    await wishlist.save();

    return res.status(200).json({ success: true, message: 'Product added to wishlist successfully' });
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound');
  }
};


const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.session.user_id;
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }
    const index = wishlist.items.findIndex(item => item.productId.toString() === productId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not found in Wishlist' });
    }
    wishlist.items.splice(index, 1);
    await wishlist.save();
    return res.status(200).json({ success: true, message: 'Product removed from Wishlist' });
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound');
  }
};


const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate('user', 'name')
      .populate({
        path: 'items.productId',
        select: 'title image productPrice'
      });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound');
  }
};


const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId
    console.log("orderid,", req.params);
    const order = await Order.findById(orderId)
      .populate('user', 'name')
      .populate({
        path: 'items.productId',
        select: 'title image productPrice'
      });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const invoiceTemplatePath = path.join(
      __dirname,
      "..",
      "views",
      "user",
      "Invoice.ejs"
    );
    const invoiceHtml = await ejs.renderFile(invoiceTemplatePath, {
      order
    });
    const options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm",
    };
    
    pdf.create(invoiceHtml, options).toStream((err, stream) => {
      if (err) {
        console.log("Error generating PDF:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error generating PDF" });
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="Invoice.pdf"'
      );
      stream.pipe(res);
    });
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound');
  }
};



module.exports = {
  loginLoad,
  loadRegister,
  loadotpverify,
  loadHome,
  loadforgetpassword,
  loadforgetpasswordotp,
  loadresetpassword,
  insertuser,
  otpverify,
  resendotp,
  successGoogleLogin,
  failureGoogleLogin,
  verifylogin,
  landingLoad,
  loadshop,
  getProductDetails,
  userLogout,
  pagenotfound,
  loadprofile,
  changePassword,
  updateName,
  addAddress,
  updateAddress,
  deleteAddress,
  sortProducts,
  verifyEmail,
  verifyForgetPasswordOTP,
  resetPassword,
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
  filterProducts,
  getOrderDetails,
  downloadInvoice



}