const express = require("express");
const admin_route= express();

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin')



const adminController = require('../controllers/adminController');

admin_route.get('/',adminController.loadLogin)

admin_route.post('/',adminController.verifyLogin)

admin_route.get('/adminpanel',adminController.loadadminpanel)

admin_route.get('/customers',adminController.loadcustomers)


admin_route.post('/block-user',adminController.loadblockUser)

admin_route.post('/unblock-user',adminController.loadunblockUser)

admin_route.get('/categories',adminController.loadcategories)

admin_route.post('/categories',adminController.addCategory)

admin_route.get('/categories/:id/edit',adminController.getEditCategoryForm)

admin_route.post('/categories/:id',adminController.updateCategory)

admin_route.post('/categories/:id/delete', adminController.deleteCategory)

admin_route.get('/products',adminController.getProducts)


admin_route.get('/products/add',adminController.addloadProducts)


module.exports = admin_route;