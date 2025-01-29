const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const FeedItem = require('../models/FeedItem');
const ProgramItem = require('../models/ProgramItem');
const crypto = require('crypto');
const mongoose = require('mongoose');
const ejs = require('ejs');
const path = require('path');

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

            // Update inventory
            item.isSold = true;

            if (cartItem.itemType === 'feedItem') {
              // Store the original password before hashing
              const originalPassword = item.password;
              const tempToken = crypto.randomBytes(32).toString('hex');
              
              // Hash the password for database storage
              item.password = await bcrypt.hash(originalPassword, 10);
              item.tempToken = tempToken;
              item.tokenExpiry = Date.now() + 3600000;
              await item.save();

              return {
                ...item.toObject(),
                password: originalPassword, // Use original password for email
                itemType: 'feedItem'
              };
            }

            await item.save();
            return {
              ...item.toObject(),
              itemType: 'programItem'
            };
          } catch (err) {
            console.error(`Error processing item ${cartItem.itemId}:`, err);
            return null;
          }
        })
      );

      const validItems = purchasedItems.filter(item => item !== null);
      
      if (validItems.length > 0) {
        const emailHtml = await ejs.renderFile(
          path.join(__dirname, '../views/credentials.ejs'),
          {
            purchasedItems: validItems.filter(item => item.itemType === 'feedItem'),
            process: { env: process.env },
            // Add any other variables your template needs
          }
        );
        await transporter.sendMail({
          to: deliveryEmail,
          subject: 'Your Purchased Account Credentials',
          html: emailHtml, // Use the rendered EJS template
          attachments: validItems
            .filter(item => item.itemType === 'programItem')
            .map(item => ({
              filename: `${item.title}.${item.fileUrl.split('.').pop()}`,
              path: item.fileUrl
            }))
        });

        const attachments = validItems
          .filter(item => item.itemType === 'programItem')
          .map(item => ({
            filename: `${item.title}.${item.fileUrl.split('.').pop()}`,
            path: item.fileUrl
          }));


      }

      await dbSession.commitTransaction();
      req.session.cart = { items: [], total: 0 };
      res.render('success');
    } catch (err) {
      await dbSession.abortTransaction();
      console.error('Payment processing error:', err);

    res.status(500).render('error', {
      message: 'Order fulfillment failed',
      error: process.env.NODE_ENV === 'development' ? 
      `Error: ${err.message}` : 
      'Please contact support@myuncle.com'
    });
    } finally {
      dbSession.endSession();
    }
  }
};