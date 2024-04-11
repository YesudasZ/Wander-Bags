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
    default: 0
  },
  is_verified: {
    type: Number,
    default: 0
  },
  address: [{
      houseName:{
        type:String,
        required:true
      },
      street:{
          type:String,
          required:true
      },
      city:{
          type:String,
          required:true
      },
      state:{
          type:String,
          required: true
      },
      country:{
          type:String,
          required: true
      },
      postalCode:{
          type:String,
          required:true
      },
      type:{
          type:String,
          default:'home'
      }
  }],
  refCode:{
      type:String,
      unique:true
  },
  referedBy:{
      type:String,
  }
})

module.exports = mongoose.model('User', userSchema);