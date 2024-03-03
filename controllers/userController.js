const User = require('../models/userModel');

const bcrypt = require('bcrypt')


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
  loadresetpassword
}