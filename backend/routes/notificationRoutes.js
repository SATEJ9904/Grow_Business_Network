/**
 * Notification Routes
 * Admin: compose/send/schedule announcements, view send history.
 * Member: browse own-chapter notifications, get seen/unseen state.
 */

const express = require('express');
const router = express.Router();

const {
  createNotification,
  listNotificationsAdmin,
  cancelNotification,
  listNotificationsForMember,
  listUnseenNotifications,
  markNotificationSeen,
} = require('../controllers/notificationController');

const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

/**
 * ============================================
 * ADMIN ROUTES
 * ============================================
 */

/**
 * Create (and, unless scheduled for later, immediately send) a notification.
 * POST /api/notifications
 * Headers: Authorization: Bearer {accessToken}
 * Body: subject, message, city, chapterIds[], buttonLabel, buttonLink, scheduledAt
 */
router.post('/', authMiddleware, adminMiddleware, createNotification);

/**
 * List every notification for the admin panel.
 * GET /api/notifications/admin/all
 * Headers: Authorization: Bearer {accessToken}
 */
router.get('/admin/all', authMiddleware, adminMiddleware, listNotificationsAdmin);

/**
 * Cancel a still-scheduled notification.
 * POST /api/notifications/:id/cancel
 * Headers: Authorization: Bearer {accessToken}
 */
router.post('/:id/cancel', authMiddleware, adminMiddleware, cancelNotification);

/**
 * ============================================
 * MEMBER ROUTES
 * ============================================
 */

/**
 * Notifications sent to the logged-in member's own chapter.
 * GET /api/notifications
 * Headers: Authorization: Bearer {accessToken}
 */
router.get('/', authMiddleware, listNotificationsForMember);

/**
 * Unseen notifications — drives the notification bell badge count.
 * GET /api/notifications/unseen
 * Headers: Authorization: Bearer {accessToken}
 */
router.get('/unseen', authMiddleware, listUnseenNotifications);

/**
 * Mark a notification as seen by the logged-in member.
 * POST /api/notifications/:id/mark-seen
 * Headers: Authorization: Bearer {accessToken}
 */
router.post('/:id/mark-seen', authMiddleware, markNotificationSeen);

module.exports = router;
