const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const FeedItem = require('../models/FeedItem');
const ProgramItem = require('../models/ProgramItem');
const crypto = require('crypto');
const mongoose = require('mongoose');
const ejs = require('ejs');
const path = require('path');
const { decrypt } = require('../utils/encryption');
const Token = require('../models/Token');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN
  }
});

module.exports = {
  createCheckoutSession: async (req, res) => {
    try {
      const { deliveryEmail } = req.body;
      if (!deliveryEmail) {
        return res.status(400).json({ error: 'Delivery email is required' });
      }

      const cartItems = req.session.cart.items;
      const lineItems = await Promise.all(cartItems.map(async (item) => {
        const Model = item.itemType === 'feedItem' ? FeedItem : ProgramItem;
        const dbItem = await Model.findById(item.itemId);
        
        // Price validation
        if (dbItem.price !== item.price) {
          throw new Error(`Price mismatch for ${item.username || item.title}`);
        }

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.username || item.title,
              description: item.description,
            },
            unit_amount: Math.round(dbItem.price * 100),
          },
          quantity: item.quantity,
        };
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/cart`,
        payment_intent_data: {
          metadata: { deliveryEmail }
        }
      });

      res.redirect(303, session.url);
    } catch (err) {
      console.error('Stripe error:', err);
      res.status(500).render('error', {
        message: 'Checkout failed',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Please try again'
      });
    }
  },

 // Modified handleSuccess function
 handleSuccess: async (req, res) => {
  const dbSession = await mongoose.startSession();
  try {
    dbSession.startTransaction();
    const stripeSession = await stripe.checkout.sessions.retrieve(req.query.session_id);
    const paymentIntent = await stripe.paymentIntents.retrieve(stripeSession.payment_intent);

    if (stripeSession.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const deliveryEmail = paymentIntent.metadata.deliveryEmail;
    if (!deliveryEmail) {
      throw new Error('No delivery email provided');
    }

    const purchasedItems = await Promise.all(
      req.session.cart.items.map(async (cartItem) => {
        try {
          const Model = cartItem.itemType === 'feedItem' ? FeedItem : ProgramItem;
          const item = await Model.findById(cartItem.itemId).session(dbSession);

          if (!item) throw new Error('Item not found');
          if (item.isSold) throw new Error('Item already sold');

          // Mark item as sold
          item.isSold = true;
          await item.save();

          if (cartItem.itemType === 'feedItem') {

            const email = decrypt(item.email);
            const password = decrypt(item.password);


            return {
              ...item.toObject(),
              email,
              password,
              itemType: 'feedItem',
            };
          }

          // For program items, return secure download link
          return {
            ...item.toObject(),
            downloadLink: item.fileUrl,
            itemType: 'programItem',
          };
        } catch (err) {
          console.error(`Error processing item ${cartItem.itemId}:`, err);
          return null;
        }
      })
    );

    const validItems = purchasedItems.filter((item) => item !== null);

    if (validItems.length > 0) {
      const emailHtml = await ejs.renderFile(
        path.join(__dirname, '../views/credentials.ejs'),
        {
          purchasedItems: validItems,
          process: { env: process.env },
        }
      );

      await transporter.sendMail({
        to: deliveryEmail,
        subject: 'Your Purchased Content',
        html: emailHtml,
      });
    }

    await dbSession.commitTransaction();
    req.session.cart = { items: [], total: 0 };
    res.render('success');
  } catch (err) {
    await dbSession.abortTransaction();
    console.error('Payment processing error:', err);
    res.status(500).render('error', {
      message: 'Order fulfillment failed',
      error: process.env.NODE_ENV === 'development' ? `Error: ${err.message}` : 'Please contact support@myuncle.com',
    });
  } finally {
    dbSession.endSession();
  }
},

viewCredentials: async (req, res) => {
  try {
    const token = await Token.findOne({
      token: req.params.token,
      expires: { $gt: Date.now() }
    });

    if (!token) {
      return res.status(404).render('error', {
        message: 'Link expired or invalid'
      });
    }

    console.log("Token Found:", token); // Debugging log

    // Decrypt credentials
    const credentials = {
      email: decrypt(token.credentials.email),
      password: decrypt(token.credentials.password)
    };

    // Immediately delete token
    await Token.deleteOne({ _id: token._id });

    res.render('secure-credentials', { credentials });
  } catch (err) {
    console.error('Error in viewCredentials:', err); // Debugging log
    res.status(500).render('error', {
      message: 'Failed to retrieve credentials',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Please contact support'
    });
  }
}
};