/**
 * Meeting Booking Model
 * Represents a member's paid seat booking for a Meeting
 */

const mongoose = require('mongoose');

const meetingBookingSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    meetingFee: {
      type: Number,
      required: true,
    },
    gstPercent: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    commission: {
      type: Number,
      required: true,
    },
    commissionGst: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'meetingbookings',
  }
);

meetingBookingSchema.index({ meetingId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('MeetingBooking', meetingBookingSchema);
