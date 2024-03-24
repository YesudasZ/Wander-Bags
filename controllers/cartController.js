const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')


const loadCart = async (req,res)=>{
  try {
    const  userData = await User.findById({_id:req.session.user_id})
    const cart = await Cart.findOne({owner:userData._id});

    res.render('cart', { cart:cart,user:userData });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


const addToCart = async (req, res) => {
  try {
      const { productId } = req.body;
      let userCart = await Cart.findOne({ owner: req.session.user_id });

      if (!userCart) {
        userCart = new Cart({
          owner:req.session.user_id,
          items: [],
          billTotal: 0,
      });
      }

      const product = await Product.findById(productId);
console.log("Images"+product.images);
      if (!product || product.countInStock <= 0) {
          return res.status(400).json({ success: false, message: 'This product is currently unavailable.' });
      }

      const existingCartItemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);

      if (existingCartItemIndex !== -1) {
          const cartItem = userCart.items[existingCartItemIndex];
          if (cartItem.quantity >= 4 || cartItem.quantity >= product.countInStock) {
              return res.status(403).json({ success: false, message: 'Maximum quantity limit reached for this product.' });
          }
          if (cartItem.quantity + 1 > product.countInStock) {
              return res.status(403).json({ success: false, message: 'Product out of stock.' });
          }
          cartItem.quantity += 1;
          cartItem.price = cartItem.quantity * product.discountPrice;
          userCart.items[existingCartItemIndex] = cartItem;
      } else {
          if (product.countInStock < 1) {
              return res.status(403).json({ success: false, message: 'Product out of stock.' });
          }
          if (product.countInStock <= 2 && product.countInStock >= 1) {
              const quantityToAdd = product.countInStock <= 4 ? product.countInStock : 4;
              userCart.items.push({
                  productId: productId,
                  title: product.name,
                  image: product.images,
                  productPrice: product.discountPrice,
                  quantity: quantityToAdd,
                  price: quantityToAdd * product.discountPrice,
                  productStatus: 'active',
                  selected: false
              });
          } else {
              userCart.items.push({
                  productId: productId,
                  title: product.name,
                  image: product.images,
                  productPrice: product.discountPrice,
                  quantity: 1,
                  price: product.discountPrice,
                  productStatus: 'active',
                  selected: false
              });
          }
      }

      userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0);
      await userCart.save();
      
      res.status(200).json({ success: true, message: 'Product added to cart successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


module.exports = {
loadCart,
addToCart
}