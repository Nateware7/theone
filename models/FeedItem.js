// FeedItem.js - Update the model
const mongoose = require("mongoose");

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
});

module.exports = mongoose.model("FeedItem", FeedItemSchema);
