/**
 * Activity Service
 * Handles logging of all admin activities
 */

const ActivityLog = require('../models/ActivityLog');
const moment = require('moment');

/**
 * Log activity to database
 * @param {Object} data - Activity data
 * @returns {Promise<Object>} - Created activity log
 */
const logActivity = async (data) => {
  try {
    const activity = new ActivityLog({
      adminId: data.adminId,
      adminEmail: data.adminEmail,
      activityType: data.activityType,
      description: data.description,
      targetUser: data.targetUser || null,
      targetUserEmail: data.targetUserEmail || null,
      targetUserName: data.targetUserName || null,
      targetCompany: data.targetCompany || null,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      status: data.status || 'success',
      sessionId: data.sessionId || null,
    });

    return await activity.save();
  } catch (error) {
    console.error('Error logging activity:', error.message);
    // Don't throw error, just log it to not interrupt the main process
    return null;
  }
};

/**
 * Get activity logs with filters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} - Paginated results
 */
const getActivityLogs = async (page = 1, limit = 20, filters = {}) => {
  try {
    const query = {};

    // Apply filters
    if (filters.adminId) query.adminId = filters.adminId;
    if (filters.activityType) query.activityType = filters.activityType;
    if (filters.status) query.status = filters.status;
    if (filters.sessionId) query.sessionId = filters.sessionId;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    // Search in description or user details
    if (filters.search) {
      query.$or = [
        { description: { $regex: filters.search, $options: 'i' } },
        { targetUserEmail: { $regex: filters.search, $options: 'i' } },
        { targetUserName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await ActivityLog.countDocuments(query);
    const activities = await ActivityLog.find(query)
      .populate('adminId', 'name email')
      .populate('targetUser', 'name email companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      data: activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Error fetching activity logs: ${error.message}`);
  }
};

/**
 * Get recent activities for dashboard
 * @param {string} adminId - Admin ID
 * @param {number} limit - Number of recent activities
 * @returns {Promise<Array>} - Recent activities
 */
const getRecentActivities = async (adminId, limit = 10) => {
  try {
    const activities = await ActivityLog.find({ adminId })
      .populate('targetUser', 'name email companyName')
      .sort({ createdAt: -1 })
      .limit(limit);

    return activities.map((activity) => ({
      id: activity._id,
      type: activity.activityType,
      description: activity.description,
      targetUser: activity.targetUser?.name || activity.targetUserName,
      targetCompany: activity.targetCompany,
      timestamp: activity.createdAt,
      timeAgo: moment(activity.createdAt).fromNow(),
      status: activity.status,
      icon: getActivityIcon(activity.activityType),
      color: getActivityColor(activity.activityType),
    }));
  } catch (error) {
    throw new Error(`Error fetching recent activities: ${error.message}`);
  }
};

/**
 * Get activity statistics
 * @param {string} adminId - Admin ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} - Activity statistics
 */
const getActivityStats = async (adminId, days = 30) => {
  try {
    const startDate = moment().subtract(days, 'days').toDate();

    const stats = await ActivityLog.aggregate([
      {
        $match: {
          adminId: require('mongoose').Types.ObjectId(adminId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          activities: {
            $push: {
              type: '$_id',
              count: '$count',
            },
          },
          totalActivities: { $sum: '$count' },
        },
      },
    ]);

    return stats[0] || { activities: [], totalActivities: 0 };
  } catch (error) {
    throw new Error(`Error fetching activity statistics: ${error.message}`);
  }
};

/**
 * Get activity icon based on type
 */
const getActivityIcon = (activityType) => {
  const iconMap = {
    LOGIN: '🔓',
    LOGOUT: '🔒',
    APPROVE_REQUEST: '✅',
    REJECT_REQUEST: '❌',
    VIEW_DETAILS: '👁️',
    EXPORT_DATA: '📤',
    UPDATE_ADMIN: '⚙️',
    CREATE_CHAPTER: '📚',
    DELETE_ACCOUNT: '🗑️',
    SESSION_EXPIRED: '⏱️',
    FAILED_LOGIN: '⚠️',
  };
  return iconMap[activityType] || '📝';
};

/**
 * Get activity color based on type
 */
const getActivityColor = (activityType) => {
  const colorMap = {
    LOGIN: 'green',
    LOGOUT: 'gray',
    APPROVE_REQUEST: 'blue',
    REJECT_REQUEST: 'red',
    VIEW_DETAILS: 'purple',
    EXPORT_DATA: 'orange',
    UPDATE_ADMIN: 'yellow',
    CREATE_CHAPTER: 'indigo',
    DELETE_ACCOUNT: 'dark-red',
    SESSION_EXPIRED: 'gray',
    FAILED_LOGIN: 'red',
  };
  return colorMap[activityType] || 'gray';
};

module.exports = {
  logActivity,
  getActivityLogs,
  getRecentActivities,
  getActivityStats,
  getActivityIcon,
  getActivityColor,
};
