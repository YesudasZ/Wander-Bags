const express = require("express");
const admin_route= express();
const auth = require('../middleware/adminauth')
admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin')

const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}))


const adminController = require('../controllers/adminController');

admin_route.get('/',auth.isAdminLogout,adminController.loadLogin)

admin_route.post('/',auth.isAdminLogout,adminController.verifyLogin)

admin_route.get('/adminpanel',auth.isAdminLogin,adminController.loadadminpanel)

admin_route.get('/customers',auth.isAdminLogin,adminController.loadcustomers)


admin_route.post('/block-user',auth.isAdminLogin,adminController.loadblockUser)

admin_route.post('/unblock-user',auth.isAdminLogin,adminController.loadunblockUser)

admin_route.get('/categories',auth.isAdminLogin,adminController.loadcategories)

admin_route.post('/categories',auth.isAdminLogin,adminController.addCategory)

admin_route.get('/categories/:id/edit',auth.isAdminLogin,auth.isAdminLogin,adminController.getEditCategoryForm)

admin_route.post('/categories/:id',auth.isAdminLogin,adminController.updateCategory)

admin_route.post('/categories/:id/delete',auth.isAdminLogin ,adminController.deleteCategory)

admin_route.get('/categories/removed',auth.isAdminLogin, adminController.getRemovedCategories);

admin_route.post('/categories/:id/restore',auth.isAdminLogin, adminController.restoreCategory);

admin_route.get('/products',auth.isAdminLogin,adminController.getProducts)

admin_route.get('/products/add',auth.isAdminLogin,adminController.addloadProducts)

admin_route.post('/products/add',auth.isAdminLogin,adminController.addProduct)

admin_route.get('/products/edit/:productId', auth.isAdminLogin,adminController.editProductPage);

admin_route.post('/products/edit/:productId',auth.isAdminLogin, adminController.editProduct);

admin_route.post('/products/delete/:productId', auth.isAdminLogin,adminController.deleteProduct);

admin_route.post('/products/restore/:productId',auth.isAdminLogin, adminController.restoreProduct);

admin_route.get('/logout',auth.isAdminLogin,adminController.logout)

module.exports = admin_route;