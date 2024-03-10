const User = require('../models/userModel');

const bcrypt = require('bcrypt')



const loadLogin = async (req, res) => {
  try {
    res.render('login')
  } catch (error) {
    console.log(error.message);
  }
}

const verifyLogin = async (req, res) => {
  try {

    const email = req.body.email;
    const password = req.body.password;

    console.log(email);
    console.log(password);

    const userData = await User.findOne({ email: email });
    console.log(userData);
    if (userData) {

      const passwordMatch = await bcrypt.compare(password, userData.password)

      if (passwordMatch) {

        if (userData.is_admin === 0) {
          res.render('login', { message: "Unauthorized" });
        }
        else {
          req.session.user_id = userData._id;
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
  }
}

const loadadminpanel = async (req, res) => {
  try {
    res.render('adminpanel');
  } catch (error) {
    console.log(error.message);
  }
}

const loadcustomers = async (req, res) => {
  try {
    const users = await User.find({is_admin:0})
    res.render('customers',{users});
  } catch (error) {
    console.log(error.message);
  }
}

const loadproducts = async (req, res) => {
  try {
    res.render('products');
  } catch (error) {
    console.log(error.message);
  }
}


const loadcategories = async (req, res) => {
  try {
    res.render('categories');
  } catch (error) {
    console.log(error.message);
  }
}

loadblockUser = async (req, res) => {
  try {
      const userId = req.query.id;
      console.log(userId);
      await User.findByIdAndUpdate(userId, { is_verified: 0 });
      res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
      console.error('Error blocking user:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

loadunblockUser = async (req, res) => {
  try {
      const userId = req.query.id;
      console.log(userId);
      await User.findByIdAndUpdate(userId, { is_verified: 1 });
      res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
      console.error('Error unblocking user:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};






module.exports = {
  loadLogin,
  verifyLogin,
  loadadminpanel,
  loadcustomers,
  loadproducts,
  loadcategories,
  loadblockUser,
  loadunblockUser,
}