const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/WanderBags");

require('dotenv').config();

const express = require("express");

const app = express();



const nodemailer = require("nodemailer");

const path = require("path");


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


app.listen(4000,()=>console.log("Click here to go to the login page: http://localhost:4000"))