const mongoose = require('mongoose');


const Product = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true,
    },
    images:[{
        type:String,
        required:true
    }],
    price:{
        type:Number,
        required:true
    },
    category: {
        type: String,
        required:true 
    },
    brand:{
      type:String,
      required:true
    }
    ,
    status: {
        type: String,
        enum: ['active', 'out-of-stock', 'inactive','deleted','Draft'],
        default: 'active'
    },
    countInStock:{
        type:Number,
        required:true,
        default:1
    },
    discountPrice:{
        type: Number,
        default: 0,
     },
    afterDiscount:{
      type:Number
    },
    productAddDate:{
      type:Date,
      default:Date.now()
    }
});

module.exports = mongoose.model('Product',Product)