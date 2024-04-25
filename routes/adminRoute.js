const express = require("express");
const admin_route = express();
const auth = require('../middleware/adminauth');

// Setting view engine and views directory for ejs templates
admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

// Importing controllers
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const couponController = require('../controllers/couponController');

// Authentication routes
admin_route.get('/', auth.isAdminLogout, adminController.loadLogin); // Load login page
admin_route.post('/', auth.isAdminLogout, adminController.verifyLogin); // Verify admin login credentials
admin_route.get('/logout', auth.isAdminLogin, adminController.logout); // Logout admin

// Admin panel routes
admin_route.get('/adminpanel', auth.isAdminLogin, adminController.loadadminpanel); // Load admin panel
admin_route.get('/errorpage', adminController.errorload); // Load error page

// Customer management routes
admin_route.get('/customers', auth.isAdminLogin, adminController.loadcustomers); // Load customers
admin_route.post('/block-user', adminController.loadblockUser); // Block a user
admin_route.post('/unblock-user', adminController.loadunblockUser); // Unblock a user

// Category management routes
admin_route.get('/categories', auth.isAdminLogin, categoryController.loadcategories); // Load categories
admin_route.post('/categories',  categoryController.addCategory); // Add a new category
admin_route.get('/categories/:id/edit', auth.isAdminLogin, categoryController.getEditCategoryForm); // Load edit category form
admin_route.post('/categories/:id', categoryController.updateCategory); // Update a category
admin_route.post('/categories/:id/delete', categoryController.deleteCategory); // Delete a category
admin_route.get('/categories/removed', auth.isAdminLogin, categoryController.getRemovedCategories); // Get removed categories
admin_route.post('/categories/:id/restore', categoryController.restoreCategory); // Restore a deleted category

// Product management routes
admin_route.get('/products', auth.isAdminLogin, productController.getProducts); // Load products
admin_route.get('/products/add', auth.isAdminLogin, productController.addloadProducts); // Load add product page
admin_route.post('/products/add', productController.addProduct); // Add a new product
admin_route.get('/products/edit/:productId', auth.isAdminLogin, productController.editProductPage); // Load edit product page
admin_route.post('/products/edit/:productId', productController.editProduct); // Update a product
admin_route.post('/products/delete/:productId', productController.deleteProduct); // Delete a product
admin_route.post('/products/restore/:productId', productController.restoreProduct); // Restore a deleted product

// Order management routes
admin_route.get('/orders', auth.isAdminLogin, adminController.loadOrders); // Load orders
admin_route.get('/orders/:id', auth.isAdminLogin, adminController.getOrderDetails); // Get order details
admin_route.put('/orders/:id', adminController.updateOrderStatus); // Update order status

// Coupon management routes
admin_route.get('/coupons', auth.isAdminLogin, couponController.loadCoupon); // Load coupons
admin_route.post('/addCoupon', couponController.addCoupon); // Add a new coupon
admin_route.delete('/coupons/:couponId', couponController.deleteCoupon); // Delete a coupon
admin_route.patch('/coupons/changeStatus/:couponId',  couponController.changeCouponStatus); // Change coupon status

// Sales and analytics routes
admin_route.get('/salesdata', auth.isAdminLogin, adminController.getSalesData); // Get sales data
admin_route.get('/salesReport', auth.isAdminLogin, adminController.SaleReport); // Load sales report

// Offer management routes
admin_route.get('/offers', auth.isAdminLogin, adminController.loadOffers); // Load offers
admin_route.put('/categories/offers/:id', adminController.updateCategoryOffer); // Update category offer
admin_route.delete('/categories/offers/:id', adminController.deleteCategoryOffer); // Delete category offer
admin_route.post('/offers',  adminController.createCategoryOffer); // Create category offer
admin_route.post('/productOffers', adminController.createProductOffer); // Create product offer
admin_route.delete('/offers/:productId', adminController.removeProductOffer); // Remove product offer
admin_route.post('/applyReferralOffer', adminController.applyReferralOffer); // Apply referral offer

// Fallback route
admin_route.get('/*', auth.isAdminLogin, adminController.errorload); // Load error page for any other route

module.exports = admin_route;