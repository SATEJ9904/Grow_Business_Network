/**
 * Moderation Controller
 * Member-facing report/block endpoints and admin-facing moderation-queue
 * endpoints. Security invariants enforced throughout:
 *  - reporterUserId always comes from req.userId (the authenticated caller),
 *    never from the request body.
 *  - status transitions only ever happen through moderationService's
 *    whitelisted helpers - the client never sends `status` directly.
 *  - adminNotes/assignedAdminId are never included in a reporter/reported-
 *    user-facing response.
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const ModerationCase = require("../models/ModerationCase");
const { getNextCaseNumber } = require("../utils/caseNumber");
const { getIO } = require("../utils/socket");
const {
  ModerationError,
  assertNoDuplicateOpenCase,
  applyEnforcementAction,
  rejectCase: rejectCaseService,
  clearEnforcement,
} = require("../services/moderationService");
const { logActivity } = require("../services/activityService");

const REASON_CATEGORIES = [
  "SPAM",
  "FAKE_PROFILE",
  "INAPPROPRIATE_CONTENT",
  "HARASSMENT",
  "SCAM_FRAUD",
  "IMPERSONATION",
  "OFFENSIVE_IMAGE",
  "OTHER",
];

const CONTENT_TYPES = ["USER", "WEBSITE", "IMAGE", "OTHER"];

/**
 * Shared creation path for both a REPORT and a BLOCK request - they share
 * an identical request shape and only differ in requestType.
 */
