const User = require('../models/userModel');
const Order = require("../models/orderModel");
const bcrypt = require('bcrypt')
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const moment = require('moment');



const errorload = async (req, res) => {
  res.render('errorpage')
}

const loadLogin = async (req, res) => {
  try {
    res.render('login')
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/errorpage')
  }
}

const verifyLogin = async (req, res) => {
  try {

    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {

      const passwordMatch = await bcrypt.compare(password, userData.password)

      if (passwordMatch) {

        if (userData.is_admin === 0) {
          res.render('login', { message: "Unauthorized" });
        }
        else {
          req.session.admin_id = userData._id;
          req.session.admin = true;
          res.redirect("/admin/adminpanel");
        }
      }
      else {

        res.render('login', { message: "Password is incorrect" });
      }

    }
    else {
      res.render('login', { message: "Email and Password is incorrect" });
    }

  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/errorpage')
  }
}

const loadadminpanel = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          $or: [
            { orderStatus: "Delivered" },
            { paymentStatus: "Success" }
          ]
        },
      }, {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$billTotal' }
        }
      }
    ]);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const totalRevenueMonthly = await Order.aggregate([
      {
        $match: {
          $or: [
            { orderStatus: "Delivered" },
            { paymentStatus: "Success" }
          ],
          orderDate: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lt: new Date(currentYear, currentMonth + 1, 1)
          }
        },
      }, {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$billTotal' }
        }
      }
    ]);

    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});

    // Get top 10 products based on total sales
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: {
        _id: '$items.productId',
        totalSales: { $sum: '$items.quantity' },
        productDetails: { $first: '$$ROOT.items' }
      }},
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $project: {
        _id: 0,
        name: '$product.name',
        images: '$product.images',
        discountPrice: '$product.discountPrice',
        status: '$product.status',
        category: '$product.category',
        totalSales: 1
      }},
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);

    // Get top categories based on total sales
    const topCategories = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $group: {
        _id: '$product.category',
        totalSales: { $sum: '$items.quantity' }
      }},
      { $sort: { totalSales: -1 } }
    ]);

    const maxCategorySales = topCategories.length > 0 ? topCategories[0].totalSales : 1;

    res.render('adminpanel', {
      totalOrders: totalOrders,
      totalProducts: totalProducts,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0,
      totalRevenueMonthly: totalRevenueMonthly.length > 0 ? totalRevenueMonthly[0].totalRevenue : 0,
      topProducts: topProducts,
      topCategories: topCategories,
      maxCategorySales: maxCategorySales
    });
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/errorpage')
  }
}



