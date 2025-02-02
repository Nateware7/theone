// models/Token.js
const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expires: {
    type: Date,
    required: true
  },
  credentials: {
    email: String,
    password: String
  },
});

module.exports = mongoose.model('Token', TokenSchema);