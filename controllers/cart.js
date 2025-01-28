const Cart = require('../models/Cart');
const FeedItem = require('../models/FeedItem');
const ProgramItem = require('../models/ProgramItem');

module.exports = {
  addToCart: async (req, res) => {
    try {
      const { itemId, itemType } = req.body;

      // Initialize session cart if it doesn't exist
      if (!req.session.cart) {
        req.session.cart = {
          items: [],
          total: 0
        };
      }

      const Model = itemType === 'feedItem' ? FeedItem : ProgramItem;
      const item = await Model.findById(itemId);
  
      if (item.isSold) {
        return res.status(400).json({ error: 'This account has already been sold' });
      }

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Check if item already in cart
      const existingItemIndex = req.session.cart.items.findIndex(
        cartItem => cartItem.itemId === itemId
      );

      if (existingItemIndex > -1) {
        return res.status(400).json({ 
          error: 'This item is already in your cart' 
        });
      }

      // Store complete item data in session
      const cartItem = {
        itemId: item._id,
        itemType: itemType,
        username: item.username || item.title,
        description: item.description,
        platform: item.platform,
        price: item.price,
        quantity: 1
      };

      req.session.cart.items.push(cartItem);
      req.session.cart.total = req.session.cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0);

      res.redirect('/cart');
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error adding to cart' });
    }
  },

  getCart: async (req, res) => {
    try {
      if (!req.session.cart) {
        req.session.cart = {
          items: [],
          total: 0
        };
      }

      res.render('cart', { 
        cart: req.session.cart,
        user: req.user 
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error retrieving cart');
    }
  },

  removeFromCart: async (req, res) => {
    try {
      const { itemId, itemType } = req.body;

      if (!req.session.cart) {
        return res.redirect('/cart');
      }

      // Remove item from cart
      req.session.cart.items = req.session.cart.items.filter(
        item => item.itemId.toString() !== itemId
      );

      // Recalculate total
      req.session.cart.total = req.session.cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0);

      res.redirect('/cart');
    } catch (err) {
      console.error('Error removing item from cart:', err);
      res.redirect('/cart');
    }
  }
};