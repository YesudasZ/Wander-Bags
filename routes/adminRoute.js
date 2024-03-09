const express = require("express");
const admin_route= express();

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin')



const adminController = require('../controllers/adminController');

admin_route.get('/',adminController.loadLogin)

admin_route.post('/',adminController.verifyLogin)

admin_route.get('/adminpanel',adminController.loadadminpanel)

admin_route.get('/customers',adminController.loadcustomers)

admin_route.get('/products',adminController.loadproducts)

admin_route.get('/categories',adminController.loadcategories)

admin_route.get('/edit-user',adminController.loadedituser)

module.exports = admin_route;