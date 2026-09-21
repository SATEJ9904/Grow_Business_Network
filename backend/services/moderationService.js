/**
 * Moderation Service
 * Shared logic for the report/block/enforcement system: status-transition
 * whitelist, duplicate-report detection, enforcement application (updates
 * the reported user's account, writes the audit log, sends email/socket
 * notifications), and the suspension auto-expiry sweep.
 */

const User = require("../models/User");
const ModerationCase = require("../models/ModerationCase");
const { logActivity } = require("./activityService");
const { getIO } = require("../utils/socket");
const Notification = require("../models/Notification");
const { dispatchNotification } = require("./notificationDispatchService");
const {
  sendAccountRestrictedEmail,
  sendAccountSuspendedEmail,
  sendSuspensionLiftedEmail,
  sendAccountBannedEmail,
  sendReportRejectedEmail,
} = require("./emailService");

/**
 * A terminal-state case can never be mutated further; open states may only
 * move forward along this whitelist. The client never sends `status`
 * directly - every transition happens through a specific endpoint
 * (assign/action/reject/close), each of which calls this guard first.
 */
const ALLOWED_TRANSITIONS = {
  PENDING: ["UNDER_REVIEW", "ACTION_TAKEN", "REJECTED", "CLOSED", "CANCELLED"],
  UNDER_REVIEW: ["ACTION_TAKEN", "REJECTED", "CLOSED"],
};

class ModerationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const assertTransitionAllowed = (currentStatus, nextStatus) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ModerationError(
      `This case is already ${currentStatus.toLowerCase().replace("_", " ")} and cannot be moved to ${nextStatus.toLowerCase().replace("_", " ")}`,
      409,
    );
  }
};

/**
 * Rejects with a 409 if the reporter already has an open (PENDING/UNDER_REVIEW)
 * case against the same reported user, to prevent duplicate-report spam
 * while still allowing a fresh report once the prior one is resolved.
 */
const assertNoDuplicateOpenCase = async (reporterUserId, reportedUserId) => {
  const existing = await ModerationCase.findOne({
    reporterUserId,
    reportedUserId,
    status: { $in: ["PENDING", "UNDER_REVIEW"] },
  });

  if (existing) {
    throw new ModerationError(
      "You already have an open report against this member. Our team will review it soon.",
      409,
    );
  }
};

