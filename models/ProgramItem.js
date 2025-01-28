// models/ProgramItem.js
const mongoose = require("mongoose");

const ProgramItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  tags: [{
    type: String,
    required: true,
  }],
  image: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
  features: [{
    type: String,
    required: true,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  fileUrl: String,
  fileCloudinaryId: String
});

module.exports = mongoose.model("ProgramItem", ProgramItemSchema);