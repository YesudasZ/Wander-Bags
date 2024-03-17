const mongoose = require('mongoose');

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECT);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(err.message);
  }
};

module.exports = dbConnection;