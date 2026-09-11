const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  getMemberList,
  getMemberById,
  deleteAccount,
  recoverAccount,
  permanentDelete,
  deleteAccountByEmail,
  requestDeletion,
  getDeletionRequests,
  rejectDeletionRequest,
  searchMembers,
} = require("../controllers/memberController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const {
  uploadMiddleware,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

/**
 * Get current logged-in member profile
 * GET /api/member/profile
 * Headers: Authorization: Bearer {accessToken}
 */
router.get("/profile", authMiddleware, getProfile);

/**
 * Update current member profile
 * PUT /api/member/profile
 * Headers: Authorization: Bearer {accessToken}
 * Body: name, mobile, companyName, services (array), description
 * Files: profileImage (optional)
 */
router.put(
  "/profile",
  authMiddleware,
  uploadMiddleware.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  handleUploadError,
  updateProfile,
);

/**
 * Get list of approved members (public endpoint with pagination)
 * GET /api/member/list?page=1&limit=10&status=approved
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 10)
 *   - status: filter by status (optional)
 */
router.get("/list", getMemberList);

/**
 * Search members
 * GET /api/member/search?search=value
 */
router.get("/search", searchMembers);

/**
 * Delete account (soft delete)
 * PUT /api/member/delete/:id
 * Marks account as deleted by setting accountStatus to 0
 */
router.put("/delete/:id", authMiddleware, deleteAccount);

/**
 * Recover account
 * PUT /api/member/recover/:id
 */
router.put("/recover/:id", recoverAccount);

/**
 * Permanent delete account
 * DELETE /api/member/permanent/:id
 */
router.delete("/permanent/:id", permanentDelete);

/**
 * Permanently delete a member's account - only an admin may action a
 * pending deletion request.
 * DELETE /api/member/delete-account
 * Headers: Authorization: Bearer {adminAccessToken}
 */
router.delete(
  "/delete-account",
  authMiddleware,
  adminMiddleware,
  deleteAccountByEmail
);

/**
 * Submit an account deletion request (public - the member may not be
 * logged in when they do this from the support site).
 * POST /api/member/request-deletion
 */
router.post(
  "/request-deletion",
  requestDeletion
);

/**
 * List pending account deletion requests - admin only.
 * GET /api/member/request-deletion
 * Headers: Authorization: Bearer {adminAccessToken}
 */
router.get(
  "/request-deletion",
  authMiddleware,
  adminMiddleware,
  getDeletionRequests
);

/**
 * Reject a pending deletion request - the admin has decided to keep this
 * member's account. Admin only.
 * PUT /api/member/request-deletion/:userId/reject
 * Headers: Authorization: Bearer {adminAccessToken}
 */
router.put(
  "/request-deletion/:userId/reject",
  authMiddleware,
  adminMiddleware,
  rejectDeletionRequest
);

/**
 * Get specific member details (public endpoint)
 * GET /api/member/:id
 * Params: id - Member ID
 * Note: Only shows approved member profiles
 */
router.get("/:id", getMemberById);

module.exports = router;
