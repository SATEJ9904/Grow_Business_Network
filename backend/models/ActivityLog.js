/**
 * Activity Log Model
 * Tracks all admin activities and events in the system
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
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
    activityType: {
      type: String,
      enum: [
        'LOGIN',
        'LOGOUT',
        'APPROVE_REQUEST',
        'REJECT_REQUEST',
        'VIEW_DETAILS',
        'EXPORT_DATA',
        'UPDATE_ADMIN',
        'CREATE_CHAPTER',
        'UPDATE_MEMBER_CHAPTER',
        'DELETE_ACCOUNT',
        'SESSION_EXPIRED',
        'FAILED_LOGIN',
      ],
      required: [true, 'Activity type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetUserEmail: {
      type: String,
      default: null,
    },
    targetUserName: {
      type: String,
      default: null,
    },
    targetCompany: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success',
    },
    sessionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'activitylogs',
  }
);

/**
 * Index for faster queries
 */
activityLogSchema.index({ adminId: 1, createdAt: -1 });
activityLogSchema.index({ activityType: 1, createdAt: -1 });
activityLogSchema.index({ sessionId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