const emitToUser = (userId, event, payload) => {
  try {
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch (error) {
    // Socket.IO may not be initialized (e.g. in a script/test context) -
    // real-time delivery is a nice-to-have, never a hard dependency.
  }
};

/**
 * Applies an admin's decision on a case: BLOCK/BAN update the reported
 * user's account status, MESSAGE only sends them a direct notification, and
 * MANUAL just records that the admin will handle it outside the system.
 * Marks the case ACTION_TAKEN, logs the activity, and fires the matching
 * email/notification (best-effort).
 *
 * BLOCK additionally takes `blockType` ('TEMPORARY' requires `blockFrom`/
 * `blockUntil`, 'PERMANENT' ignores both). BAN is always immediate and
 * permanent - it also clears the reported user's refresh token so a
 * biometric/refresh-token login cannot silently continue their session,
 * and the caller (controller) forces an immediate Socket.IO logout.
 */
const applyEnforcementAction = async ({
  moderationCase,
  admin,
  enforcementAction,
  blockType,
  blockFrom,
  blockUntil,
  messageText,
  adminNotes,
}) => {
  assertTransitionAllowed(moderationCase.status, "ACTION_TAKEN");

  const reportedUser = await User.findById(moderationCase.reportedUserId);
  if (!reportedUser) {
    throw new ModerationError("Reported member no longer exists", 404);
  }

  const now = new Date();

  if (enforcementAction === "BLOCK") {
    if (blockType === "PERMANENT") {
      reportedUser.enforcementActionAt = now;
      reportedUser.suspensionEndsAt = null;
    } else if (blockType === "TEMPORARY") {
      const from = blockFrom ? new Date(blockFrom) : now;
      const until = blockUntil ? new Date(blockUntil) : null;
      if (Number.isNaN(from.getTime()) || !until || Number.isNaN(until.getTime()) || until <= from) {
        throw new ModerationError("A valid block end date after the start date is required", 400);
      }
      reportedUser.enforcementActionAt = from;
      reportedUser.suspensionEndsAt = until;
    } else {
      throw new ModerationError("A block type (temporary or permanent) is required", 400);
    }
    reportedUser.enforcementStatus = "RESTRICTED";
  } else if (enforcementAction === "BAN") {
    reportedUser.enforcementStatus = "BANNED";
    reportedUser.suspensionEndsAt = null;
    reportedUser.enforcementActionAt = now;
    reportedUser.refreshToken = null;
  } else if (enforcementAction === "MESSAGE") {
    if (!messageText || !messageText.trim()) {
      throw new ModerationError("A message is required to notify the member", 400);
    }
  } else if (enforcementAction === "MANUAL") {
    // Admin will handle this outside the system - account status untouched.
  } else {
    throw new ModerationError("Unsupported enforcement action", 400);
  }

  if (["BLOCK", "BAN"].includes(enforcementAction)) {
    reportedUser.enforcementReason = moderationCase.reasonCategory;
    reportedUser.enforcedBy = admin._id;
    await reportedUser.save();
  }

  moderationCase.status = "ACTION_TAKEN";
  moderationCase.adminDecision = enforcementAction;
  moderationCase.enforcementAction = enforcementAction;
  moderationCase.enforcementStartDate = now;
  moderationCase.reviewedAt = now;
  moderationCase.assignedAdminId = admin._id;
  if (adminNotes) moderationCase.adminNotes = adminNotes;
  await moderationCase.save();

  await logActivity({
    adminId: admin._id,
    adminEmail: admin.email,
    activityType: `MODERATION_ACTION_${enforcementAction}`,
    description: `Applied "${enforcementAction}" on case ${moderationCase.caseId} against ${reportedUser.name}`,
    targetUser: reportedUser._id,
    targetUserEmail: reportedUser.email,
    targetUserName: reportedUser.name,
    targetCompany: reportedUser.companyName,
    metadata: { caseId: moderationCase.caseId, reasonCategory: moderationCase.reasonCategory },
  });

  // Best-effort notification - a failure here must never fail the decision
  // that has already been durably saved above.
  try {
    if (enforcementAction === "BLOCK" && reportedUser.email) {
      if (reportedUser.suspensionEndsAt) {
        await sendAccountSuspendedEmail(reportedUser.email, reportedUser.name, moderationCase.reasonCategory, reportedUser.suspensionEndsAt);
      } else {
        await sendAccountRestrictedEmail(reportedUser.email, reportedUser.name, moderationCase.reasonCategory);
      }
    } else if (enforcementAction === "BAN" && reportedUser.email) {
      await sendAccountBannedEmail(reportedUser.email, reportedUser.name, moderationCase.reasonCategory);
    } else if (enforcementAction === "MESSAGE") {
      const notification = await Notification.create({
        subject: "Message from GBN Moderation Team",
        message: messageText.trim(),
        targetUserId: reportedUser._id,
        chapterIds: [],
        isAllChapters: false,
        scheduledAt: now,
        status: "scheduled",
        createdBy: admin._id,
      });
      await dispatchNotification(notification);
    }
  } catch (notifyError) {
    console.error("Moderation action notification error:", notifyError.message);
  }

  emitToUser(reportedUser._id, "moderation:update", {
    caseId: moderationCase.caseId,
    enforcementAction,
    enforcementStatus: reportedUser.enforcementStatus,
    suspensionEndsAt: reportedUser.suspensionEndsAt,
  });

  return moderationCase;
};

/**
 * Rejects a report/block-request: requires a reason, notifies the reporter
 * by email, and logs the decision - never exposes admin identity/notes.
 */
const rejectCase = async ({ moderationCase, admin, rejectionReason }) => {
  assertTransitionAllowed(moderationCase.status, "REJECTED");

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new ModerationError("A rejection reason is required", 400);
  }

  moderationCase.status = "REJECTED";
  moderationCase.adminDecision = "DISMISSED";
  moderationCase.rejectionReason = rejectionReason.trim();
  moderationCase.reviewedAt = new Date();
  moderationCase.assignedAdminId = moderationCase.assignedAdminId || admin._id;
  await moderationCase.save();

  const reporter = await User.findById(moderationCase.reporterUserId).select("name email");

  await logActivity({
    adminId: admin._id,
    adminEmail: admin.email,
    activityType: "CASE_REJECTED",
    description: `Rejected case ${moderationCase.caseId}`,
    targetUser: moderationCase.reportedUserId,
    metadata: { caseId: moderationCase.caseId, rejectionReason: moderationCase.rejectionReason },
  });

  try {
    if (reporter?.email) {
      await sendReportRejectedEmail(reporter.email, reporter.name, moderationCase.caseId, moderationCase.rejectionReason);
    }
  } catch (emailError) {
    console.error("Report rejection email error:", emailError.message);
  }

  emitToUser(moderationCase.reporterUserId, "moderation:update", {
    caseId: moderationCase.caseId,
    status: "REJECTED",
  });

  return moderationCase;
};

