/**
 * Meeting Routes
 * Admin: schedule meetings, view booked seats.
 * Member: browse own-chapter meetings, get seen/unseen state, book + pay a seat.
 */

const express = require("express");
const router = express.Router();

const {
  createMeeting,
  listMeetingsAdmin,
  getMeetingBookings,
  listMeetingsForMember,
  listUnseenMeetings,
  markMeetingSeen,
  createBookingOrder,
  verifyBookingPayment,
} = require("../controllers/meetingController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const { uploadMiddleware, handleUploadError } = require("../middleware/uploadMiddleware");

/**
 * ============================================
 * ADMIN ROUTES
 * ============================================
 */

/**
 * Create a meeting for a chapter. Notifies chapter members in real time.
 * POST /api/meetings
 * Headers: Authorization: Bearer {accessToken}
 * Body (multipart/form-data): name, description, meetingDate, meetingTime,
 *   venue, chapterId, fee, flyerImage (file)
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware.single("flyerImage"),
  handleUploadError,
  createMeeting
);

/**
 * List all meetings with live booking counts/subtotals.
 * GET /api/meetings/admin/all
 * Headers: Authorization: Bearer {accessToken}
 */
router.get("/admin/all", authMiddleware, adminMiddleware, listMeetingsAdmin);

/**
 * Booked-seats detail for a single meeting (for the admin modal).
 * GET /api/meetings/:id/bookings
 * Headers: Authorization: Bearer {accessToken}
 */
router.get("/:id/bookings", authMiddleware, adminMiddleware, getMeetingBookings);

/**
 * ============================================
 * MEMBER ROUTES
 * ============================================
 */

/**
 * Meetings for the logged-in member's own chapter.
 * GET /api/meetings
 * Headers: Authorization: Bearer {accessToken}
 */
router.get("/", authMiddleware, listMeetingsForMember);

/**
 * Unseen + still-upcoming meetings — drives the on-open popup.
 * GET /api/meetings/unseen
 * Headers: Authorization: Bearer {accessToken}
 */
router.get("/unseen", authMiddleware, listUnseenMeetings);

/**
 * Mark a meeting as seen by the logged-in member.
 * POST /api/meetings/:id/mark-seen
 * Headers: Authorization: Bearer {accessToken}
 */
router.post("/:id/mark-seen", authMiddleware, markMeetingSeen);

/**
 * Create a Razorpay order for a meeting seat.
 * POST /api/meetings/:id/create-order
 * Headers: Authorization: Bearer {accessToken}
 */
router.post("/:id/create-order", authMiddleware, createBookingOrder);

/**
 * Verify a captured seat payment and persist the booking.
 * POST /api/meetings/:id/verify-payment
 * Headers: Authorization: Bearer {accessToken}
 * Body: razorpayOrderId, razorpayPaymentId, razorpaySignature
 */
router.post("/:id/verify-payment", authMiddleware, verifyBookingPayment);

module.exports = router;
