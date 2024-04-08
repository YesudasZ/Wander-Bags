const User = require('../models/userModel');
const Order = require("../models/orderModel");
const bcrypt = require('bcrypt')
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');



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
    res.render('adminpanel');
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/errorpage')
  }
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
    res.redirect('/admin/errorpage')
  }

}

const loadOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    const orders = await Order.find({})
      .populate('user', 'name')
      .populate('cart')
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'title image productPrice'
      })
      .skip(startIndex)
      .limit(limit);

    res.render('orders', { orders, page, limit, totalOrders: orders.length });
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
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { orderStatus } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const SaleReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    let filter = req.query.filter;
    let date = req.query.date;

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
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
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


const loadOffers = async  (req, res) => {
  try {
    const products  = await Product.find({ status: "active" });
    const categories = await Category.find({ status: "active" });
    res.render('offers',{products: products ,categories : categories});
  } catch (error) {
    console.error(error);
    res.redirect('/admin/errorpage');
  }
}

const createCategoryOffer = async (req, res) => {

  try {
    const { startDate, endDate, category, discountPercentage } = req.body;
    const categore = await Category.findById({ _id:category  });
    categore.offer = discountPercentage;
    categore.offerStart= startDate;
    categore.offerEnd=endDate;
    await categore.save();
    const products = await Product.find({ category:categore.name });
  
    products.forEach((product) => {
   
      product.afterDiscount = product.discountPrice;
      product.discountPrice = product.discountPrice - (product.discountPrice * (discountPercentage / 100));
      product.save();
    });
   
    res.status(200).json({ message: 'Category offer created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category offer' });
  }
};

const createProducOffer = async (req, res) => {
  try {
    const { productId, discountPercentage } = req.body;
    console.log("ok",discountPercentage);
    const product = await Product.findById({ _id:productId  });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
console.log("test-1",product.discountPrice - (product.discountPrice * (discountPercentage / 100)));
console.log("test-2",(product.afterDiscount * (discountPercentage / 100)),"test-2.1",product.afterDiscount - product.discountPrice);
    if( product.discountPrice > product.afterDiscount ){
      product.afterDiscount = product.discountPrice;
      product.discountPrice = product.discountPrice - (product.discountPrice * (discountPercentage / 100));
      product.save();
    }else if(product.afterDiscount - product.discountPrice < (product.afterDiscount * (discountPercentage / 100))){
      product.discountPrice = product.discountPrice - (product.discountPrice * (discountPercentage / 100));
      product.save();
    }else{
      return res.status(404).json({ message: "The product has a better offer with the category offer." });
    }
 
    const discountAmount =  product.afterDiscount - product.discountPrice;
  
    res.status(200).json({ message: 'Discount applied', discountAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error applying discount' });
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
  createProducOffer
}