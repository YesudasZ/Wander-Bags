const mongoose = require ("mongoose");

const schema = mongoose.Schema;

const userotpverificationschema = new schema({
  userId: String,
  otp: String,
  createdAt: Date,
  expiresAt: Date,
});

const userotpverification = mongoose.model(
  "userotpverification",
  userotpverificationschema
);
module.exports = userotpverification;