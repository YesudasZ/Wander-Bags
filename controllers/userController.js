const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order =  require("../models/orderModel");
const bcrypt = require('bcrypt')




const nodemailer = require("nodemailer");


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit OTP
}

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "wanderbags29@gmail.com",
    pass: "ghmk tzmh sjxw ymeq"
  }
})




const securePassword = async (password) => {
  try {

    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;

  } catch (error) {
    console.log(error.message);
  }
}



const successGoogleLogin = (req , res) => { 
	if(!req.user) 
		res.redirect('/failure'); 
    console.log(req.user);
	res.send("Welcome " + req.user.displayName); 
}


const failureGoogleLogin = (req , res) => { 
	res.send("Error"); 
}


const pagenotfound = async(req,res)=>{
  res.render('pagenotfound')
}



const landingLoad = async (req, res) => {

  try {
    const products = await Product.find();

    res.render('landing', { products });

  } catch (error) {

    console.log(error.message);
    res.redirect('/pagenotfound')

  }

}





const insertuser = async (req, res) => {
  try {
    const email = req.body.email;
    const mobileNumber = req.body.mobile;
    const existingemail = await User.findOne({ email: email })
    const existingnumber = await User.findOne({ mobile: mobileNumber })
    if (existingemail) {
      return res.render("signup", { message: "Email already exists" })
    }
    if (existingnumber) {
      return res.render("signup", { message: "Mobile already exists" })
    }

  

    const otp = generateOTP();

    console.log(otp);

    const details = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: req.body.password,
      is_admin: 0,
      is_verified: 0,
      otp: otp,
      otpExpiration: Date.now() + 60000
    };

    req.session.details = details
    req.session.save();

    res.redirect('/otpverify')

  console.log(req.session.otp);

    const mailoptions = {
      from: "wanderbags29@gmail.com",
      to: req.body.email,
      subject: 'OTP Verification',
      text: `Your OTP for verification is: ${otp}`
    }
    await transporter.sendMail(mailoptions);

   

  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}

const sendotp = (email,otp) =>{
  const mailoptions = {
    from:'wanderbags29@gmail.com',
    to:email,
    subject: 'OTP Verification',
    text: `Your OTP for verification is: ${otp}`
  }
    transporter.sendMail(mailoptions);
}

const regenerateOTP = (email)=>{
  try {
    const otp = generateOTP();
    sendotp(email,otp);
    return otp;
  
  } catch (error) {
    res.redirect('/pagenotfound')
  }

}