/**
 * Finds every SUSPENDED or time-boxed RESTRICTED (blocked) user whose window
 * has elapsed and restores them to ACTIVE, proactively emailing them (the
 * lazy check in authMiddleware/login also self-heals on the user's next
 * request, but can't send an email since it only runs when they're already
 * trying to act).
 */
const restoreExpiredSuspensions = async () => {
  const due = await User.find({
    enforcementStatus: { $in: ["SUSPENDED", "RESTRICTED"] },
    suspensionEndsAt: { $ne: null, $lte: new Date() },
  });

  for (const user of due) {
    const previousStatus = user.enforcementStatus;
    user.enforcementStatus = "ACTIVE";
    user.suspensionEndsAt = null;
    user.enforcementReason = "";
    await user.save();

    await logActivity({
      adminId: null,
      adminEmail: "system@gbn-automated",
      activityType: "SUSPENSION_AUTO_RESTORED",
      description: `${user.name}'s ${previousStatus.toLowerCase()} period expired and was automatically lifted`,
      targetUser: user._id,
      targetUserEmail: user.email,
      targetUserName: user.name,
      targetCompany: user.companyName,
      metadata: { previousStatus },
    });

    try {
      if (user.email) {
        await sendSuspensionLiftedEmail(user.email, user.name);
      }
    } catch (emailError) {
      console.error("Suspension-lifted email error:", emailError.message);
    }

    emitToUser(user._id, "moderation:update", { enforcementStatus: "ACTIVE" });
  }

  return due.length;
};

/**
 * Admin reverse-action: manually restores a blocked (RESTRICTED) or banned
 * (BANNED) member to ACTIVE, regardless of whether a block window had an
 * end date. Used by the Users page's "Unblock"/"Unban" buttons.
 */
const clearEnforcement = async ({ userId, admin }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ModerationError("Member not found", 404);
  }
  if (!["RESTRICTED", "SUSPENDED", "BANNED"].includes(user.enforcementStatus)) {
    throw new ModerationError("This member is not currently blocked or banned", 409);
  }

  const previousStatus = user.enforcementStatus;
  user.enforcementStatus = "ACTIVE";
  user.suspensionEndsAt = null;
  user.enforcementReason = "";
  await user.save();

  await logActivity({
    adminId: admin._id,
    adminEmail: admin.email,
    activityType: "ENFORCEMENT_CLEARED",
    description: `Restored ${user.name} to active (was ${previousStatus})`,
    targetUser: user._id,
    targetUserEmail: user.email,
    targetUserName: user.name,
    targetCompany: user.companyName,
    metadata: { previousStatus },
  });

  try {
    if (user.email) {
      await sendSuspensionLiftedEmail(user.email, user.name);
    }
  } catch (emailError) {
    console.error("Enforcement-cleared email error:", emailError.message);
  }

  emitToUser(user._id, "moderation:update", { enforcementStatus: "ACTIVE" });

  return user;
};

module.exports = {
  ModerationError,
  assertTransitionAllowed,
  assertNoDuplicateOpenCase,
  applyEnforcementAction,
  rejectCase,
  restoreExpiredSuspensions,
  clearEnforcement,
};
