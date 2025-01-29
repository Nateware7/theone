// FeedItem.js - Update the model
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');


const FeedItemSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  platform: {  // Add this field
    type: String,
    required: true,
    enum: ['instagram', 'x', 'discord']  // Restrict to valid platforms
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxLength: 50
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: true,
  },
  isSold: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("FeedItem", FeedItemSchema);
