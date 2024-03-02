const express = require("express")

const user_route = express();

user_route.set('view engine','ejs');
user_route.set('views','./views/user')


const userController = require ('../controllers/userController');

user_route.get('/',userController.loginLoad)

user_route.get('/signup',userController.loadRegister)








module.exports = user_route;