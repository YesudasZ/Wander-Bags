const express = require("express");
const user_route = express();
const auth = require('../middleware/userauth');
//const passport = require('passport');
//require('../passport');

// Initialize Passport
user_route.use(passport.initialize());
user_route.use(passport.session());

// Set view engine and views directory
user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');

// Importing controllers
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');

// Error handling routes
user_route.get('/pagenotfound', userController.pagenotfound); // Load 'Page Not Found' page

// Authentication routes
user_route.get('/', auth.isLogout, userController.landingLoad); // Load landing page
user_route.get('/login', auth.isLogout, userController.loginLoad); // Load login page
user_route.post('/login', userController.verifylogin); // Verify user login
user_route.get('/signup', auth.isLogout, userController.loadRegister); // Load signup page
user_route.post('/signup', userController.insertuser); // Insert new user
user_route.get('/logout', auth.isLogin, userController.userLogout); // Logout user

// Google authentication routes
//user_route.get('/auth/google', passport.authenticate('google', { scope: ['profile'] })); // Google authentication
//user_route.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/success', failureRedirect: '/failure' })); // Google authentication callback
//user_route.get('/success', userController.successGoogleLogin); // Successful Google login
//user_route.get('/failure', userController.failureGoogleLogin); // Failed Google login

// OTP verification routes
user_route.get('/otpverify', auth.isLogout, userController.loadotpverify); // Load OTP verification page
user_route.post('/otpverify', userController.otpverify); // Verify OTP
user_route.post('/resendotp', userController.resendotp); // Resend OTP

// User profile and settings routes
user_route.get('/home', auth.isLogin, userController.loadHome); // Load home page
user_route.get('/profile', auth.isLogin, userController.loadprofile); // Load user profile
user_route.post('/profile/updateName', auth.isLogin, userController.updateName); // Update user name
user_route.post('/profile/changePassword', auth.isLogin, userController.changePassword); // Change user password
user_route.post('/profile/addAddress', auth.isLogin, userController.addAddress); // Add user address
user_route.put('/profile/update-address/:addressId', auth.isLogin, userController.updateAddress); // Update user address
user_route.delete('/profile/address/:addressId', auth.isLogin, userController.deleteAddress); // Delete user address

// Password reset routes
user_route.get('/forgetpassword', auth.isLogout, userController.loadforgetpassword); // Load forget password page
user_route.post('/forgetpassword', userController.verifyEmail); // Verify email for password reset
user_route.get('/forgetpasswordotp', auth.isLogout, userController.loadforgetpasswordotp); // Load forget password OTP page
user_route.post('/forgetpasswordotp', userController.verifyForgetPasswordOTP); // Verify forget password OTP
user_route.get('/resetpassword', auth.isLogout, userController.loadresetpassword); // Load reset password page
user_route.post('/resetpassword', userController.resetPassword); // Reset password

// Shopping cart routes
user_route.get('/cart', auth.isLogin, cartController.loadCart); // Load shopping cart
user_route.post('/cart/add', auth.isLogin, cartController.addToCart); // Add item to cart
user_route.put('/cart/update/:productId', auth.isLogin, cartController.updateCartItemQuantity); // Update cart item quantity
user_route.delete('/cart/remove/:productId', auth.isLogin, cartController.removeCartItem); // Remove cart item
user_route.put('/cart/update', auth.isLogin, cartController.updateCart); // Update cart
user_route.delete('/cart/clear', auth.isLogin, cartController.clearCart); // Clear cart
user_route.get('/cart/totals', auth.isLogin, cartController.getCartTotals); // Get cart totals

// Checkout and order routes
user_route.get('/checkout', auth.isLogin, orderController.loadCheckout); // Load checkout page
user_route.post('/checkout', auth.isLogin, orderController.placeOrder); // Place order
user_route.get('/cart/items', orderController.checkQuantity); // Check item quantity
user_route.get('/orderPlaced', auth.isLogin, orderController.loadOderplaced); // Load order placed page
user_route.get('/orderFailed', auth.isLogin, orderController.loadOderfailed); // Load order failed page
user_route.put('/orders/:orderId/items/:itemIndex/cancel', auth.isLogin, orderController.cancelOrder); // Cancel order
user_route.put('/orders/:id/return', auth.isLogin, orderController.returnOrderAndRefund); // Return order and refund
user_route.post('/create/razorpayOrder', auth.isLogin, orderController.manageRazorpayOrder); // Manage Razorpay order
user_route.post('/retry/razorpayOrder', auth.isLogin, orderController.retryRazorpayOrder); // Retry Razorpay order
user_route.patch('/update/paymentStatus', auth.isLogin, orderController.updatePaymentStatus); // Update payment status
user_route.get('/wallet/balance', auth.isLogin, orderController.getWalletBalance); // Get wallet balance
user_route.get('/orders/:id', auth.isLogin, userController.getOrderDetails); // Get order details
user_route.get('/orders/:orderId/invoice', auth.isLogin, userController.downloadInvoice); // Download order invoice

// Product and shop routes
user_route.get('/shop', auth.isLogin, userController.loadshop); // Load shop page
user_route.post('/sort-products', userController.sortProducts); // Sort products
user_route.post('/filter-products', userController.filterProducts); // Filter products
user_route.get('/productdetails/:productId', auth.isLogin, userController.getProductDetails); // Get product details

// Wishlist routes
user_route.get('/wishList', auth.isLogin, userController.loadWishlist); // Load wishlist
user_route.post('/wishList/add', auth.isLogin, userController.addToWishlist); // Add item to wishlist
user_route.delete('/wishList/remove/:productId', auth.isLogin, userController.removeFromWishlist); // Remove item from wishlist

// Coupon routes
user_route.get('/coupons/:id', auth.isLogin, couponController.getCoupons); // Get coupons
user_route.post('/apply-coupon', auth.isLogin, couponController.applyCoupon); // Apply coupon
user_route.post('/remove-coupon', auth.isLogin, couponController.removeCoupon); // Remove coupon

module.exports = user_route;