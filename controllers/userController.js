const User = require('../models/userModel');

const bcrypt = require('bcrypt')


const userotpverification = require("../models/userotpverification")

const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "wanderbags29@gmail.com",
    pass: "ghmk tzmh sjxw ymeq"
  }
})

const sendotpverificationemail = async ({ _id, email }, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(otp);

    //mail options
    const mailoptions = {
      from: "wanderbags29@gmail.com",
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP for verification is: ${otp}`
    }



    const newotpverification = await new userotpverification({
      userId: _id,
      otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    })
    // save otp recard

    await newotpverification.save();
    await transporter.sendMail(mailoptions, (err, info) => {
      console.log(err, info.messageId);
      return otp
    });


  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
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

    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      is_admin: 0,
    })
    await sendotpverificationemail(user);
    const userdata = await user.save();

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
    let {userId,otp} = req.body;
    console.log(req.body);
    if(!userId || ! otp){
      throw Error("Empty otp details are not allowed");
    } else{
      const userotpverificationrecord = await userotpverification.find({
        userId,
      });
      if(userotpverificationrecord.length <=0){
        // no record found
        throw new Error(
          "Account record doesn't exist or has been verified already. Please sign up or log in."
        );
      }else{
        //user otp rcord exists
        const { expiresAt } = userotpverificationrecord[0];
        const hashedotp = userotpverificationrecord[0].otp;

        if(expiresAt < Date.now()){
        // user otp record has expired
       await userotpverification.deleteMany({userId});
       throw new Error("Code has expired. Please request again.");

        }else{
           const validotp = await bcrypt.compare(otp,hashedotp)

           if(!validotp){
            // supplied otp is wrong 
            throw new Error ("Invalid code passed. Check your inbox.")
           }else{
            // Success
            await User.updateOne({_id:userId},{verified:true});
            await userotpverification.deleteMany({userId});
            res.json({
              status:"VERIFIED",
              message:`user email verified successfully`
            })

            res.redirect('/home')
           }
        }

      }
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
  otpverify
}