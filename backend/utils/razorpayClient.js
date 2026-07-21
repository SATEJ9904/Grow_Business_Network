/**
 * Shared Razorpay SDK instance
 */

const Razorpay = require("razorpay");

const getRazorpayInstance = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

module.exports = { getRazorpayInstance };
