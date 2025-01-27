const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'items.itemModel',
      required: true
    },
    itemModel: {
      type: String,
      enum: ['FeedItem', 'ProgramItem'],
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  total: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Cart', CartSchema);