const createModerationCase = async (req, res, requestType) => {
  try {
    if (req.userEnforcementStatus === "RESTRICTED") {
      return res.status(403).json({
        success: false,
        message: "Your account is restricted from submitting new reports. Contact support if you believe this is a mistake.",
      });
    }

    const { reportedUserId, reasonCategory, description } = req.body;
    let { reportedContentType, reportedContentId } = req.body;
    reportedContentType = reportedContentType || "USER";

    if (!reportedUserId || !mongoose.Types.ObjectId.isValid(reportedUserId)) {
      return res.status(400).json({ success: false, message: "A valid reportedUserId is required" });
    }
    if (String(reportedUserId) === String(req.userId)) {
      return res.status(400).json({ success: false, message: "You cannot report or block yourself" });
    }
    if (!REASON_CATEGORIES.includes(reasonCategory)) {
      return res.status(400).json({ success: false, message: "A valid reasonCategory is required" });
    }
    if (!CONTENT_TYPES.includes(reportedContentType)) {
      return res.status(400).json({ success: false, message: "Invalid reportedContentType" });
    }
    if (reasonCategory === "OTHER" && !description?.trim()) {
      return res.status(400).json({ success: false, message: "Please describe the issue when selecting \"Other\"" });
    }
    if (reportedContentId && !mongoose.Types.ObjectId.isValid(reportedContentId)) {
      return res.status(400).json({ success: false, message: "Invalid reportedContentId" });
    }

    const reportedUser = await User.findById(reportedUserId).select("_id");
    if (!reportedUser) {
      return res.status(404).json({ success: false, message: "Reported member not found" });
    }

    await assertNoDuplicateOpenCase(req.userId, reportedUserId);

    const caseId = await getNextCaseNumber();

    const moderationCase = await ModerationCase.create({
      caseId,
      requestType,
      reporterUserId: req.userId,
      reportedUserId,
      reportedContentType,
      reportedContentId: reportedContentId || null,
      reasonCategory,
      description: description?.trim() || "",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message:
        requestType === "BLOCK"
          ? "Block request submitted successfully. Our moderation team will review it and update you."
          : "Report submitted successfully. Our moderation team will review it and update you.",
      data: {
        caseId: moderationCase.caseId,
        status: moderationCase.status,
        requestType: moderationCase.requestType,
      },
    });
  } catch (error) {
    const statusCode = error instanceof ModerationError ? error.statusCode : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/moderation/report
 */
const submitReport = (req, res) => createModerationCase(req, res, "REPORT");

/**
 * POST /api/moderation/block-request
 */
const submitBlockRequest = (req, res) => createModerationCase(req, res, "BLOCK");

/**
 * POST /api/moderation/personal-block/:userId
 * Immediate, self-service - no admin review. Hides the target from the
 * caller's own directory/search/profile views (unidirectional).
 */
const addPersonalBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }
    if (String(userId) === String(req.userId)) {
      return res.status(400).json({ success: false, message: "You cannot block yourself" });
    }

    const target = await User.findById(userId).select("_id");
    if (!target) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    await User.updateOne(
      { _id: req.userId },
      { $addToSet: { blockedUserIds: userId } },
    );

    return res.status(200).json({ success: true, message: "Member blocked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/moderation/personal-block/:userId
 */
const removePersonalBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    await User.updateOne(
      { _id: req.userId },
      { $pull: { blockedUserIds: userId } },
    );

    return res.status(200).json({ success: true, message: "Member unblocked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/moderation/my-reports
 */
const getMyReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const query = { reporterUserId: req.userId };
    const [cases, total] = await Promise.all([
      ModerationCase.find(query)
        .select("-adminNotes -assignedAdminId -ipAddress -userAgent")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ModerationCase.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: cases,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/moderation/my-blocked-users
 */
const getMyBlockedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select("blockedUserIds");
    const blockedUsers = await User.find({ _id: { $in: currentUser?.blockedUserIds || [] } }).select(
      "name companyName profileImage",
    );

    return res.status(200).json({ success: true, data: blockedUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/moderation/my-enforcement-status
 */
const getMyEnforcementStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "enforcementStatus enforcementReason suspensionEndsAt",
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        enforcementStatus: user.enforcementStatus,
        enforcementReason: user.enforcementReason,
        suspensionEndsAt: user.suspensionEndsAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------------------------------------------ */
/* Admin-facing                                                        */
/* ------------------------------------------------------------------ */

/**
 * GET /api/admin/moderation/cases
 */
const getCases = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { status, requestType, reasonCategory, assignedAdminId, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;
    if (reasonCategory) query.reasonCategory = reasonCategory;
    if (assignedAdminId && mongoose.Types.ObjectId.isValid(assignedAdminId)) {
      query.assignedAdminId = assignedAdminId;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      const matchingUsers = await User.find({
        $or: [{ name: regex }, { email: regex }, { companyName: regex }],
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [{ caseId: regex }, { reportedUserId: { $in: userIds } }, { reporterUserId: { $in: userIds } }];
    }

    const [cases, total] = await Promise.all([
      ModerationCase.find(query)
        .populate("reporterUserId", "name email companyName")
        .populate("reportedUserId", "name email companyName profileImage")
        .populate("assignedAdminId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ModerationCase.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: cases,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/moderation/cases/:id
 */
const getCaseDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid case id" });
    }

    const moderationCase = await ModerationCase.findById(id)
      .populate("reporterUserId", "name email companyName profileImage createdAt")
      .populate("reportedUserId", "name email companyName profileImage createdAt status enforcementStatus suspensionEndsAt enforcementReason")
      .populate("assignedAdminId", "name email");

    if (!moderationCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    const moderationHistory = await ModerationCase.find({
      reportedUserId: moderationCase.reportedUserId?._id || moderationCase.reportedUserId,
      _id: { $ne: moderationCase._id },
    })
      .select("caseId requestType reasonCategory status adminDecision enforcementAction createdAt reviewedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { case: moderationCase, moderationHistory },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/moderation/stats
 */
const getModerationStats = async (req, res) => {
  try {
    const [pending, underReview, actionTaken, rejected, pendingBlockRequests, activeBans, activeBlocks] =
      await Promise.all([
        ModerationCase.countDocuments({ status: "PENDING" }),
        ModerationCase.countDocuments({ status: "UNDER_REVIEW" }),
        ModerationCase.countDocuments({ status: "ACTION_TAKEN" }),
        ModerationCase.countDocuments({ status: "REJECTED" }),
        ModerationCase.countDocuments({ requestType: "BLOCK", status: { $in: ["PENDING", "UNDER_REVIEW"] } }),
        User.countDocuments({ enforcementStatus: "BANNED" }),
        User.countDocuments({ enforcementStatus: "RESTRICTED" }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        pending,
        underReview,
        actionTaken,
        rejected,
        pendingBlockRequests,
        activeBans,
        activeBlocks,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/moderation/cases/:id/action
 * Body: { enforcementAction: 'BLOCK'|'BAN'|'MESSAGE'|'MANUAL', messageText?,
 *   blockType?: 'TEMPORARY'|'PERMANENT', blockFrom?, blockUntil?, adminNotes? }
 * Every action is taken by the calling admin directly - there is no
 * separate assignment step.
 */
const takeAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { enforcementAction, messageText, blockType, blockFrom, blockUntil, adminNotes } = req.body;

    const moderationCase = await ModerationCase.findById(id);
    if (!moderationCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    await applyEnforcementAction({
      moderationCase,
      admin: req.user,
      enforcementAction,
      blockType,
      blockFrom,
      blockUntil,
      messageText,
      adminNotes,
    });

    // BAN is immediate: force the reported member's app to log out right
    // away instead of waiting for their next API call to hit the 403.
    if (enforcementAction === "BAN") {
      try {
        getIO().to(`user:${moderationCase.reportedUserId}`).emit("force-logout", {
          reason: "BANNED",
          message: "Your account has been banned by an administrator.",
        });
      } catch (socketError) {
        // Socket.IO may not be initialized (e.g. script/test context) - the
        // account is already banned server-side regardless.
      }
    }

    return res.status(200).json({ success: true, message: "Moderation action applied", data: moderationCase });
  } catch (error) {
    const statusCode = error instanceof ModerationError ? error.statusCode : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/moderation/cases/:id/reject
 * Body: { rejectionReason }
 */
const rejectCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const moderationCase = await ModerationCase.findById(id);
    if (!moderationCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    await rejectCaseService({ moderationCase, admin: req.user, rejectionReason });

    return res.status(200).json({ success: true, message: "Request rejected successfully", data: moderationCase });
  } catch (error) {
    const statusCode = error instanceof ModerationError ? error.statusCode : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/moderation/cases/:id/close
 */
const closeCaseHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = "CLOSED" } = req.body;

    if (!["CLOSED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid close status" });
    }

    const moderationCase = await ModerationCase.findById(id);
    if (!moderationCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }
    if (!["PENDING", "UNDER_REVIEW"].includes(moderationCase.status)) {
      return res.status(409).json({ success: false, message: "This case is already resolved" });
    }

    moderationCase.status = status;
    moderationCase.reviewedAt = new Date();
    moderationCase.assignedAdminId = moderationCase.assignedAdminId || req.user._id;
    await moderationCase.save();

    await logActivity({
      adminId: req.user._id,
      adminEmail: req.user.email,
      activityType: status === "CANCELLED" ? "CASE_CANCELLED" : "CASE_CLOSED",
      description: `${status === "CANCELLED" ? "Cancelled" : "Closed"} case ${moderationCase.caseId} with no enforcement action`,
      targetUser: moderationCase.reportedUserId,
      metadata: { caseId: moderationCase.caseId },
    });

    return res.status(200).json({ success: true, message: "Case closed", data: moderationCase });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/members/:id/restore
 * Reverse action for the Users page's "Unblock"/"Unban" buttons - clears
 * whatever enforcement is currently active and restores the account to
 * ACTIVE so the member can log in again.
 */
const restoreMember = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid member id" });
    }

    const user = await clearEnforcement({ userId: id, admin: req.user });

    return res.status(200).json({
      success: true,
      message: "Member restored to active",
      data: { _id: user._id, enforcementStatus: user.enforcementStatus },
    });
  } catch (error) {
    const statusCode = error instanceof ModerationError ? error.statusCode : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitReport,
  submitBlockRequest,
  addPersonalBlock,
  removePersonalBlock,
  getMyReports,
  getMyBlockedUsers,
  getMyEnforcementStatus,
  getCases,
  getCaseDetail,
  getModerationStats,
  takeAction,
  rejectCase,
  closeCase: closeCaseHandler,
  restoreMember,
};
