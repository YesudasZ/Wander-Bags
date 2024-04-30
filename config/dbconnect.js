const mongoose = require('mongoose');

const dbConnection = async () => {
  try {
    await mongoose.connect("mongodb+srv://WanderBags:WanderBags@cluster0.ddmncoq.mongodb.net/");
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(err.message);
  }
};

module.exports = dbConnection;