const getSalesData = async (req, res) => {
  try {
    const period = req.query.period;
    let salesData;

    switch (period) {
      case 'weekly':
        salesData = await getWeeklySalesData();
        break;
      case 'monthly':
        salesData = await getMonthlySalesData();
        break;
      case 'yearly':
        salesData = await getYearlySalesData();
        break;
      default:
        return res.status(400).json({ error: 'Invalid period' });
    }

    res.json(salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.redirect('/admin/errorpage')
  }
};

// Helper function to fetch weekly sales data
async function getWeeklySalesData() {
  const currentDate = moment().startOf('week');
  const labels = [];
  const data = [];


  for (let i = 0; i < 7; i++) {
    const day = currentDate.clone().add(i, 'days').format('MM/DD/YYYY');
    labels.push(day);

    const orderCount = await Order.countDocuments({
      orderDate: {
        $gte: currentDate.clone().add(i, 'days').startOf('day').toDate(),
        $lt: currentDate.clone().add(i, 'days').endOf('day').toDate(),
      }
      // ,
      // orderStatus: 'Delivered',
      // paymentStatus: 'Success',
    });

    data.push(orderCount);
  }

  return { labels, data };
}

// Helper function to fetch monthly sales data
async function getMonthlySalesData() {
  const currentDate = moment().startOf('month');
  const labels = [];
  const data = [];

  const daysInMonth = currentDate.daysInMonth();

  for (let i = 1; i <= daysInMonth; i++) {
    const day = currentDate.clone().date(i).format('MM/DD/YYYY');
    labels.push(day);

    const orderCount = await Order.countDocuments({
      orderDate: {
        $gte: currentDate.clone().date(i).startOf('day').toDate(),
        $lt: currentDate.clone().date(i).endOf('day').toDate(),
      }
      // ,
      // orderStatus: 'Delivered',
      // paymentStatus: 'Success',
    });
 
    data.push(orderCount);
  }

  return { labels, data };
}

// Helper function to fetch yearly sales data
async function getYearlySalesData() {
  const currentDate = moment().startOf('year');
  const labels = [];
  const data = [];

  for (let i = 0; i < 12; i++) {
    const month = currentDate.clone().add(i, 'months').format('MMM');
    labels.push(month);

    const orderCount = await Order.countDocuments({
      orderDate: {
        $gte: currentDate.clone().add(i, 'months').startOf('month').toDate(),
        $lt: currentDate.clone().add(i, 'months').endOf('month').toDate(),
      }
      // ,
      // orderStatus: 'Delivered',
      // paymentStatus: 'Success',
    });
  
    data.push(orderCount);
  }

  return { labels, data };
}




const loadcustomers = async (req, res) => {
  try {
    const perPage = 10;
    const page = req.query.page || 1;

    const users = await User.find({ is_admin: 0 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalUsers = await User.countDocuments({ is_admin: 0 });
    const totalPages = Math.ceil(totalUsers / perPage);

    const actionType = 'block';
    res.render('customers', { users, actionType, currentPage: page, totalPages });
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/errorpage')
  }
}



loadblockUser = async (req, res) => {
  try {
    const userId = req.query.id;

    await User.findByIdAndUpdate(userId, { is_verified: 0 });
    if (req.session.user_id === userId) {
      req.session.user = false;
    }
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.redirect('/admin/errorpage')
  }
};

loadunblockUser = async (req, res) => {
  try {
    const userId = req.query.id;

    await User.findByIdAndUpdate(userId, { is_verified: 1 });
    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.redirect('/admin/errorpage')
  }
};




const logout = async (req, res) => {
  try {
    req.session.admin_id = "";
    req.session.admin = false;
    res.redirect('/admin');

  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }

}

const loadOrders = async (req, res) => {
  try {
    const limit = 5; // Number of orders per page
    const page = parseInt(req.query.page) || 1; // Current page number
    const startIndex = (page - 1) * limit;

    const orders = await Order.find({})
      .populate('user', 'name')
      .populate('cart')
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'title image productPrice'
      })
      .sort({ orderDate: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalOrders = await Order.countDocuments({});

    res.render('orders', { orders, page, limit, totalOrders });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage');
  }
};




const getOrderDetails = async (req, res) => {
  try {

    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate('user', 'name')
      .populate({
        path: 'items.productId',
        select: 'title image productPrice'
      });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { orderStatus } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if the payment method is "Cash On Delivery" and the order status is being set to "Delivered"
    if (order.paymentMethod === 'Cash On Delivery' && orderStatus === 'Delivered') {
      // Update the order with the new orderStatus and set paymentStatus to "Success"
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus, paymentStatus: 'Success' },
        { new: true }
      );
      return res.json(updatedOrder);
    }

    // If the conditions are not met, only update the orderStatus
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }
};


const SaleReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    let filter = req.query.filter;
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;

    let query = {
      orderStatus: 'Delivered'
    };

    if (filter === 'day') {
      query.orderDate = {
        $gte: new Date(new Date().setHours(0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59))
      };
    } else if (filter === 'week') {
      query.orderDate = {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        $lt: new Date()
      };
    } else if (filter === 'month') {
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
      query.orderDate = {
        $gte: firstDayOfMonth,
        $lt: lastDayOfMonth
      };
    } else if (filter === 'year') {
      const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
      const lastDayOfYear = new Date(new Date().getFullYear(), 11, 31);
      query.orderDate = {
        $gte: firstDayOfYear,
        $lt: lastDayOfYear
      };
    } else if (filter === 'customDate') {
      query.orderDate = {
        $gte: new Date(startDate),
        $lt: new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 1))
      };
    } else if (filter === 'customDateRange') {
      query.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .populate('user', 'name')
      .populate('cart')
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'title image productPrice'
      })
      .skip(startIndex)
      .limit(limit);

    res.render('salesReport', { orders, page, limit, totalOrders: orders.length });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage');
  }
}


