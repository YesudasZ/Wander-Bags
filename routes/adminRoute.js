const express = require("express");
const admin_route= express();

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin')



const adminController = require('../controllers/adminController');

admin_route.get('/',adminController.loadLogin)

admin_route.post('/',adminController.verifyLogin)

admin_route.get('/adminpanel',adminController.loadadminpanel)

module.exports = admin_route;