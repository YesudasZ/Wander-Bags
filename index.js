const express = require("express");
const app = express();

// Load environment variables
require('dotenv').config();

// Database connection
const dbConnection = require('./config/dbconnect');
dbConnection();

// Session management
const session = require("express-session");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware
const nocache = require("nocache");
app.use(nocache()); // Disable caching
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Static files
const path = require("path");
app.use(express.static(path.join(__dirname, 'views'))); // Serve static files from 'views' directory
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'views/admin'))); // Serve static files from 'views/admin' directory
app.use(express.static(path.join(__dirname, 'views/user'))); // Serve static files from 'views/user' directory

// Routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute); // User routes

const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute); // Admin routes

// Fallback route
app.use('/*', async (req, res) => {
  res.redirect('/pageNotfound'); // Redirect to 'pageNotfound' for any other route
});

// Start the server
app.listen(4000, () => console.log("Click here to go to the login page: http://localhost:4000"));