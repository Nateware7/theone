const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');
const { ensureAuth } = require('../middleware/auth');

router.post('/remove-from-cart', ensureAuth, cartController.removeFromCart);
router.get('/cart', ensureAuth, cartController.getCart);
router.post('/add-to-cart', ensureAuth, cartController.addToCart);

module.exports = router;