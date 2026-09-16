/**
 * ModerationCase Model
 * Unified record for both member-submitted reports and block requests.
 * One model covers both because they share the same review/decision/audit
 * lifecycle end-to-end; requestType distinguishes intent.
 */

const mongoose = require("mongoose");

const moderationCaseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      unique: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ["REPORT", "BLOCK"],
      required: true,
    },

    reporterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reportedContentType: {
      type: String,
      enum: ["USER", "WEBSITE", "IMAGE", "OTHER"],
      default: "USER",
    },
    reportedContentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    reasonCategory: {
      type: String,
      enum: [
        "SPAM",
        "FAKE_PROFILE",
        "INAPPROPRIATE_CONTENT",
        "HARASSMENT",
        "SCAM_FRAUD",
        "IMPERSONATION",
        "OFFENSIVE_IMAGE",
        "OTHER",
      ],
      required: true,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: "",
    },

    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "ACTION_TAKEN", "REJECTED", "CLOSED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    adminDecision: {
      type: String,
      enum: ["NONE", "BLOCK", "BAN", "MESSAGE", "MANUAL", "DISMISSED"],
      default: "NONE",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },

    // BLOCK -> reportedUser.enforcementStatus = RESTRICTED (limited access);
    // BAN -> BANNED (full lockout); MESSAGE -> account untouched, a
    // notification is sent to the reported member instead; MANUAL -> admin
    // acknowledges the case and will handle it outside the system.
    enforcementAction: {
      type: String,
      enum: ["NONE", "BLOCK", "BAN", "MESSAGE", "MANUAL"],
      default: "NONE",
    },
    enforcementStartDate: {
      type: Date,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "moderationcases",
  },
);

moderationCaseSchema.index({ status: 1, createdAt: -1 });
moderationCaseSchema.index({ reportedUserId: 1, status: 1 });
moderationCaseSchema.index({ reporterUserId: 1, reportedUserId: 1, createdAt: -1 });
moderationCaseSchema.index({ assignedAdminId: 1, status: 1 });

/**
 * Never leak internal-only fields to a reporter or reported-user-facing response.
 * Admin-facing responses read the raw document/lean object directly instead of
 * relying on toJSON, so this only guards accidental exposure via res.json(case).
 */
moderationCaseSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.adminNotes;
  delete obj.assignedAdminId;
  delete obj.ipAddress;
  delete obj.userAgent;
  return obj;
};

module.exports = mongoose.model("ModerationCase", moderationCaseSchema);
