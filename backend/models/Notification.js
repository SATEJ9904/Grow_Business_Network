/**
 * Notification Model
 * Admin-authored in-app announcement, optionally scheduled and targeted at
 * specific chapters. Distinct from Meeting (which auto-generates its own
 * "new meeting" notification) — this is a free-form message the admin
 * composes directly (subject, message, optional call-to-action button).
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [150, 'Subject cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    // Raw target selection as chosen by the admin, kept for display on the
    // admin list ('' / 'ALL' => every city).
    city: {
      type: String,
      trim: true,
      default: '',
    },
    isAllChapters: {
      type: Boolean,
      default: false,
    },
    // Resolved audience at creation/send time — the concrete set of
    // chapters this notification goes to, used both for member-side
    // visibility queries and for targeting Socket.IO rooms.
    chapterIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
      },
    ],
    chapterNames: [
      {
        type: String,
      },
    ],
    buttonLabel: {
      type: String,
      trim: true,
      maxlength: [40, 'Button label cannot exceed 40 characters'],
      default: '',
    },
    buttonLink: {
      type: String,
      trim: true,
      maxlength: [500, 'Button link cannot exceed 500 characters'],
      default: '',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'cancelled'],
      default: 'scheduled',
    },
    sentAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seenBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        seenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ chapterIds: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
