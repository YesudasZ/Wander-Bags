const User = require('../models/userModel');
const Category = require('../models/categoryModel');

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
    const categories = await Category.find({});
    res.render('categories', { categories });
  } catch (error) {
    console.log(error.message);
  }
}

const addCategory = async (req, res) => {
  try {
      const { name } = req.body;
      if (!name) {
          return res.status(400).json({ message: 'Category name is required' });
      }
      const newCategory = new Category({ name });
      await newCategory.save();
      res.redirect('/admin/categories');
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
};


 const updateCategory = async (req, res) => {
  try {
      const { id } = req.params;
      const { name, status } = req.body;
      if (!name) {
          return res.status(400).json({ message: 'Category name is required' });
      }
      const category = await Category.findById(id);
      if (!category) {
          return res.status(404).json({ message: 'Category not found' });
      }
      category.name = name;
      category.status = status;
      await category.save();
      res.redirect('/admin/categories');
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
};

const deleteCategory = async (req, res) => {
  try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId);
      if (!category) {
          return res.status(404).send('Category not found');
      }
      // Soft delete: Update category status to 'deleted'
      category.status = 'delete';
      await category.save();
     // req.flash('successMessage', 'Category deleted successfully');
      res.redirect('/admin/categories');
  } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).send('Internal Server Error');
  }
};


 const getEditCategoryForm = async (req, res) => {
  try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId);
      if (!category) {
          return res.status(404).send('Category not found');
      }
      res.render('editcategory', { category });
  } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).send('Internal Server Error');
  }
};


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
  addCategory,
  updateCategory,
  deleteCategory,
  getEditCategoryForm
}