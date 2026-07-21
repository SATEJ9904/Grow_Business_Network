/**
 * Password Reset Model
 * Stores password reset tokens for email verification
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      index: true,
    },
    resetToken: {
      type: String,
      required: [true, 'Reset token is required'],
      unique: true,
    },
    resetTokenHash: {
      type: String,
      required: [true, 'Reset token hash is required'],
    },
    expiry: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [3, 'Maximum password reset attempts exceeded'],
    },
  },
  {
    timestamps: true,
    collection: 'passwordResets',
  }
);

/**
 * Create TTL index to automatically delete expired tokens after 1 hour
 */
passwordResetSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

/**
 * Check if reset token is expired
 * @returns {boolean} True if token is expired
 */
passwordResetSchema.methods.isExpired = function () {
  return new Date() > this.expiry;
};

/**
 * Verify reset token by comparing with hash
 * @param {string} token - The reset token to verify
 * @returns {boolean} True if token is valid
 */
passwordResetSchema.methods.verifyToken = function (token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return this.resetTokenHash === hash;
};

/**
 * Generate a new reset token
 * @static
 * @returns {string} The reset token
 */
passwordResetSchema.statics.generateResetToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
