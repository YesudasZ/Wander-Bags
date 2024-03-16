const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const bcrypt = require('bcrypt')
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs')




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
    const actionType = 'block';
    res.render('customers', { users, actionType });
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

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists' });
    }

    const newCategory = new Category({ name });
    await newCategory.save();
    res.status(201).json({ message: 'Category added successfully' });
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


const getRemovedCategories = async (req, res) => {
  try {
      const removedCategories = await Category.find({ status: 'delete' });
      res.json(removedCategories);
  } catch (error) {
      console.error('Error fetching removed categories:', error);
      res.status(500).send('Internal Server Error');
  }
};

const restoreCategory = async (req, res) => {
  try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId);
      if (!category) {
          return res.status(404).send('Category not found');
      }
      // Restore the category by changing its status to 'active'
      category.status = 'active';
      await category.save();
      res.redirect('/admin/categories');
  } catch (error) {
      console.error('Error restoring category:', error);
      res.status(500).send('Internal Server Error');
  }
};


loadblockUser = async (req, res) => {
  try {
      const userId = req.query.id;
  
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
  
      await User.findByIdAndUpdate(userId, { is_verified: 1 });
      res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
      console.error('Error unblocking user:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};


const getProducts = async (req, res) => {
  try {
    const removedProducts = await Product.find({ status: 'delete' });
      const products = await Product.find({});
     
      res.render('products', { products,removedProducts  });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
};

const addloadProducts = async (req, res) => {
  try {
    const categories = await Category.find({});  
    res.render('addproduct', { categories });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
};


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,path.join(__dirname,'../public/productimages'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage
 }).array('images', 10);




 const addProduct = async (req, res) => {
   try {
     upload(req, res, async function (err) {
       if (err) {
         console.error(err);
         return res.status(400).send('File upload error.');
       }
       const images = [];
 
       // Process each uploaded image
       for (const file of req.files) {
         // Resize image to default size using sharp
         const resizedImageBuffer = await sharp(file.path)
           .resize({ width: 1500, height: 1500 }) // Adjust width and height as needed
           .toBuffer();
 
         // Save resized image with a unique filename
         const resizedFilename = Date.now() + '-' + file.originalname;
         const imagePath = path.join(__dirname, '../public/productimages', resizedFilename);
         fs.writeFileSync(imagePath, resizedImageBuffer);
 
         images.push(resizedFilename);
       }
       
       // Create new product object
       const product = new Product({
         name: req.body.name,
         description: req.body.description,
         images: images,
         price: req.body.price,
         category: req.body.category,
         brand: req.body.brand,
         status: req.body.status,
         countInStock: req.body.countInStock,
         discountPrice: req.body.discountPrice
       });
 
       // Save the product to the database
       await product.save();
       res.redirect('/admin/products')
     });
   } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error');
   }
 };
 

const editProductPage = async (req, res) => {
  const productId = req.params.productId; // Assuming you have a route parameter for the product ID
  try {

    const categories = await Category.find({});  
  

      // Fetch the product from the database
      const product = await Product.findById(productId);
      // Render the edit product page with the product data

      res.render('editproducts', { product , categories });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
  }
};



const uploadForEditProduct = multer({ storage: storage }).array('newImages[]', 10);

const editProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    uploadForEditProduct(req, res, async function (err) {
      if (err) {
        console.error(err);
        return res.status(400).send('File upload error.');
      }
      // Logic to update the product with the provided data
      const updatedProduct = await Product.findByIdAndUpdate(productId, {
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          category: req.body.category,
          brand: req.body.brand,
          status: req.body.status,
          countInStock: req.body.countInStock,
          discountPrice: req.body.discountPrice
      }, { new: true });

      // Logic to delete selected images
      if (req.body.deleteImages && req.body.deleteImages.length > 0) {
          for (const image of req.body.deleteImages) {
              // Delete image file from the server or mark it for deletion depending on your logic
              // Example: fs.unlinkSync(path.join(__dirname, '../public/productimages', image));
          }
          // Remove deleted images from the product
          updatedProduct.images = updatedProduct.images.filter(image => !req.body.deleteImages.includes(image));
      }

      // Logic to add new images
      if (req.files && req.files.length > 0) {
          const newImages = req.files.map(file => file.filename);
          updatedProduct.images = updatedProduct.images.concat(newImages);
      }

      await updatedProduct.save();

      res.redirect('/admin/products');
    });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
  }
};


const deleteProduct = async (req, res) => {
  const productId = req.params.productId; // Assuming the product ID is passed in the URL params
  try {
    // Check if the product ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).send('Invalid product ID');
    }

    // Find the product by ID and set its status to 'delete'
    const product = await Product.findByIdAndUpdate(productId, { status: 'delete' });

    // Check if the product exists
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Send a success response
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const restoreProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
      // Find the product by ID and update its status to 'active'
      const restoredProduct = await Product.findByIdAndUpdate(productId, { status: 'active' }, { new: true });

      if (!restoredProduct) {
          return res.status(404).json({ message: 'Product not found' });
      }

      return res.status(200).json({ message: 'Product restored successfully', product: restoredProduct });
  } catch (error) {
      console.error('Error restoring product:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};


const logout = async(req,res) => {
  req.session.admin_id = "";
  req.session.admin = false;
  res.redirect('/admin');
}

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
  getEditCategoryForm,
  getProducts,
  addloadProducts,
  addProduct,
  editProductPage,
  editProduct,
  deleteProduct,
  getRemovedCategories,
  restoreCategory,
  restoreProduct,
  logout
}