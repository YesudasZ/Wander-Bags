const express = require("express");
const app = express();
const session = require("express-session");
const nocache = require("nocache");
const path = require("path");
const dbConnection = require('./config/dbconnect')
require('dotenv').config();
dbConnection()



app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  session({
    secret:process.env.SESSION_SECRET ,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(nocache())
app.use(express.static(path.join(__dirname,'views')))
app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname,'views/admin')))
app.use(express.static(path.join(__dirname,'views/user')))



//user route
const userRoute = require ('./routes/userRoute');

app.use('/',userRoute)

//admin route
const adminRoute = require('./routes/adminRoute');

app.use('/admin',adminRoute)



app.use('/*',async(req,res)=>{
  res.redirect('/pageNotfound')
})

app.listen(4000,()=>console.log("Click here to go to the login page: http://localhost:4000"))