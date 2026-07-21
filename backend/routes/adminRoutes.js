/**
 * Admin Routes
 * Handles admin operations: member approval/rejection, chapter management, dashboard
 */

const express = require('express');
const router = express.Router();

const {
  adminLogin,
  adminLogout,
  verifySession,
  getPendingMembers,
  getMemberDetail,
  getUserInvoice,
  approveMember,
  rejectMember,
  updateMemberChapter,
  createMember,
  createChapter,
  getChapters,
  checkUserStatus,
  getDashboardStats,
  getActivities,
  getRecentActivities,
  updateChapter,   
  deleteChapter,   
} = require('../controllers/adminController');

const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

/**
 * ============================================
 * ADMIN AUTHENTICATION ROUTES
 * ============================================
 */

/**
 * Admin Login
 * POST /api/admin/login
 * Body: email, password
 * Returns: accessToken, sessionId, expiryIn
 */
router.post('/login', adminLogin);

/**
 * Admin Logout
 * POST /api/admin/logout
 * Headers: Authorization: Bearer {accessToken}
 * Body: sessionId
 */
router.post('/logout', authMiddleware, adminMiddleware, adminLogout);

/**
 * Verify Admin Session
 * GET /api/admin/verify-session?sessionId=uuid
 * Headers: Authorization: Bearer {accessToken}
 * Checks if session is still valid and returns remaining time
 */
router.get('/verify-session', authMiddleware, adminMiddleware, verifySession);

/**
 * ============================================
 * MEMBER MANAGEMENT ROUTES
 * ============================================
 */

/**
 * Get all members with optional status filter
 * GET /api/admin/members?status=pending&page=1&limit=10
 * Headers: Authorization: Bearer {accessToken}
 * Query params:
 *   - status: pending, approved, or rejected (default: pending)
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 10)
 */
router.get('/members', authMiddleware, adminMiddleware, getPendingMembers);

/**
 * DEBUG: Get all users and their statuses
 * GET /api/admin/debug/all-users
 * (Remove this endpoint in production)
 */
