/**
 * DeletedRecord Model
 * A permanent audit trail of every member account that has been deleted.
 *
 * A snapshot of the member's identity is taken at deletion time (the User
 * document itself is removed, so this is the only place that data survives).
 * If the same person registers again and an admin approves that new
 * account, this record is flipped to "rejoined" rather than being removed -
 * the deletion history stays visible on the admin panel forever.
 */

const mongoose = require("mongoose");

const deletedRecordSchema = new mongoose.Schema(
  {
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      default: "",
    },
    mobile: {
      type: String,
      default: "",
    },
    companyName: {
      type: String,
      default: "",
    },
    chapterName: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: null,
    },
    deletionReason: {
      type: String,
      default: "",
    },
    deletedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["deleted", "rejoined"],
      default: "deleted",
    },
    rejoinedAt: {
      type: Date,
      default: null,
    },
    rejoinedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

deletedRecordSchema.index({ email: 1, status: 1 });
deletedRecordSchema.index({ mobile: 1, status: 1 });
deletedRecordSchema.index({ deletedAt: -1 });

module.exports = mongoose.model("DeletedRecord", deletedRecordSchema);
