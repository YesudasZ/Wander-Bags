const mongoose = require('mongoose');


const categoryName = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    status: {
        type: String,
        enum: ['active', 'inactive','delete'],
        default: 'active'
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
   offer:{
        type:Number,
        default:0
    },
    offerStart:{
        type:Date,
        default:null
    },
    offerEnd:{
        type:Date, 
        default:null
    },
});

module.exports = mongoose.model('Category',categoryName)