const resendotp = async(req,res)=>{
  try {
    const details = req.session.details;
    const otp = regenerateOTP(details.email);
    console.log('resend',otp);
    req.session.details.otp=otp;
    req.session.details.otpExpiration=Date.now() + 60000
    req.session.save();
    res.json({ success: true, message: 'OTP resend successfully' });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
 

const loginLoad = async (req, res) => {

  try {

    res.render('login')

  } catch (error) {

    console.log(error.message);
    res.redirect('/pagenotfound')
  }

}


const loadRegister = async (req, res) => {
  try {
    res.render('signup');
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


const verifylogin = async (req, res) => {
    try {
        const {email,password} = req.body;
      
        const userData = await User.findOne({ email: email });
      
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password)
            if(passwordMatch){
                if(userData.is_verified == 0){
                    res.render('login',{message:"Unauthorized Access."})
                }else{
                    req.session.user_id = userData._id;
                    req.session.user = true;
                    res.redirect('/home');
                }
            }else{
                res.render('login',{message:"Password is incorrect"});
            }
            
        }else{
           res.render('login',{message:"*Invalid username and password"});
        }

         } catch (error) {
        console.log(error.message)
        res.redirect('/pagenotfound')
    }
};




const loadotpverify = async (req, res) => {
  try {
    res.render('otpverify');
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}

const otpverify = async (req, res) => {
  try {
    const otpcheck = await parseInt(req.body.otp);
    console.log( otpcheck);
    
    console.log(req.session.details.otp);
    const dbotp = req.session.details.otp
    console.log(dbotp);

    // Check if OTP matches
    if (dbotp == otpcheck) {
      // Check if OTP has expired
      if (req.session.details.otpExpiration < Date.now()) {
        return res.render('otpverify', { message: 'OTP has expired' });
      }
      const spassword = await securePassword(req.session.details.password);
      const user = new User({
        name: req.session.details.name,
        email: req.session.details.email,
        mobile: req.session.details.mobile,
        password: spassword,
        is_admin: 0,
        is_verified: 1
      });
     const userData = await user.save();

      req.session.user_id = userData._id;
      req.session.user = true;
      res.redirect('/home');

      
    }

    else {
      return res.render('otpverify', { message: 'Invalid OTP' });
    }

  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
   
  }
}


const loadshop =async (req, res) => {
  try {
    const  userData = await User.findById({_id:req.session.user_id})
    const products = await Product.find();

    res.render('shop', { products,user:userData });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}


const loadHome = async (req, res) => {
  try {
    const  userData = await User.findById({_id:req.session.user_id})
    const products = await Product.find();

    res.render('home', { products,user:userData });
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}

const sortProducts = async (req, res) => {
  try {
    const { sortOption } = req.body;
    let sortQuery = {};

    switch (sortOption) {
      case 'Price: Low to High':
        sortQuery = { discountPrice: 1 };
        break;
      case 'Price: High to Low':
        sortQuery = { discountPrice: -1 };
        break;
      case 'Release Date':
        sortQuery = { productAddDate: -1 };
        break;
      default:
        sortQuery = {};
    }

    const sortedProducts = await Product.find().sort(sortQuery);
    res.json(sortedProducts);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Server error' });
  }
};


const loadforgetpassword = async (req, res) => {
  try {
    res.render('forgetpassword')
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}



const loadforgetpasswordotp = async (req, res) => {
  try {
    res.render('forgetpasswordotp')
  } catch (error) {
    console.log(error.message);
  }
}

const verifyEmail = async (req, res) => {
  try {
    console.log("Test for");
    const email = req.body.email;
console.log("e"+email);
    // Check if the user with the provided email exists
    const existingUser = await User.findOne({ email });
console.log("ex"+existingUser);
    if (!existingUser) {
      return res.render('forgetpassword', { message: 'User with this email does not exist' });
    }

    // Generate OTP
    const otp = generateOTP();
console.log("passwordresetotp" + otp);
    // Save OTP and OTP expiration time in session
    req.session.otp = otp;
    req.session.userEmail = email;
    req.session.otpExpiration = Date.now() + 60000; // OTP expiration time: 1 minute

    // Send OTP to the user's email
    const mailOptions = {
      from: 'wanderbags29@gmail.com',
      to: email,
      subject: 'OTP for Password Reset',
      text: `Your OTP for password reset is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
console.log("all");
    // Redirect to OTP verification page
    res.redirect('/forgetpasswordotp');

  } catch (error) {
    console.error('Error verifying email:', error);
    res.redirect('/pagenotfound');
  }
};

const verifyForgetPasswordOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    // Check if the provided OTP matches the one stored in the session
    if (req.session.otp !== parseInt(otp)) {
      return res.render('otpverify', { message: 'Invalid OTP' });
    }

    // Check if the OTP has expired
    if (req.session.otpExpiration < Date.now()) {
      return res.render('otpverify', { message: 'OTP has expired' });
    }

    // If OTP is valid and not expired, redirect to reset password page
    res.redirect('/resetpassword');

  } catch (error) {
    console.error('Error verifying forget password OTP:', error);
    res.redirect('/pagenotfound');
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return res.render('resetpassword', { message: 'Passwords do not match' });
    }

    // Check if newPassword meets any specific criteria (e.g., minimum length, complexity)
    // You can add your password validation logic here if needed

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    const user = await User.findOneAndUpdate(
      { email: req.session.userEmail },
      { password: hashedPassword },
      { new: true }
    );

    // Check if the user exists
    if (!user) {
      return res.render('resetpassword', { message: 'User not found' });
    }

    // Redirect the user to the login page with a success message
    res.render('login', { message: 'Password reset successfully. Please login with your new password.' });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.redirect('/pagenotfound');
  }
};


const loadresetpassword = async (req, res) => {
  try {
    res.render('passwordreset')
  } catch (error) {
    console.log(error.message);
    res.redirect('/pagenotfound')
  }
}

const getProductDetails = async (req, res) => {
  try {
    console.log( req.params.productId);
    const  userData = await User.findById({_id:req.session.user_id})
    console.log( req.params.productId);
      const productId = req.params.productId;
      const product = await Product.findById(productId);
      res.render('productdetails', { product,user:userData });
  } catch (error) {
      console.error(error);
      res.redirect('/pagenotfound')
     
  }
};

const userLogout = (req,res) => {
  try {
    req.session.user_id = null;
    req.session.user = false;
    res.redirect('/');
    
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound')
  }
 
}

const loadprofile = async(req,res)=>{
  try {
    const user_id = req.session.user_id
    const orders= await Order.find({user:user_id})
    const  userData = await User.findById({_id:req.session.user_id})
    res.render('profile',{user:userData,orders:orders, errorMessage: null,successMessage: null})
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound')
  }
}

// Function to update user's name
const updateName = async (req, res) => {
  try {
      const { newName } = req.body;
      const userId = req.session.user_id;

      // Update user's name in the database
      await User.findByIdAndUpdate(userId, { name: newName });

      res.status(200).send('Name updated successfully');
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};

// Function to change user's password
const changePassword = async (req, res) => {
  try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.user_id;

      // Find the user by ID
      const user = await User.findById(userId);

      // Compare current password with the hashed password stored in the database
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
          return res.status(400).send('Current password is incorrect');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password in the database
      await User.findByIdAndUpdate(userId, { password: hashedPassword });

      res.status(200).send('Password changed successfully');
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};

const addAddress = async (req, res) => {
  try {
      const { houseName, street, city, state, country, postalCode, addressType } = req.body;
      const userId = req.session.user_id;
    
      const user = await User.findById(userId);
      user.address.push({ houseName, street, city, state, country, postalCode, type: addressType });
      await user.save();
      res.status(200).send('Address added successfully');
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};


const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const updatedAddress = {
      houseName: req.body.houseName,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      postalCode: req.body.postalCode,
    };
   
    const user = await User.findOneAndUpdate(
      {_id:req.session.user_id,'address._id': addressId },
      { $set: { 'address.$': updatedAddress } },
      { new: true }
    );
   
 
    if (!user) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }
    
    return res.json({ success: true});

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};


const deleteAddress =async (req, res) => {
  try {
    const {  addressId } = req.params;
    const userId   =req.session.user_id
    // Find the user by ID and update the address array to remove the specified address ID
    const user = await User.findByIdAndUpdate({_id:userId}, { $pull: { address: { _id: addressId } } }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while deleting the address' });
  }
};




module.exports = {
  loginLoad,
  loadRegister,
  loadotpverify,
  loadHome,
  loadforgetpassword,
  loadforgetpasswordotp,
  loadresetpassword,
  insertuser,
  otpverify,
  resendotp,
  successGoogleLogin,
  failureGoogleLogin,
  verifylogin,
  landingLoad,
  loadshop,
  getProductDetails,
  userLogout,
  pagenotfound,
  loadprofile,
  changePassword,
  updateName,
  addAddress,
  updateAddress,
  deleteAddress,
  sortProducts,
  verifyEmail,
  verifyForgetPasswordOTP,
  resetPassword

  
}