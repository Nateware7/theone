const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout');
const { allowGuestAccess } = require("../middleware/auth");

router.post('/create-checkout-session', allowGuestAccess, checkoutController.createCheckoutSession);
router.get('/success', allowGuestAccess, checkoutController.handleSuccess);

module.exports = router;