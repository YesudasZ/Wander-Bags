const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs')



const loadproducts = async (req, res) => {
  try {
    res.render('products');
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/errorpage')
  }
}

const getProducts = async (req, res) => {
  try {
    const removedProducts = await Product.find({ status: 'delete' });
    const products = await Product.find({});

    res.render('products', { products, removedProducts });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/errorpage')
  }
};

const addloadProducts = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render('addproduct', { categories });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/errorpage')
  }
};


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/productimages'))
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
        res.redirect('/admin/errorpage')
      }
      const images = [];


      for (const file of req.files) {

        const resizedImageBuffer = await sharp(file.path)
          .resize({ width: 1500, height: 1500 })
          .toBuffer();


        const resizedFilename = Date.now() + '-' + file.originalname;
        const imagePath = path.join(__dirname, '../public/productimages', resizedFilename);
        fs.writeFileSync(imagePath, resizedImageBuffer);

        images.push(resizedFilename);
      }


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


      await product.save();
      res.redirect('/admin/products')
    });
  } catch (err) {
    console.error(err.message);
    res.redirect('/admin/errorpage')
  }
};


const editProductPage = async (req, res) => {
  const productId = req.params.productId;
  try {

    const categories = await Category.find({});


    const product = await Product.findById(productId);


    res.render('editproducts', { product, categories });
  } catch (err) {
    console.error(err.message);
    res.redirect('/admin/errorpage')
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


      if (req.body.deleteImages && req.body.deleteImages.length > 0) {
        for (const image of req.body.deleteImages) {

        }

        updatedProduct.images = updatedProduct.images.filter(image => !req.body.deleteImages.includes(image));
      }
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => file.filename);
        updatedProduct.images = updatedProduct.images.concat(newImages);
      }

      await updatedProduct.save();

      res.redirect('/admin/products');
    });
  } catch (err) {
    console.error(err.message);
    res.redirect('/admin/errorpage')
  }
};


const deleteProduct = async (req, res) => {
  const productId = req.params.productId;
  try {

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).send('Invalid product ID');
    }


    const product = await Product.findByIdAndUpdate(productId, { status: 'delete' });


    if (!product) {
      return res.status(404).send('Product not found');
    }


    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/errorpage')
  }
};

const restoreProduct = async (req, res) => {
  const productId = req.params.productId;

  try {

    const restoredProduct = await Product.findByIdAndUpdate(productId, { status: 'active' }, { new: true });

    if (!restoredProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ message: 'Product restored successfully', product: restoredProduct });
  } catch (error) {
    console.error('Error restoring product:', error);
    return res.redirect('/admin/errorpage')
  }
};


module.exports = {
  loadproducts,
  getProducts,
  addloadProducts,
  addProduct,
  editProductPage,
  editProduct,
  deleteProduct,
  restoreProduct,
}