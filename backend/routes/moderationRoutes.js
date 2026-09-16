/**
 * Moderation Routes (member-facing)
 * Report/block submission, personal blocking, and the member's own
 * report/enforcement status. Admin-facing moderation endpoints live in
 * routes/adminRoutes.js under /api/admin/moderation instead.
 */

const express = require("express");
const router = express.Router();

const {
  submitReport,
  submitBlockRequest,
  addPersonalBlock,
  removePersonalBlock,
  getMyReports,
  getMyBlockedUsers,
  getMyEnforcementStatus,
} = require("../controllers/moderationController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { reportLimiter } = require("../middleware/rateLimiter");

/**
 * Submit a report against a member/business/website/image.
 * POST /api/moderation/report
 * Headers: Authorization: Bearer {accessToken}
 * Body (JSON): reportedUserId, reportedContentType, reportedContentId?,
 *   reasonCategory, description?
 */
router.post("/report", authMiddleware, reportLimiter, submitReport);

/**
 * Submit an admin-reviewed request to block/ban a member.
 * POST /api/moderation/block-request
 * Same body shape as /report.
 */
router.post("/block-request", authMiddleware, reportLimiter, submitBlockRequest);

/**
 * Immediate, self-service personal block (no admin review).
 * POST /api/moderation/personal-block/:userId
 * DELETE /api/moderation/personal-block/:userId
 */
router.post("/personal-block/:userId", authMiddleware, addPersonalBlock);
router.delete("/personal-block/:userId", authMiddleware, removePersonalBlock);

/**
 * GET /api/moderation/my-reports
 */
router.get("/my-reports", authMiddleware, getMyReports);

/**
 * GET /api/moderation/my-blocked-users
 */
router.get("/my-blocked-users", authMiddleware, getMyBlockedUsers);

/**
 * GET /api/moderation/my-enforcement-status
 */
router.get("/my-enforcement-status", authMiddleware, getMyEnforcementStatus);

module.exports = router;
