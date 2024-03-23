const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const { render } = require('../routes/userRoute');

const loadCart = async (req,res)=>{
  try {
    const  userData = await User.findById({_id:req.session.user_id})
    const products = await Product.find();

    res.render('cart', { products,user:userData });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


module.exports = {
loadCart

}