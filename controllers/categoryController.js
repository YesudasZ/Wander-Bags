const Category = require('../models/categoryModel');
const Product = require('../models/productModel');


const loadcategories = async (req, res) => {
    try {
      const limit = 10; // Number of categories per page
      const page = parseInt(req.query.page) || 1; // Current page number
  
      const categories = await Category.find({})
        .skip((page - 1) * limit)
        .limit(limit);
  
      const total = await Category.countDocuments({});
  
      res.render('categories', { categories, page, total, limit });
    } catch (error) {
      console.log(error.message);
      res.redirect('/admin/errorpage');
    }
  };

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists' });
    }

    const newCategory = new Category({ name });
    await newCategory.save();
    res.status(201).json({ message: 'Category added successfully' });
} catch (err) {
    console.error(err);
    res.redirect('/admin/errorpage')
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
      res.redirect('/admin/errorpage')
  }
};

const deleteCategory = async (req, res) => {
  try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId);
      if (!category) {
          return res.status(404).send('Category not found');
      }
      
      category.status = 'delete';
      await category.save();
   
      res.redirect('/admin/categories');
  } catch (error) {
      console.error('Error deleting category:', error);
      res.redirect('/admin/errorpage')
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
      res.redirect('/admin/errorpage')
  }
};


const getRemovedCategories = async (req, res) => {
  try {
      const removedCategories = await Category.find({ status: 'delete' });
      res.json(removedCategories);
  } catch (error) {
      console.error('Error fetching removed categories:', error);
      res.redirect('/admin/errorpage')
  }
};

const restoreCategory = async (req, res) => {
  try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId);
      if (!category) {
          return res.status(404).send('Category not found');
      }
     
      category.status = 'active';
      await category.save();
      res.redirect('/admin/categories');
  } catch (error) {
      console.error('Error restoring category:', error);
      res.redirect('/admin/errorpage')
  }
};

module.exports = {
  loadcategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getEditCategoryForm,
  getRemovedCategories,
  restoreCategory,
}