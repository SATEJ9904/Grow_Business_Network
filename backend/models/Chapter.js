/**
 * Chapter Model
 * Represents different chapters of the Networking Club in different cities
 */

const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Chapter name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Chapter name must be at least 2 characters'],
      maxlength: [50, 'Chapter name cannot exceed 50 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      minlength: [2, 'City name must be at least 2 characters'],
      maxlength: [50, 'City name cannot exceed 50 characters'],
    },
    totalMembers: {
      type: Number,
      default: 0,
    },
    approvedMembers: {
      type: Number,
      default: 0,
    },
    pendingMembers: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'chapters',
  }
);

/**
 * Index for faster queries
 */
chapterSchema.index({ city: 1 });
chapterSchema.index({ name: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
