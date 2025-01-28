// test-email.js
require('dotenv').config(); // Load environment variables
const nodemailer = require('nodemailer');

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

// Email options and sending logic
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: "recipient@example.com", // Replace with your email for testing
  subject: "Test Email",
  text: "This is a test email.",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) console.log("Error:", error);
  else console.log("Email sent:", info.response);
});