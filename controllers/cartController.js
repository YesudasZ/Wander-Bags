const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')


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


const addToCart = async (req, res) => {
  try {
      const { productId } = req.body;
 
      let userCart = await Cart.findOne({ owner:req.session.user_id});

      if(!userCart){
        userCart = new Cart({
            owner: req.session.user_id,
            items: [],
            billTotal: 0,
        });
    }

 
    const product = await Product.findById(productId);
    if (!product || product.countInStock <= 0) {
        return res.status(400).json({ success: false, message: 'This product is currently unavailable.' });
    }

 
    const existingCartItem = userCart.items.find(item => item.productId.equals(productId));
    if (existingCartItem && existingCartItem.quantity >= 4) {
        return res.status(400).json({ success: false, message: 'You have reached the maximum quantity limit for this product.' });
    }

  
    if (existingCartItem && existingCartItem.quantity + 1 > product.countInStock) {
        return res.status(400).json({ success: false, message: 'Adding this product to the cart would exceed the available stock.' });
    }


    if (existingCartItem) {

        await Cart.updateOne(
            { owner: req.session.user_id, 'items.productId': productId },
            { $inc: { 'items.$.quantity': 1 } }
        );
    } else {
 
        await Cart.updateOne(
            { owner: req.session.user_id },
            { $push: { items: { productId, quantity: 1 } } },
            { upsert: true }
        );
    }

    res.status(200).json({ success: true, message: 'Product added to cart successfully' });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
loadCart,
addToCart
}