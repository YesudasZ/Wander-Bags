const express = require("express")
const user_route = express();
const auth = require('../middleware/userauth');
const passport = require('passport')
 require('../passport');
//  const formData = require('express-form-data');
 //user_route.use(formData.parse());

 user_route.use(passport.initialize());

 user_route.use(passport.session())

user_route.set('view engine','ejs');
user_route.set('views','./views/user')




const userController = require ('../controllers/userController');

const cartController = require ('../controllers/cartController')

const orderController = require ('../controllers/orderController')

const couponController = require('../controllers/couponController')

user_route.get('/pagenotfound',userController.pagenotfound)

user_route.get('/',auth.isLogout,userController.landingLoad)

user_route.get('/login',auth.isLogout,userController.loginLoad)

user_route.post('/login',userController.verifylogin)

user_route.get('/signup',auth.isLogout,userController.loadRegister)

user_route.post('/signup',userController.insertuser)

user_route.get('/auth/google',passport.authenticate('google',{
scope:['profile']  
}));

user_route.get('/auth/google/callback',passport.authenticate('google',{
  successRedirect: '/success', 
		failureRedirect: '/failure'
}))

user_route.get('/success',userController.successGoogleLogin);

user_route.get('/failure',userController.failureGoogleLogin)

user_route.get('/otpverify',auth.isLogout,userController.loadotpverify)

user_route.post('/otpverify',userController.otpverify)

user_route.post('/resendotp',userController.resendotp)

user_route.get('/home',auth.isLogin,userController.loadHome)

user_route.get('/shop',auth.isLogin,userController.loadshop)

user_route.post('/sort-products',auth.isLogin, userController.sortProducts);

user_route.post('/filter-products', auth.isLogin, userController.filterProducts);

user_route.get('/productdetails/:productId',auth.isLogin,userController.getProductDetails);

user_route.get('/forgetpassword',auth.isLogout,userController.loadforgetpassword)

user_route.post('/forgetpassword',userController.verifyEmail)

user_route.get('/forgetpasswordotp',auth.isLogout,userController.loadforgetpasswordotp)

user_route.post('/forgetpasswordotp',userController.verifyForgetPasswordOTP)

user_route.get('/resetpassword',auth.isLogout,userController.loadresetpassword)

user_route.post('/resetpassword',userController.resetPassword)

user_route.get('/logout',auth.isLogin, userController.userLogout)

user_route.get('/profile',auth.isLogin,userController.loadprofile)

user_route.post('/profile/updateName', auth.isLogin, userController.updateName);

user_route.post('/profile/changePassword', auth.isLogin, userController.changePassword);

user_route.post('/profile/addAddress', auth.isLogin, userController.addAddress);

user_route.put('/profile/update-address/:addressId', auth.isLogin, userController.updateAddress);

user_route.delete('/profile/address/:addressId',auth.isLogin, userController.deleteAddress)

user_route.get('/cart',auth.isLogin,cartController.loadCart)

user_route.post('/cart/add',auth.isLogin, cartController.addToCart)

user_route.put('/cart/update/:productId',auth.isLogin, cartController.updateCartItemQuantity);

user_route.delete('/cart/remove/:productId', auth.isLogin,cartController.removeCartItem);

user_route.put('/cart/update', auth.isLogin,cartController.updateCart);

user_route.delete('/cart/clear', auth.isLogin,cartController.clearCart);

user_route.get('/cart/totals',auth.isLogin, cartController.getCartTotals);

user_route.get('/checkout',auth.isLogin,orderController.loadCheckout)

user_route.post('/checkout',auth.isLogin,orderController.placeOrder)

user_route.get('/orderPlaced',auth.isLogin,orderController.loadOderplaced)

user_route.get('/orderFailed',auth.isLogin,orderController.loadOderfailed)

user_route.put('/orders/:id/cancel',auth.isLogin, orderController.cancelOrder);

user_route.put('/orders/:id/return',auth.isLogin, orderController.returnOrderAndRefund);

user_route.post('/create/razorpayOrder',auth.isLogin,orderController.manageRazorpayOrder)

user_route.get('/wishList',auth.isLogin,userController.loadWishlist)

user_route.post('/wishList/add', auth.isLogin, userController.addToWishlist)

user_route.delete('/wishList/remove/:productId', auth.isLogin, userController.removeFromWishlist);

user_route.post('/apply-coupon', auth.isLogin, couponController.applyCoupon);

user_route.post('/remove-coupon', auth.isLogin, couponController.removeCoupon);

user_route.get('/orders/:id',auth.isLogin,userController.getOrderDetails)



module.exports = user_route;