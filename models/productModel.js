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
        enum: ['active', 'inactive','deleted'],
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
      type:Number,
      default: 0,
    },
    productAddDate:{
      type:Date,
      default:Date.now()
    }
});

module.exports = mongoose.model('Product',Product)