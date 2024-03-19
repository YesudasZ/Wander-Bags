const User = require('../models/userModel');
const Product = require('../models/productModel');

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
        console.log(email);
        const userData = await User.findOne({ email: email });
        console.log(userData);
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
    const  userData = await User.findById({_id:req.session.user_id})
res.render('profile',{user:userData, errorMessage: null,successMessage: null})
  } catch (error) {
    console.error(error);
    res.redirect('/pagenotfound')
  }
}





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
  }