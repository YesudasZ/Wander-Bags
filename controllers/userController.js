


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



module.exports = {
  loginLoad,
  loadRegister,
  loadotpverify,
  loadHome
}