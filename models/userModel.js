const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String, 
    required: true
  },
  mobile: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  is_admin: {
    type: Number,
    required: true,

  },
  is_block: {
    type: Number,
    required: true,
    default: false
  },
  verified: Boolean,
  otp:{
    type:Number,
    required: true
  }



})

module.exports = mongoose.model('User', userSchema);