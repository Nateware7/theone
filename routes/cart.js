const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');
const { ensureAuth, ensureGuest, allowGuestAccess } = require("../middleware/auth");

router.post('/remove-from-cart', allowGuestAccess, cartController.removeFromCart);
router.get('/cart', allowGuestAccess, cartController.getCart);
router.post('/add-to-cart', allowGuestAccess, cartController.addToCart);

module.exports = router;