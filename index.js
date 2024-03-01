const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/WanderBags");

const express = require("express");
const path = require("path");
const app = express();

const adminRoute = require('./routes/adminRoute');

app.use(express.static(path.join(__dirname,'views')))
app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname,'views/admin')))
app.use(express.static(path.join(__dirname,'views/user')))
app.use('/',adminRoute)


app.listen(4000,()=>console.log("Click here to go to the login page: http://localhost:4000"))