router.get('/debug/all-users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const allUsers = await User.find({}).select('name email role status createdAt -password');
    
    console.log('\n' + '='.repeat(60));
    console.log('DEBUG: All users in database:');
    console.log('='.repeat(60));
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} | ${u.email} | Role: ${u.role} | Status: ${u.status}`);
    });
    
    const pendingCount = await User.countDocuments({ status: 'pending', role: 'member' });
    const approvedCount = await User.countDocuments({ status: 'approved', role: 'member' });
    const rejectedCount = await User.countDocuments({ status: 'rejected', role: 'member' });
    
    console.log('='.repeat(60));
    console.log(`STATS: Pending: ${pendingCount} | Approved: ${approvedCount} | Rejected: ${rejectedCount}`);
    console.log('='.repeat(60) + '\n');
    
    return res.status(200).json({
      success: true,
      data: {
        allUsers: allUsers.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt,
        })),
        stats: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: allUsers.length,
        }
      }
    });
  } catch (error) {
    console.error('DEBUG error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * DEBUG: Detailed diagnostic for finding pending members
 * GET /api/admin/debug/diagnostic
 */
router.get('/debug/diagnostic', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    
    console.log('\n' + '='.repeat(70));
    console.log('🔍 DETAILED DIAGNOSTIC FOR PENDING MEMBERS');
    console.log('='.repeat(70));
    
    // Test 1: Count all users
    const totalUsers = await User.countDocuments({});
    console.log(`\n1️⃣  Total users in database: ${totalUsers}`);
    
    // Test 2: Count by role
    const memberCount = await User.countDocuments({ role: 'member' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`   - Members: ${memberCount}, Admins: ${adminCount}`);
    
    // Test 3: Count by status
    const pendingCount = await User.countDocuments({ status: 'pending' });
    const approvedCount = await User.countDocuments({ status: 'approved' });
    const rejectedCount = await User.countDocuments({ status: 'rejected' });
    console.log(`   - Pending: ${pendingCount}, Approved: ${approvedCount}, Rejected: ${rejectedCount}`);
    
    // Test 4: Combined query (what the API uses)
    const pendingMembers = await User.find({ role: 'member', status: 'pending' });
    console.log(`\n2️⃣  Query result (role='member' AND status='pending'): ${pendingMembers.length} users`);
    
    if (pendingMembers.length > 0) {
      console.log('   Details:');
      pendingMembers.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.name} (${user.email})`);
        console.log(`      Role: ${user.role} | Status: ${user.status}`);
        console.log(`      Created: ${user.createdAt}`);
      });
    }
    
    // Test 5: Check raw data types
    const firstPending = await User.findOne({ status: 'pending' });
    if (firstPending) {
      console.log(`\n3️⃣  Raw data type check:`);
      console.log(`   Status value: "${firstPending.status}" (type: ${typeof firstPending.status})`);
      console.log(`   Status length: ${firstPending.status.length}`);
      console.log(`   Status charCodes: ${[...firstPending.status].map(c => c.charCodeAt(0)).join(',')}`);
      console.log(`   Role value: "${firstPending.role}" (type: ${typeof firstPending.role})`);
      console.log(`   Status === 'pending': ${firstPending.status === 'pending'}`);
    }
    
    // Test 6: Check with case-insensitive regex
    const regexPending = await User.find({ status: /^pending$/i, role: 'member' });
    console.log(`\n4️⃣  Regex search (case-insensitive): ${regexPending.length} users`);
    
    // Test 7: Check raw MongoDB documents
    console.log(`\n5️⃣  First 5 users (all fields):`);
    const allUsers = await User.find({}).limit(5).select('name email role status -password');
    allUsers.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.name}`);
      console.log(`      - Email: ${user.email}`);
      console.log(`      - Role: '${user.role}' (length: ${user.role.length})`);
      console.log(`      - Status: '${user.status}' (length: ${user.status.length})`);
    });
    
    console.log('='.repeat(70) + '\n');
    
    return res.status(200).json({
      success: true,
      data: {
        counts: {
          total: totalUsers,
          members: memberCount,
          admins: adminCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          pendingMembers: pendingMembers.length,
        },
        pendingMembersDetails: pendingMembers.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt,
        })),
      }
    });
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * DEBUG: Search for specific user
 * GET /api/admin/debug/find-user?email=satejshendage9904@gmail.com
 */
router.get('/debug/find-user', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter required'
      });
    }
    
    console.log(`\n🔎 Searching for user: ${email}`);
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log(`✅ Found user:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: '${user.role}' (${user.role.length} chars)`);
      console.log(`   Status: '${user.status}' (${user.status.length} chars)`);
      console.log(`   Status === 'pending': ${user.status === 'pending'}`);
      console.log(`   Status trim === 'pending': ${user.status.trim() === 'pending'}`);
      
      return res.status(200).json({
        success: true,
        data: {
          found: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            companyName: user.companyName,
            mobile: user.mobile,
          }
        }
      });
    } else {
      console.log(`❌ User not found`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('❌ Find user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


/**
 * Get detailed information for a specific member
 * GET /api/admin/member/:id
 * Headers: Authorization: Bearer {accessToken}
 * Params: id - Member ID
 */
router.get('/member/:id', authMiddleware, adminMiddleware, getMemberDetail);

/**
 * Get the latest invoice for a member
 * GET /api/admin/invoice/user/:userId
 * Headers: Authorization: Bearer {accessToken}
 * Params: userId - Member ID
 */
router.get('/invoice/user/:userId', authMiddleware, adminMiddleware, getUserInvoice);

/**
 * Approve member account for access
 * POST /api/admin/approve/:id
 * Headers: Authorization: Bearer {accessToken}
 * Params: id - Member ID
 * Sends approval email to member
 */
router.post('/approve/:id', authMiddleware, adminMiddleware, approveMember);

/**
 * Reject member account
 * POST /api/admin/reject/:id
 * Headers: Authorization: Bearer {accessToken}
 * Params: id - Member ID
 * Body: reason (optional) - Rejection reason
 * Sends rejection email to member
 */
router.post('/reject/:id', authMiddleware, adminMiddleware, rejectMember);

/**
 * Change a member's chapter
 * PUT /api/admin/member/:id/chapter
 * Headers: Authorization: Bearer {accessToken}
 * Params: id - Member ID
 * Body: chapterId - destination chapter's ObjectId
 * Keeps both the old and new chapter's member-count stats in sync.
 */
router.put('/member/:id/chapter', authMiddleware, adminMiddleware, updateMemberChapter);

/**
 * Create a bare-bones member account
 * POST /api/admin/create-member
 * Headers: Authorization: Bearer {accessToken}
 * Body: username, email, password, chapterId, city
 * Member logs in immediately with username/email + password and completes
 * their profile later from the app.
 */
router.post('/create-member', authMiddleware, adminMiddleware, createMember);

/**
 * ============================================
 * CHAPTER MANAGEMENT ROUTES
 * ============================================
 */

/**
 * Create new chapter
 * POST /api/admin/chapter
 * Headers: Authorization: Bearer {accessToken}
 * Body: name, city, description (optional)
 */
router.post('/chapter', authMiddleware, adminMiddleware, createChapter);

/**
 * Get all chapters
 * GET /api/admin/chapters
 * Returns list of all active chapters
 * No authentication required
 */
router.get('/chapters', getChapters);

/**
 * Check User Status
 * GET /api/admin/user-status?id=userId
 * Query params:
 *   - id: User's ID (required)
 * Returns: user's approval status (pending, approved, rejected)
 * No authentication required
 */
router.get('/user-status', checkUserStatus);

/**
 * ============================================
 * DASHBOARD ROUTES
 * ============================================
 */

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard-stats
 * Headers: Authorization: Bearer {accessToken}
 * Returns: total members, approved count, pending count, rejected count,
 *          total chapters, members by chapter, recent registrations
 */
router.get('/dashboard-stats', authMiddleware, adminMiddleware, getDashboardStats);

/**
 * ============================================
 * ACTIVITY LOG ROUTES
 * ============================================
 */

/**
 * Get all activities with pagination
 * GET /api/admin/activities?page=1&limit=20
 * Headers: Authorization: Bearer {accessToken}
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20)
 */
router.get('/activities', authMiddleware, adminMiddleware, getActivities);

/**
 * Get recent activities
 * GET /api/admin/recent-activities?limit=10
 * Headers: Authorization: Bearer {accessToken}
 * Query params:
 *   - limit: number of recent activities (default: 10)
 */
router.get('/recent-activities', authMiddleware, adminMiddleware, getRecentActivities);
// UPDATE
// UPDATE
router.put(
  "/chapter/:id",
  authMiddleware,
  adminMiddleware,
  updateChapter
);

// DELETE
router.delete(
  "/chapter/:id",
  authMiddleware,
  adminMiddleware,
  deleteChapter
);

module.exports = router;

