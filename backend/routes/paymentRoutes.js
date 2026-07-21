/**
 * Payment Routes
 * Razorpay invoice creation for the registration fee
 */

const express = require("express");
const router = express.Router();

const { createOrder, verifyPayment } = require("../controllers/paymentController");

/**
 * Create a Razorpay invoice for the registration fee. Razorpay generates
 * the formal invoice and emails it to the member once payment is captured.
 * POST /api/payment/create-order
 * Body: name, email, mobile
 */
router.post("/create-order", createOrder);

/**
 * Confirm a captured payment and trigger the invoice email immediately -
 * independent of whether registration itself goes on to succeed.
 * POST /api/payment/verify
 * Body: razorpayOrderId, razorpayPaymentId, razorpaySignature, razorpayInvoiceId
 */
router.post("/verify", verifyPayment);

module.exports = router;
