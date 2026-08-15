/**
 * Notification Dispatch Service
 * Resolves an admin's city/chapter target selection into a concrete list of
 * chapters, and pushes a notification out over Socket.IO — either right
 * away (createNotification, when scheduledAt is now/past) or later, when
 * the cron sweep in server.js finds it due.
 */

const Chapter = require('../models/Chapter');
const Notification = require('../models/Notification');
const { getIO } = require('../utils/socket');

/**
 * @param {string} city - '' or 'ALL' means every city; otherwise a specific city
 * @param {string[]} chapterIds - explicit chapter selection, if any
 * @returns {Promise<{chapterIds: string[], chapterNames: string[], isAllChapters: boolean}>}
 */
const resolveTargetChapters = async ({ city, chapterIds }) => {
  if (Array.isArray(chapterIds) && chapterIds.length > 0) {
    const chapters = await Chapter.find({ _id: { $in: chapterIds } }).select('_id name');
    return {
      chapterIds: chapters.map((c) => String(c._id)),
      chapterNames: chapters.map((c) => c.name),
      isAllChapters: false,
    };
  }

  const isAllCities = !city || city === 'ALL';
  const query = isAllCities ? {} : { city };
  const chapters = await Chapter.find(query).select('_id name');

  return {
    chapterIds: chapters.map((c) => String(c._id)),
    chapterNames: chapters.map((c) => c.name),
    isAllChapters: isAllCities,
  };
};

/**
 * Marks a notification "sent" and pushes it to every targeted chapter room.
 * Safe to call for a notification that's already sent (no-op).
 */
const dispatchNotification = async (notification) => {
  if (notification.status === 'sent') return notification;

  notification.status = 'sent';
  notification.sentAt = new Date();
  await notification.save();

  try {
    const io = getIO();
    notification.chapterIds.forEach((chapterId) => {
      io.to(`chapter:${String(chapterId)}`).emit('notification:new', notification);
    });
  } catch (error) {
    console.error('Socket emit failed (notification:new):', error.message);
  }

  return notification;
};

/**
 * Cron entry point — sends every scheduled notification whose time has come.
 */
const dispatchDueNotifications = async () => {
  const due = await Notification.find({
    status: 'scheduled',
    isActive: true,
    scheduledAt: { $lte: new Date() },
  });

  for (const notification of due) {
    try {
      await dispatchNotification(notification);
    } catch (error) {
      console.error(`Failed to dispatch notification ${notification._id}:`, error.message);
    }
  }
};

module.exports = { resolveTargetChapters, dispatchNotification, dispatchDueNotifications };
