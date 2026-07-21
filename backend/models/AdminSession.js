/**
 * AdminSession Model
 * Manages admin login sessions with 24-hour expiry
 */

const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
    },
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
    },
    accessToken: {
      type: String,
      required: [true, 'Access token is required'],
    },
    refreshToken: {
      type: String,
      default: null,
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required'],
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiry
    },
    lastActivityTime: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'adminsessions',
  }
);

/**
 * Index for faster queries
 */
adminSessionSchema.index({ adminId: 1, isActive: 1 });
adminSessionSchema.index({ sessionId: 1 });
adminSessionSchema.index({ expiryTime: 1 });

module.exports = mongoose.model('AdminSession', adminSessionSchema);
