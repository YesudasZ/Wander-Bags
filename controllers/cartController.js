const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')

const loadCart = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id })
        const cart = await Cart.findOne({ owner: userData._id }).populate('items.productId');
        const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.productId');

        res.render('cart', { cart: cart, user: userData,   cartCount: cart?.items?.length || 0,
            wishlistCount: wishlist?.items?.length || 0, });
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
                owner: req.session.user_id,
                items: [],
               
            });
        }

        const product = await Product.findById(productId);

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
                  
                    quantity: quantityToAdd,
                    
                });
            } else {
                userCart.items.push({
                    productId: productId,
                   
                    quantity: 1,
                    
                });
            }
        }

       
        await userCart.save();

        res.status(200).json({ success: true, message: 'Product added to cart successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



const updateCartItemQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        let userCart = await Cart.findOne({ owner: req.session.user_id });
        if (!userCart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        const existingCartItemIndex = userCart.items.findIndex(item => item._id.toString() === productId);
        if (existingCartItemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }
        const cartItem = userCart.items[existingCartItemIndex];
        const product = await Product.findById(cartItem.productId);

        if (!product || product.countInStock <= 0) {
            return res.status(400).json({ success: false, message: 'This product is currently unavailable.' });
        }

        if (quantity > product.countInStock) {
            return res.status(403).json({ success: false, message: 'Maximum quantity limit reached for this product.' });
            // cartItem.quantity = product.countInStock;
            // cartItem.productStatus = 'Limit-Exceeded';
        } else if (quantity > 4) {
            return res.status(403).json({ success: false, message: 'Maximum quantity limit reached for this product.' });
        } else {
            cartItem.quantity = quantity;
            cartItem.productStatus = 'active';
        }

        cartItem.price = cartItem.quantity * product.discountPrice;
        userCart.items[existingCartItemIndex] = cartItem;

        userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0);
        await userCart.save();

        res.status(200).json({ success: true, message: 'Cart item quantity updated successfully', newPrice: cartItem.price });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const removeCartItem = async (req, res) => {
    try {

        const { productId } = req.params;

        let userCart = await Cart.findOne({ owner: req.session.user_id });

        if (!userCart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = userCart.items.findIndex(item => item._id.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        userCart.items.splice(itemIndex, 1);
        userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0);
        await userCart.save();

        res.status(200).json({ success: true, message: 'Item removed from cart successfully', itemIndex: itemIndex + 1 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const updateCart = async (req, res) => {
    try {
        let userCart = await Cart.findOne({ owner: req.session.user_id });

        if (!userCart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const updatedItems = [];

        for (let i = 0; i < userCart.items.length; i++) {
            const item = userCart.items[i];
            const product = await Product.findById(item.productId);

            if (!product || product.countInStock <= 0) {
                userCart.items.splice(i, 1);
                i--;
                continue;
            }

            if (item.quantity > product.countInStock) {
                item.quantity = product.countInStock;
                item.productStatus = 'Limit-Exceeded';
            } else {
                item.productStatus = 'active';
            }

            item.price = item.quantity * product.discountPrice;
            userCart.items[i] = item;

            updatedItems.push({
                itemIndex: i + 1,
                productId: item.productId,
                price: item.price,
                productStatus: item.productStatus,
                countInStock: product.countInStock
            });
        }

        userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0);
        await userCart.save();

        res.status(200).json({ success: true, message: 'Cart updated successfully', updatedItems });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const clearCart = async (req, res) => {
    try {
        let userCart = await Cart.findOne({ owner: req.session.user_id });

        if (!userCart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        userCart.items = [];
        userCart.billTotal = 0;
        await userCart.save();

        res.status(200).json({ success: true, message: 'Cart cleared successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const getCartTotals = async (req, res) => {
    try {
        const userCart = await Cart.findOne({ owner: req.session.user_id });

        if (!userCart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        res.status(200).json({ success: true, billTotal: userCart.billTotal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};




module.exports = {
    loadCart,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    updateCart,
    clearCart,
    getCartTotals
}