/**
 * Meeting Model
 * Represents a chapter meeting scheduled by an admin
 */

const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Meeting name is required'],
      trim: true,
      maxlength: [100, 'Meeting name cannot exceed 100 characters'],
    },
    flyerImage: {
      type: String,
      required: [true, 'Meeting flyer is required'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    meetingDate: {
      type: Date,
      required: [true, 'Meeting date is required'],
    },
    meetingTime: {
      type: String,
      required: [true, 'Meeting time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Meeting time must be in HH:mm format'],
    },
    meetingDateTime: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      maxlength: [300, 'Venue cannot exceed 300 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chapter is required'],
    },
    chapterName: {
      type: String,
      required: true,
      trim: true,
    },
    fee: {
      type: Number,
      required: [true, 'Meeting fee is required'],
      min: [0, 'Meeting fee cannot be negative'],
    },
    gstPercent: {
      type: Number,
      default: 0,
      min: [0, 'GST % cannot be negative'],
      max: [100, 'GST % cannot exceed 100'],
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
    collection: 'meetings',
  }
);

/**
 * Combine meetingDate + meetingTime into a single comparable Date so
 * countdown/expiry checks are a plain Mongo comparison, not a per-request parse.
 */
meetingSchema.pre('validate', function (next) {
  if (this.meetingDate && this.meetingTime) {
    const [hours, minutes] = this.meetingTime.split(':').map(Number);
    const combined = new Date(this.meetingDate);
    combined.setHours(hours, minutes, 0, 0);
    this.meetingDateTime = combined;
  }
  next();
});

meetingSchema.index({ chapterId: 1 });
meetingSchema.index({ meetingDateTime: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
