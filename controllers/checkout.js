const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const FeedItem = require('../models/FeedItem');
const ProgramItem = require('../models/ProgramItem');
const crypto = require('crypto');
const mongoose = require('mongoose');

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
            await item.save();

            if (cartItem.itemType === 'feedItem') {
              const newPassword = crypto.randomBytes(8).toString('hex');
              const tempToken = crypto.randomBytes(32).toString('hex');
              
              item.password = await bcrypt.hash(newPassword, 10);
              item.tempToken = tempToken;
              item.tokenExpiry = Date.now() + 3600000;
              await item.save();

              return {
                ...item.toObject(),
                password: newPassword,
                itemType: 'feedItem'
              };
            }

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
        const emailContent = validItems.map(item => {
          if (item.itemType === 'feedItem') {
            return `
              <div style="margin-bottom: 2rem;">
                <h3>${item.username} (${item.platform})</h3>
                <p>Email: ${item.email}</p>
                <p>Password: ${item.password}</p>
                <p>Temporary login: 
                  <a href="${process.env.BASE_URL}/login/${item.tempToken}">
                    Access Account
                  </a>
                </p>
              </div>
            `;
          }
          return `
            <div style="margin-bottom: 2rem;">
              <h3>${item.title}</h3>
              <p>Download: <a href="${item.fileUrl}">Program Files</a></p>
            </div>
          `;
        }).join('');

        const attachments = validItems
          .filter(item => item.itemType === 'programItem')
          .map(item => ({
            filename: `${item.title}.${item.fileUrl.split('.').pop()}`,
            path: item.fileUrl
          }));

        await transporter.sendMail({
          to: deliveryEmail,
          subject: 'Your Purchase Details',
          html: `
            <h1>Purchase Confirmation</h1>
            ${emailContent}
            <p style="margin-top: 2rem; color: #666;">
              This email contains sensitive information - do not share it with anyone.
            </p>
          `,
          attachments
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
        error: process.env.NODE_ENV === 'development' ? err.message : 'Contact support'
      });
    } finally {
      dbSession.endSession();
    }
  }
};