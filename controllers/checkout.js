const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2', // Use OAuth2 instead of plain auth
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN
  }
});

module.exports = {
  createCheckoutSession: async (req, res) => {
    try {
      const cartItems = req.session.cart.items;
      
      // Create Stripe line items
      const lineItems = cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.username,
            description: item.description,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));

      // Create Stripe session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/cart`,
        customer_email: req.user ? req.user.email : undefined,
      });

      res.redirect(303, session.url);
    } catch (err) {
      console.error('Stripe error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // controllers/checkout.js
handleSuccess: async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    
    if (session.payment_status === 'paid') {
      // Temporary: Skip email sending for now
      // await sendConfirmationEmail(session, req.session.cart);
      
      // Clear cart
      req.session.cart = { items: [], total: 0 };
      
      return res.render('success');
    }
    res.redirect('/cart');
  } catch (err) {
    console.error('Payment success error:', err);
    // Render error page instead of redirecting
    res.status(500).render('error', { 
      message: 'Payment verification failed',
      error: err 
    });
  }
}
};