const User = require('../models/userModel');
const Order = require("../models/orderModel");
const bcrypt = require('bcrypt')





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
    const users = await User.find({ is_admin: 0 })
    const actionType = 'block';
    res.render('customers', { users, actionType });
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
  updateOrderStatus
}