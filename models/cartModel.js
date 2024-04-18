const mongoose = require('mongoose');
const objectID = mongoose.Schema.Types.ObjectId;

const cartSchema = mongoose.Schema({
    owner: {
        type: objectID,
        required: true,
        ref: 'User'
    },

    items: [{
        productId: {
            type: objectID,
            required: true,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity cannot be less than 1.'],
            default: 1
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Cart',cartSchema);