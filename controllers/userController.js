const User = require('../models/userModel');

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
      verified: false,
      otp: otp,
      otpExpiration: Date.now() + 60000
    };

    req.session.details = details
    req.session.save();

  

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
  const otp = generateOTP();
  sendotp(email,otp);
  return otp;

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
    const otpcheck = await parseInt(req.body.otp);
    const dbotp = req.session.details.otp

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
        is_blocked: 0
      });
      await user.save();

      return res.redirect('/home')
    }

    else {
      return res.render('otpverify', { message: 'Invalid OTP' });
    }

  } catch (error) {
    console.log(error.message);
   
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
  otpverify,
  resendotp,
}