const express = require("express")

const user_route = express();
const auth = require('../middleware/userauth');
const session = require("express-session");

const passport = require('passport')

 require('../passport');
 user_route.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET 
}));

 user_route.use(passport.initialize());

 user_route.use(passport.session())

const config = require("../config/config");


user_route.use(session({secret:config.sessionSecret}));


user_route.set('view engine','ejs');
user_route.set('views','./views/user')

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}))


const userController = require ('../controllers/userController');

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

user_route.get('/productdetails/:productId',auth.isLogin,userController.getProductDetails);

user_route.get('/forgetpassword',userController.loadforgetpassword)


user_route.get('/forgetpasswordotp',userController.loadforgetpasswordotp)


user_route.get('/resetpassword',userController.loadresetpassword)


user_route.get('/logout',auth.isLogin, userController.userLogout)

module.exports = user_route;