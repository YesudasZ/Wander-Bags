const express = require("express")

const user_route = express();

const session = require("express-session");

const config = require("../config/config");

user_route.use(session({secret:config.sessionSecret}));


user_route.set('view engine','ejs');
user_route.set('views','./views/user')

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}))


const userController = require ('../controllers/userController');

user_route.get('/',userController.loginLoad)

user_route.get('/signup',userController.loadRegister)

user_route.post('/signup',userController.insertuser)




user_route.get('/otpverify',userController.loadotpverify)

user_route.get('/home',userController.loadHome)


user_route.get('/forgetpassword',userController.loadforgetpassword)


user_route.get('/forgetpasswordotp',userController.loadforgetpasswordotp)


user_route.get('/resetpassword',userController.loadresetpassword)

module.exports = user_route;