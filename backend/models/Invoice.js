/**
 * Invoice Model
 * Persists the generated PDF invoice for a member's registration payment.
 */

const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
    },
    // Snapshot of the payer's details at the time of payment, so the
    // invoice stays historically accurate even if the member later edits
    // their profile (name, address, company, etc).
    billingSnapshot: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      mobile: { type: String, default: "" },
      companyName: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
    },
    amounts: {
      baseAmount: { type: Number, required: true },
      gstAmount: { type: Number, required: true },
      commission: { type: Number, required: true },
      commissionGst: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
    },
    currency: {
      type: String,
      default: "INR",
    },
    pdfPath: {
      type: String, // relative to backend/uploads, e.g. "invoices/GBN-INV-2026-000123.pdf"
      required: true,
    },
    status: {
      type: String,
      enum: ["generated", "email_sent", "email_failed"],
      default: "generated",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "invoices",
  },
);

invoiceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
