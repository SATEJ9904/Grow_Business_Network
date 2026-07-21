/**
 * Shared Razorpay payment-signature verification.
 * A valid signature is the only proof of payment we trust.
 */

const crypto = require("crypto");

/**
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 * @returns {boolean}
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!orderId || !paymentId || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
};

module.exports = { verifyPaymentSignature };
