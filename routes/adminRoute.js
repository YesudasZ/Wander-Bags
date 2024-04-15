const express = require("express");
const admin_route= express();
const auth = require('../middleware/adminauth')

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin')




const adminController = require('../controllers/adminController');

const categoryController = require('../controllers/categoryController')

const productController = require('../controllers/productController')

const couponController = require('../controllers/couponController')


admin_route.get('/errorpage',adminController.errorload)

admin_route.get('/',auth.isAdminLogout,adminController.loadLogin)

admin_route.post('/',auth.isAdminLogout,adminController.verifyLogin)

admin_route.get('/adminpanel',auth.isAdminLogin,adminController.loadadminpanel)

admin_route.get('/salesdata',auth.isAdminLogin,  adminController.getSalesData)

admin_route.get('/customers',auth.isAdminLogin,adminController.loadcustomers)

admin_route.post('/block-user',auth.isAdminLogin,adminController.loadblockUser)

admin_route.post('/unblock-user',auth.isAdminLogin,adminController.loadunblockUser)

admin_route.get('/categories',auth.isAdminLogin,categoryController.loadcategories)

admin_route.post('/categories',auth.isAdminLogin,categoryController.addCategory)

admin_route.get('/categories/:id/edit',auth.isAdminLogin,auth.isAdminLogin,categoryController.getEditCategoryForm)

admin_route.post('/categories/:id',auth.isAdminLogin,categoryController.updateCategory)

admin_route.post('/categories/:id/delete',auth.isAdminLogin ,categoryController.deleteCategory)

admin_route.get('/categories/removed',auth.isAdminLogin, categoryController.getRemovedCategories);

admin_route.post('/categories/:id/restore',auth.isAdminLogin, categoryController.restoreCategory);

admin_route.get('/products',auth.isAdminLogin,productController.getProducts)

admin_route.get('/products/add',auth.isAdminLogin,productController.addloadProducts)

admin_route.post('/products/add',auth.isAdminLogin,productController.addProduct)

admin_route.get('/products/edit/:productId', auth.isAdminLogin,productController.editProductPage);

admin_route.post('/products/edit/:productId',auth.isAdminLogin, productController.editProduct);

admin_route.post('/products/delete/:productId', auth.isAdminLogin,productController.deleteProduct);

admin_route.post('/products/restore/:productId',auth.isAdminLogin, productController.restoreProduct);

admin_route.get('/orders', auth.isAdminLogin, adminController.loadOrders);

admin_route.get('/orders/:id', auth.isAdminLogin, adminController.getOrderDetails);

admin_route.put('/orders/:id', auth.isAdminLogin, adminController.updateOrderStatus);

admin_route.get('/coupons',auth.isAdminLogin,couponController.loadCoupon)

admin_route.post('/addCoupon',auth.isAdminLogin,couponController.addCoupon)

admin_route.patch('/coupons/changeStatus/:couponId', auth.isAdminLogin, couponController.changeCouponStatus);

admin_route.get('/salesReport',auth.isAdminLogin,adminController.SaleReport)

admin_route.get('/offers',auth.isAdminLogin,adminController.loadOffers)

admin_route.post('/offers',auth.isAdminLogin,adminController.createCategoryOffer)

admin_route.post('/productOffers',auth.isAdminLogin,adminController.createProducOffer)

admin_route.get('/logout',auth.isAdminLogin,adminController.logout)

admin_route.get('/*',auth.isAdminLogin,adminController.errorload)

module.exports = admin_route;