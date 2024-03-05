const User = require('../models/userModel');

const bcrypt = require('bcrypt')


const userotpverification = require("../models/userotpverification")

const nodemailer = require("nodemailer");


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit OTP
}


const securePassword = async (password) => {
  try {

    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;

  } catch (error) {
    console.log(error.message);
  }
}


const insertuser = async (req, res) => {
  try {

    const otp = generateOTP();

    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      is_admin: 0,
      verified: false,
      otp: otp, 
      otpExpiration: Date.now() + 60000 
    });
    
     const userdata =  await user.save();
       req.session.details = userdata
       req.session.save();


    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "wanderbags29@gmail.com",
        pass: "ghmk tzmh sjxw ymeq"
      }
    })

    const mailoptions = {
      from: "wanderbags29@gmail.com",
      to: req.body.email,
      subject: 'OTP Verification',
      text: `Your OTP for verification is: ${otp}`
    }


      await transporter.sendMail(mailoptions);
   
    res.redirect('/otpverify')




  } catch (error) {
    console.log(error.message);
  }
}



const loginLoad = async (req, res) => {

  try {

    res.render('login')

  } catch (error) {

    console.log(error.message);

  }

}


const loadRegister = async (req, res) => {
  try {
    res.render('signup');
  } catch (error) {
    console.log(error.message);
  }
}






const loadotpverify = async (req, res) => {
  try {
    res.render('otpverify');
  } catch (error) {
    console.log(error.message);
  }
}

const otpverify = async (req, res) => {
  try {
    const  otpcheck  = await parseInt(req.body.otp);

     const dbotp = req.session.details.otp

//      console.log(email);
//     // Find the user by email
//     const user = await User.findOne({ email });
// console.log(user);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Check if OTP has expired
//     if (user.otpExpiration < Date.now()) {
//       return res.status(400).json({ message: 'OTP has expired' });
//     }
console.log(otpcheck);
console.log(dbotp);
    // Check if OTP matches
    if (dbotp !== otpcheck) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark user as verified
    // user.verified = true;
    // await user.save();

     res.render('home')

  } catch (error) {
    console.log(error.message);
    res.status(500).send('Error occurred while processing your request');
  }
}



const loadHome = async (req, res) => {
  try {
    res.render('home');
  } catch (error) {
    console.log(error.message);
  }
}


const loadforgetpassword = async (req, res) => {
  try {
    res.render('forgetpassword')
  } catch (error) {
    console.log(error.message);
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
  otpverify
}