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
    deleted_at:{
        type:Date,
        default:null
    }
});

module.exports = mongoose.model('Category',categoryName)