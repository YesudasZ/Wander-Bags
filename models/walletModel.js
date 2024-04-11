const mongoose = require('mongoose');
const objectID = mongoose.Schema.Types.ObjectId;

const transactionSchema = new mongoose.Schema({
  amount: Number,
  description: String,
  type: String,
  transactionDate: {
    type: Date,
    default: Date.now,
  }
}, {
  _id: false // This will prevent mongoose from creating a separate _id field for transactions
});

const walletSchema = mongoose.Schema({
  user: {
    type: objectID,
    ref: 'User',
    required: true
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  amountSpent: {
    type: Number,
    default: 0
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  transactions: [transactionSchema], // This is the updated field
}, {
  timestamps: true
});

module.exports = mongoose.model('Wallet', walletSchema);