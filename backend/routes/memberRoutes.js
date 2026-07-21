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
  searchMembers,
} = require("../controllers/memberController");

const { authMiddleware } = require("../middleware/authMiddleware");
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

router.delete(
  "/delete-account",
  deleteAccountByEmail
);

router.post(
  "/request-deletion",
  requestDeletion
);
  
router.get(
  "/request-deletion",
  getDeletionRequests
);

/**
 * Get specific member details (public endpoint)
 * GET /api/member/:id
 * Params: id - Member ID
 * Note: Only shows approved member profiles
 */
router.get("/:id", getMemberById);

module.exports = router;
