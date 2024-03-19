const express = require("express")
const user_route = express();
const auth = require('../middleware/userauth');
const passport = require('passport')
 require('../passport');


 user_route.use(passport.initialize());

 user_route.use(passport.session())

user_route.set('view engine','ejs');
user_route.set('views','./views/user')




const userController = require ('../controllers/userController');

user_route.get('/pagenotfound',userController.pagenotfound)

user_route.get('/',auth.isLogout,userController.landingLoad)

user_route.get('/login',auth.isLogout,userController.loginLoad)

user_route.post('/login',userController.verifylogin)

user_route.get('/signup',userController.loadRegister)

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

user_route.get('/otpverify',userController.loadotpverify)

user_route.post('/otpverify',userController.otpverify)

user_route.post('/resendotp',userController.resendotp)

user_route.get('/home',auth.isLogin,userController.loadHome)

user_route.get('/shop',auth.isLogin,userController.loadshop)

user_route.get('/productdetails/:productId',auth.isLogin,userController.getProductDetails);

user_route.get('/forgetpassword',userController.loadforgetpassword)

user_route.get('/forgetpasswordotp',userController.loadforgetpasswordotp)

user_route.get('/resetpassword',userController.loadresetpassword)

user_route.get('/logout',auth.isLogin, userController.userLogout)

user_route.get('/profile',auth.isLogin,userController.loadprofile)

// POST route to update user's name
user_route.post('/profile/updateName', auth.isLogin, userController.updateName);

// POST route to change user's password
user_route.post('/profile/changePassword', auth.isLogin, userController.changePassword);



module.exports = user_route;