const loadOffers = async (req, res) => {
  try {
    const products = await Product.find({ status: "active" });
    const categories = await Category.find({ status: "active" });
    const user = await User.findById(req.session.admin_id);
    res.render('offers', { products: products, categories: categories ,referredUserReward: user.referredUserReward, referringUserReward: user.referringUserReward});
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage');
  }
}


const applyReferralOffer = async (req, res) => {
  try {console.log("test-0");
    const { referredUserReward, referringUserReward } = req.body;
    console.log("test-1",referredUserReward+"ed"+referringUserReward+'ing');
  
    await User.updateMany({}, { referredUserReward, referringUserReward });
    console.log("test-2");
    const user = await User.findById(req.session.admin_id);

    console.log("test-3" ,user.referredUserReward,user.referringUserReward);
    res.json({
      message: 'Offer successfully applied',
      referredUserReward: user.referredUserReward,
      referringUserReward: user.referringUserReward
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }
};


const createCategoryOffer = async (req, res) => {
  try {
    const { startDate, endDate, category, discountPercentage } = req.body;
    const categore = await Category.findById({ _id: category });
    categore.offer = discountPercentage;
    categore.offerStart = startDate;
    categore.offerEnd = endDate;
    await categore.save();
    const products = await Product.find({ category: categore.name});
    products.forEach((product) => {
      product.discountPrice = product.price - (product.price * (discountPercentage / 100));
      product.afterDiscount = product.price - product.discountPrice ;
      product.save();
    });
    const categories = await Category.find({ status: "active" });
    res.status(200).json({ message: 'Category offer created successfully', categories: categories });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }
};





const updateCategoryOffer = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const { startDate, endDate, discount } = req.body;
    category.offerStart = startDate;
    category.offerEnd = endDate;
    category.offer = discount;

    await category.save();

    const products = await Product.find({ category: category.name });
    products.forEach(product => {
      product.discountPrice = product.price - (product.price * (discount / 100));
      product.afterDiscount = product.price - product.discountPrice;
      product.save();
    });

    res.status(200).json({ success: true, message: 'Category offer updated successfully' });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }
};

const deleteCategoryOffer =async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    category.offer = 0;
    category.offerStart = null;
    category.offerEnd = null;

    await category.save();

    const products = await Product.find({ category: category.name });
    products.forEach(product => {
      product.discountPrice = 0;
      product.afterDiscount = 0;
      product.save();
    });

    res.status(200).json({ success: true, message: 'Category offer deleted successfully' });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }
};




const createProductOffer = async (req, res) => {
   try {
    const { productId, discountPercentage } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const category = await Category.findOne({ name: product.category });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    if (discountPercentage <= category.offer) {
      return res.status(200).json({
        message: `This product has a better offer with the category offer (${category.offer}%)`,
        type: 'info',
      });
    }
    product.discountPrice = product.price - (product.price * (discountPercentage / 100));
    product.afterDiscount = product.price - product.discountPrice;
    await product.save();
    return res.status(200).json({ message: 'Offer applied successfully', type: 'success',product:product });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }
};


const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.discountPrice = 0;
    product.afterDiscount = 0;
    await product.save();
    return res.status(200).json({ message: 'Offer removed successfully', type: 'success' });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage')
  }
};



module.exports = {
  loadLogin,
  verifyLogin,
  loadadminpanel,
  loadcustomers,
  loadblockUser,
  loadunblockUser,
  logout,
  errorload,
  loadOrders,
  getOrderDetails,
  updateOrderStatus,
  SaleReport,
  loadOffers,
  createCategoryOffer,
  createProductOffer,
  getSalesData,
  applyReferralOffer,
  deleteCategoryOffer,
  updateCategoryOffer,
  removeProductOffer
}