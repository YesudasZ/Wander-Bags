const User = require('../models/userModel');

const bcrypt = require('bcrypt')


const securePassword = async(password)=>{
  try {

    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
    
  } catch (error) {
    console.log(error.message);
  }
}


const insertuser =async(req,res)=> {
  try {
 
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name:req.body.name,
      email:req.body.email,
      mobile:req.body.mobile,
      password:spassword,
      is_admin:0,
    })
    const userdata = await user.save();
 
   res.redirect('/otpverify')

  
   

  } catch (error) {
    console.log(error.message);
  }
}



const loginLoad = async(req,res)=>{

  try {

    res.render('login')

  } catch (error) {

    console.log(error.message);

  }

}


const loadRegister = async(req,res)=>{
  try {
    res.render('signup');
  } catch (error) {
    console.log(error.message);
  }
}






const loadotpverify = async(req,res)=>{
  try {
    res.render('otpverify');
  } catch (error) {
    console.log(error.message);
  }
}

const loadHome = async(req,res)=>{
  try {
    res.render('home');
  } catch (error) {
    console.log(error.message);
  }
}


const loadforgetpassword =async (req,res)=>{
  try{
    res.render('forgetpassword')
  }catch(error){
    console.log(error.message);
  }
}



const loadforgetpasswordotp = async(req,res)=>{
  try {
    res.render('forgetpasswordotp')
  } catch (error) {
    console.log(error.message);
  }
}


const loadresetpassword = async(req,res)=>{
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
  insertuser
}