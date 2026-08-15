/**
 * Notification Controller
 * Admin: compose a subject/message announcement (optionally scheduled,
 * optionally targeted at specific chapters) with an optional call-to-action
 * button, and track what's been sent.
 * Member: browse notifications for their own chapter and get notified in
 * real time.
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const { resolveTargetChapters, dispatchNotification } = require('../services/notificationDispatchService');

/**
 * ============================================
 * ADMIN
 * ============================================
 */

/**
 * Create a notification. Sends immediately (and notifies chapter members in
 * real time) unless `scheduledAt` is a future timestamp, in which case the
 * cron sweep in server.js sends it when it comes due.
 * POST /api/notifications
 */
const createNotification = async (req, res) => {
  try {
    const { subject, message, city, chapterIds, buttonLabel, buttonLink, scheduledAt } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'subject and message are required',
      });
    }

    let parsedScheduledAt = new Date();
    if (scheduledAt) {
      const candidate = new Date(scheduledAt);
      if (Number.isNaN(candidate.getTime())) {
        return res.status(400).json({ success: false, message: 'scheduledAt must be a valid date' });
      }
      parsedScheduledAt = candidate;
    }

    const normalizedChapterIds = Array.isArray(chapterIds) ? chapterIds.filter(Boolean) : [];
    const target = await resolveTargetChapters({ city, chapterIds: normalizedChapterIds });

    if (target.chapterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No chapters found for the selected target audience',
      });
    }

    const isImmediate = parsedScheduledAt.getTime() <= Date.now();

    let notification = await Notification.create({
      subject,
      message,
      city: city || '',
      isAllChapters: target.isAllChapters,
      chapterIds: target.chapterIds,
      chapterNames: target.chapterNames,
      buttonLabel: buttonLabel || '',
      buttonLink: buttonLink || '',
      scheduledAt: parsedScheduledAt,
      status: 'scheduled',
      createdBy: req.user._id,
    });

    if (isImmediate) {
      notification = await dispatchNotification(notification);
    }

    return res.status(201).json({
      success: true,
      message: isImmediate ? 'Notification sent successfully' : 'Notification scheduled successfully',
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to create notification',
    });
  }
};

/**
 * List every notification (sent, scheduled, cancelled) for the admin panel.
 * GET /api/notifications/admin/all
 */
const listNotificationsAdmin = async (req, res) => {
  try {
    const notifications = await Notification.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch notifications',
    });
  }
};

/**
 * Cancel a still-scheduled notification before it goes out.
 * POST /api/notifications/:id/cancel
 */
const cancelNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    if (notification.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only a still-scheduled notification can be cancelled',
      });
    }

    notification.status = 'cancelled';
    await notification.save();

    return res.status(200).json({ success: true, message: 'Notification cancelled', data: notification });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to cancel notification',
    });
  }
};

/**
 * ============================================
 * MEMBER
 * ============================================
 */

const annotateNotification = (notification, seenIds) => ({
  ...notification.toObject(),
  isSeen: seenIds.has(String(notification._id)),
});

/**
 * All sent notifications targeted at the logged-in member's chapter.
 * GET /api/notifications
 */
const listNotificationsForMember = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('chapterId');
    if (!user?.chapterId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const notifications = await Notification.find({
      chapterIds: user.chapterId,
      status: 'sent',
      isActive: true,
    }).sort({ sentAt: -1 });

    const seenIds = new Set(
      notifications
        .filter((n) => n.seenBy.some((s) => String(s.user) === String(req.userId)))
        .map((n) => String(n._id))
    );

    const data = notifications.map((n) => annotateNotification(n, seenIds));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch notifications',
    });
  }
};

/**
 * Unseen sent notifications for the logged-in member's chapter — feeds the
 * notification bell badge count.
 * GET /api/notifications/unseen
 */
const listUnseenNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('chapterId');
    if (!user?.chapterId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const notifications = await Notification.find({
      chapterIds: user.chapterId,
      status: 'sent',
      isActive: true,
      'seenBy.user': { $ne: req.userId },
    }).sort({ sentAt: -1 });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch unseen notifications',
    });
  }
};

/**
 * Mark a notification as seen by the logged-in member (idempotent).
 * POST /api/notifications/:id/mark-seen
 */
const markNotificationSeen = async (req, res) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, 'seenBy.user': { $ne: req.userId } },
      { $push: { seenBy: { user: req.userId, seenAt: new Date() } } }
    );

    return res.status(200).json({ success: true, message: 'Notification marked as seen' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to mark notification as seen',
    });
  }
};

module.exports = {
  createNotification,
  listNotificationsAdmin,
  cancelNotification,
  listNotificationsForMember,
  listUnseenNotifications,
  markNotificationSeen,
};
