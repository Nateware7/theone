const Cart = require('../models/Cart');
const FeedItem = require('../models/FeedItem');
const ProgramItem = require('../models/ProgramItem');

module.exports = {
   addToCart: async (req, res) => {
    try {
      const { itemId, itemType } = req.body;
      
      const Model = itemType === 'feedItem' ? FeedItem : ProgramItem;
      const item = await Model.findById(itemId);
      
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      let cart = await Cart.findOne({ user: req.user._id });
      
      if (!cart) {
        cart = new Cart({ 
          user: req.user._id, 
          items: [],
          total: 0 
        });
      }
      
      // Check if item already in cart
      const existingItemIndex = cart.items.findIndex(
        cartItem => 
          cartItem.item.toString() === itemId && 
          cartItem.itemModel === (itemType === 'feedItem' ? 'FeedItem' : 'ProgramItem')
      );
      
      if (existingItemIndex > -1) {
        return res.status(400).json({ 
          error: 'This item is already in your cart' 
        });
      }
      
      // Add new item to cart
      cart.items.push({
        item: itemId,
        itemModel: itemType === 'feedItem' ? 'FeedItem' : 'ProgramItem',
        quantity: 1,
        price: item.price
      });
      
      // Recalculate total
      cart.total = cart.items.reduce((total, cartItem) => 
        total + (cartItem.price * cartItem.quantity), 0);
      
      await cart.save();
      
      res.status(200).json({ message: 'Item added to cart successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error adding to cart' });
    }
},
  
  getCart: async (req, res) => {
    try {
      const cart = await Cart.findOne({ user: req.user._id })
        .populate('items.item');
      
      res.render('cart', { 
        cart: cart || { items: [], total: 0 }, 
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
      
      if (!itemId || !itemType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Find the user's cart
      let cart = await Cart.findOne({ user: req.user._id });
      
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      
      // Find the item index in the cart
      const itemIndex = cart.items.findIndex(item => 
        item.item.toString() === itemId && 
        item.itemModel === (itemType === 'feedItem' ? 'FeedItem' : 'ProgramItem')
      );
      
      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item not found in cart' });
      }

      // Remove the item from the cart
      cart.items.splice(itemIndex, 1);
      
      // Recalculate total
      cart.total = cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );
      
      // Save the updated cart
      await cart.save();
      
      // Redirect back to cart page
      res.redirect('/cart');
    } catch (err) {
      console.error('Error removing item from cart:', err);
      res.status(500).json({ error: 'Error removing item from cart' });
    }
  }
};