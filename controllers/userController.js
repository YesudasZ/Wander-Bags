


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



module.exports = {
  loginLoad,
  loadRegister
}