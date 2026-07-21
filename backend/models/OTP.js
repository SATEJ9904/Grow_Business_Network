/**
 * OTP Model
 * Stores One-Time Passwords for email verification
 */

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    expiry: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), 
    },
    attempts: {
      type: Number,
      default: 0,
      max: [3, 'Maximum OTP attempts exceeded'],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'otps',
  }
);

/**
 * Create TTL index to automatically delete expired OTPs after 10 minutes
 * This ensures cleanup even if OTP is not manually deleted after expiry
 */
otpSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

/**
 * Check if OTP is expired
 * @returns {boolean} True if OTP is expired
 */
otpSchema.methods.isExpired = function () {
  return new Date() > this.expiry;
};

/**
 * Check if OTP has reached maximum attempts
 * @returns {boolean} True if max attempts reached
 */
otpSchema.methods.isMaxAttemptsReached = function () {
  return this.attempts >= 3;
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
