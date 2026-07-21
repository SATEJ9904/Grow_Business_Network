/**
 * Admin Controller
 * Handles admin operations: approve/reject members, manage chapters, dashboard stats
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const Chapter = require("../models/Chapter");
const AdminSession = require("../models/AdminSession");
const Invoice = require("../models/Invoice");
const userService = require("../services/userService");
const activityService = require("../services/activityService");
const {
  sendApprovalEmail,
  sendRejectionEmail,
  sendNewMemberJoinedEmail,
} = require("../services/emailService");
const { generateTokens } = require("../utils/generateToken");
const { validateEmail } = require("../utils/validateEmail");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

/**
 * Admin Login
 * POST /api/admin/login
 * Authenticates admin user and creates a session with 24-hour expiry
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find admin by email
    const admin = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );
    if (!admin || admin.role !== "admin") {
      // Log failed login attempt
      await activityService.logActivity({
        adminId: null,
        adminEmail: normalizedEmail,
        activityType: "FAILED_LOGIN",
        description: `Failed login attempt for email: ${normalizedEmail}`,
        status: "failed",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if admin is approved
    if (admin.status !== "approved") {
      return res.status(401).json({
        success: false,
        message: "Admin account is not approved",
      });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(
      password.trim(),
      admin.password,
    );
    if (!isPasswordMatch) {
      // Log failed login attempt
      await activityService.logActivity({
        adminId: admin._id,
        adminEmail: admin.email,
        activityType: "FAILED_LOGIN",
        description: `Failed login attempt for admin: ${admin.name}`,
        status: "failed",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(admin._id);
    const sessionId = uuidv4();
    const expiryTime = moment().add(24, "hours").toDate();

    // Create session
    const session = new AdminSession({
      adminId: admin._id,
      adminEmail: admin.email,
      sessionId,
      accessToken,
      refreshToken,
      expiryTime,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    await session.save();

    // Log login activity
    await activityService.logActivity({
      adminId: admin._id,
      adminEmail: admin.email,
      activityType: "LOGIN",
      description: `Admin ${admin.name} logged in successfully`,
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        sessionId,
        accessToken,
        expiryIn: "24h",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin Logout
 * POST /api/admin/logout
 * Terminates the admin session
 */
const adminLogout = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const adminId = req.admin?._id || req.user?._id;

    if (!adminId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Admin ID and session ID are required",
      });
    }

    // Find and update session
    const session = await AdminSession.findOneAndUpdate(
      { sessionId, adminId, isActive: true },
      {
        isActive: false,
        logoutTime: new Date(),
      },
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Log logout activity
    const admin = await User.findById(adminId);
    await activityService.logActivity({
      adminId,
      adminEmail: admin.email,
      activityType: "LOGOUT",
      description: `Admin ${admin.name} logged out`,
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Admin logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify Admin Session
 * GET /api/admin/verify-session
 * Checks if the admin session is still valid
 */
const verifySession = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const adminId = req.admin?._id || req.user?._id;

    if (!sessionId || !adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Find active session
    const session = await AdminSession.findOne({
      sessionId,
      adminId,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid",
      });
    }

    // Check if session has expired
    if (session.expiryTime < new Date()) {
      await AdminSession.findByIdAndUpdate(session._id, { isActive: false });

      const admin = await User.findById(adminId);
      await activityService.logActivity({
        adminId,
        adminEmail: admin.email,
        activityType: "SESSION_EXPIRED",
        description: `Admin session expired for ${admin.name}`,
        sessionId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    // Update last activity time
    await AdminSession.findByIdAndUpdate(session._id, {
      lastActivityTime: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Session is valid",
      data: {
        expiryTime: session.expiryTime,
        remainingTime: moment(session.expiryTime).diff(
          moment(),
          "milliseconds",
        ),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get pending members for approval
 * GET /api/admin/members?status=pending&page=1&limit=10
 */
const getPendingMembers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status || "pending";

    // Debug logging
    console.log("📋 Fetching members with filters:", {
      page,
      limit,
      status,
      role: "member",
    });

    // Get members
    const result = await userService.getAllMembers(page, limit, {
      status,
      role: "member",
    });

    console.log(
      "📊 Found members:",
      result.data.length,
      "Total:",
      result.pagination.total,
    );
    if (result.data.length > 0) {
      console.log(
        "✅ Members:",
        result.data.map((m) => ({ id: m._id, name: m.name, status: m.status })),
      );
    }

    return res.status(200).json({
      success: true,
      message: "Pending members retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("❌ Error in getPendingMembers:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get member details for review
 * GET /api/admin/member/:id
 */
const getMemberDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get member
    const member = await userService.getUserById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member details retrieved successfully",
      data: member.toJSON ? member.toJSON() : member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get the latest generated invoice for a member
 * GET /api/admin/invoice/user/:userId
 */
const getUserInvoice = async (req, res) => {
  try {
    const { userId } = req.params;

    const invoice = await Invoice.findOne({ user: userId }).sort({ createdAt: -1 });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "No invoice found for this user",
      });
    }

    const baseUrl = (process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    const pdfUrl = `${baseUrl}/uploads/${invoice.pdfPath}`;

    return res.status(200).json({
      success: true,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        amounts: invoice.amounts,
        currency: invoice.currency,
        issuedAt: invoice.issuedAt,
        status: invoice.status,
        pdfUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Approve member account
 * POST /api/admin/approve/:id
 */
const approveMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?._id || req.user?._id;

    // Get user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Approve user
    const approvedUser = await userService.approveUser(id);

    // Send approval email
    try {
      await sendApprovalEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Email send error:", emailError.message);
      // Don't fail the request if email fails to send
    }

    // Notify all other approved members that a new member has joined
    // Fire-and-forget: don't make the admin wait on the whole membership's emails
    userService
      .getOtherApprovedMembers(user._id)
      .then((otherMembers) =>
        Promise.allSettled(
          otherMembers.map((member) =>
            sendNewMemberJoinedEmail(member.email, member.name, {
              name: user.name,
              companyName: user.companyName,
            }),
          ),
        ),
      )
      .catch((broadcastError) => {
        console.error("New member broadcast email error:", broadcastError.message);
      });

    // Log activity
    const admin = await User.findById(adminId);
    await activityService.logActivity({
      adminId,
      adminEmail: admin.email,
      activityType: "APPROVE_REQUEST",
      description: `Approved registration request from ${user.name}`,
      targetUser: user._id,
      targetUserEmail: user.email,
      targetUserName: user.name,
      targetCompany: user.companyName,
      metadata: {
        userId: id,
        userEmail: user.email,
        userCompany: user.companyName,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Member approved successfully",
      data: approvedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reject member account
 * POST /api/admin/reject/:id
 */
const rejectMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin?._id || req.user?._id;

    // Get user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Reject user
    const rejectedUser = await userService.rejectUser(id);

    // Send rejection email
    try {
      await sendRejectionEmail(user.email, user.name, reason || "");
    } catch (emailError) {
      console.error("Email send error:", emailError.message);
      // Don't fail the request if email fails to send
    }

    // Log activity
    const admin = await User.findById(adminId);
    await activityService.logActivity({
      adminId,
      adminEmail: admin.email,
      activityType: "REJECT_REQUEST",
      description: `Rejected registration request from ${user.name}`,
      targetUser: user._id,
      targetUserEmail: user.email,
      targetUserName: user.name,
      targetCompany: user.companyName,
      metadata: {
        userId: id,
        userEmail: user.email,
        userCompany: user.companyName,
        reason: reason || "No reason provided",
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Member rejected successfully",
      data: rejectedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Change a member's chapter
 * PUT /api/admin/member/:id/chapter
 * Body: { chapterId }
 */
const updateMemberChapter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { chapterId } = req.body;
    const adminId = req.admin?._id || req.user?._id;

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: "chapterId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chapter ID",
      });
    }

    const member = await User.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const previousChapter = member.chapterId
      ? await Chapter.findById(member.chapterId)
      : null;

    let updatedUser;
    try {
      updatedUser = await userService.changeMemberChapter(id, chapterId);
    } catch (serviceError) {
      const notFound = /chapter not found/i.test(serviceError.message);
      return res.status(notFound ? 404 : 500).json({
        success: false,
        message: notFound ? "Chapter not found" : serviceError.message,
      });
    }

    const newChapter = await Chapter.findById(chapterId);

    const admin = await User.findById(adminId);
    await activityService.logActivity({
      adminId,
      adminEmail: admin.email,
      activityType: "UPDATE_MEMBER_CHAPTER",
      description: `Moved ${member.name} from ${previousChapter?.name || "no chapter"} to ${newChapter.name}`,
      targetUser: member._id,
      targetUserEmail: member.email,
      targetUserName: member.name,
      targetCompany: member.companyName,
      metadata: {
        userId: id,
        previousChapterId: previousChapter?._id || null,
        previousChapterName: previousChapter?.name || null,
        newChapterId: newChapter._id,
        newChapterName: newChapter.name,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Member's chapter updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create a bare-bones member account
 * POST /api/admin/create-member
 * Body: username, email, password, chapterId, city
 * Member logs in immediately with username/email + password and fills in
 * the rest of their profile later from the app.
 */
const createMember = async (req, res, next) => {
  try {
    const { username, email, password, chapterId, city } = req.body;
    const adminId = req.admin?._id || req.user?._id;

    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: "Enter a username or an email",
      });
    }

    if (!password || !chapterId || !city) {
      return res.status(400).json({
        success: false,
        message: "Password, chapter and city are required",
      });
    }

    if (username && username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters",
      });
    }

    if (username && !/^[a-zA-Z0-9_. ]+$/.test(username.trim())) {
      return res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers, spaces, dots and underscores",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    let validatedEmail;
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({
          success: false,
          message: emailValidation.message,
        });
      }
      validatedEmail = emailValidation.email;
    }

    const newUser = await userService.createMemberByAdmin({
      username: username ? username.trim() : undefined,
      email: validatedEmail,
      password,
      chapterId,
      city,
    });

    // Log activity
    const admin = await User.findById(adminId);
    await activityService.logActivity({
      adminId,
      adminEmail: admin?.email,
      activityType: "CREATE_MEMBER",
      description: `Created member account "${newUser.username || newUser.email}"`,
      targetUser: newUser._id,
      targetUserEmail: newUser.email,
      targetUserName: newUser.username,
      metadata: {
        userId: newUser._id,
        username: newUser.username,
        chapterId,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    // Notify all other approved members that a new member has joined
    // Fire-and-forget: don't make the admin wait on the whole membership's emails
    userService
      .getOtherApprovedMembers(newUser._id)
      .then((otherMembers) =>
        Promise.allSettled(
          otherMembers.map((member) =>
            sendNewMemberJoinedEmail(member.email, member.name, {
              name: newUser.name,
              companyName: newUser.companyName,
            }),
          ),
        ),
      )
      .catch((broadcastError) => {
        console.error("New member broadcast email error:", broadcastError.message);
      });

    return res.status(201).json({
      success: true,
      message: "Member account created successfully",
      data: newUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create new chapter
 * POST /api/admin/chapter
 */
const createChapter = async (req, res, next) => {
  try {
    const { name, city, description } = req.body;

    // Check if chapter already exists
    const existingChapter = await Chapter.findOne({
      name: name.trim(),
    });

    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: "Chapter with this name already exists",
      });
    }

    // Create new chapter
    const newChapter = new Chapter({
      name: name.trim(),
      city: city.trim(),
      description: description || "",
    });

    await newChapter.save();

    return res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: newChapter,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all chapters
 * GET /api/admin/chapters
 */
const getChapters = async (req, res, next) => {
  try {
    // Get all chapters with real member counts from User collection
    const chapters = await Chapter.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "chapterId",
          as: "members",
        },
      },
      {
        $addFields: {
          activeMembers: {
            $size: {
              $filter: {
                input: "$members",
                as: "member",
                cond: { $eq: ["$$member.status", "approved"] },
              },
            },
          },
          totalMemberCount: { $size: "$members" },
          pendingMemberCount: {
            $size: {
              $filter: {
                input: "$members",
                as: "member",
                cond: { $eq: ["$$member.status", "pending"] },
              },
            },
          },
        },
      },
      {
        $project: {
          members: 0,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Chapters retrieved successfully",
      data: chapters,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE CHAPTER
const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, description } = req.body;

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }

    chapter.name = name || chapter.name;
    chapter.city = city || chapter.city;
    chapter.description = description || chapter.description;

    await chapter.save();

    return res.status(200).json({
      success: true,
      message: "Chapter updated successfully",
      data: chapter,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard-stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Get total counts
    const totalMembers = await User.countDocuments({
      role: "member",
    });

    const approvedMembers = await User.countDocuments({
      role: "member",
      status: "approved",
    });

    const pendingMembers = await User.countDocuments({
      role: "member",
      status: "pending",
    });

    const rejectedMembers = await User.countDocuments({
      role: "member",
      status: "rejected",
    });

    const totalChapters = await Chapter.countDocuments({
      isActive: true,
    });

    // Get members by chapter
    const membersByChapter = await User.aggregate([
      {
        $match: { role: "member", status: "approved" },
      },
      {
        $lookup: {
          from: "chapters",
          localField: "chapterId",
          foreignField: "_id",
          as: "chapter",
        },
      },
      {
        $unwind: "$chapter",
      },
      {
        $group: {
          _id: "$chapter.name",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get recent registrations
    const recentRegistrations = await User.find({
      role: "member",
    })
      .select("name email status createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // Member growth over the last 6 months (new registrations per month)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const memberGrowthRaw = await User.aggregate([
      {
        $match: { role: "member", createdAt: { $gte: sixMonthsAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          newMembers: { $sum: 1 },
          approvedMembers: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill in any months with no registrations so the chart has a continuous timeline
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      monthLabels.push({ key, label });
    }
    const memberGrowthMap = new Map(memberGrowthRaw.map((m) => [m._id, m]));
    const memberGrowth = monthLabels.map(({ key, label }) => ({
      month: key,
      label,
      newMembers: memberGrowthMap.get(key)?.newMembers || 0,
      approvedMembers: memberGrowthMap.get(key)?.approvedMembers || 0,
    }));

    // Chapter health: active vs pending members per chapter
    const chapterHealth = await User.aggregate([
      {
        $match: { role: "member", status: { $in: ["approved", "pending"] } },
      },
      {
        $lookup: {
          from: "chapters",
          localField: "chapterId",
          foreignField: "_id",
          as: "chapter",
        },
      },
      {
        $unwind: "$chapter",
      },
      {
        $group: {
          _id: "$chapter.name",
          active: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        },
      },
      {
        $sort: { active: -1 },
      },
      {
        $limit: 8,
      },
    ]);

    // Business category distribution among approved members
    const businessCategoryDistribution = await User.aggregate([
      {
        $match: {
          role: "member",
          status: "approved",
          businessCategory: { $nin: [null, ""] },
        },
      },
      {
        $group: {
          _id: "$businessCategory",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 6,
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: {
        totalMembers,
        approvedMembers,
        pendingMembers,
        rejectedMembers,
        totalChapters,
        membersByChapter,
        recentRegistrations,
        memberGrowth,
        chapterHealth,
        businessCategoryDistribution,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Activities
 * GET /api/admin/activities?page=1&limit=20
 */
const getActivities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const adminId = req.admin?._id || req.user?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await activityService.getActivityLogs(page, limit, {
      adminId,
    });

    return res.status(200).json({
      success: true,
      message: "Activities retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Recent Activities
 * GET /api/admin/recent-activities?limit=10
 */
const getRecentActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const adminId = req.admin?._id || req.user?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const activities = await activityService.getRecentActivities(
      adminId,
      limit,
    );

    return res.status(200).json({
      success: true,
      message: "Recent activities retrieved successfully",
      data: activities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Check User Status
 * GET /api/admin/user-status?id=userId
 * No authentication required - Public endpoint
 * Returns user's approval status
 */
const checkUserStatus = async (req, res, next) => {
  try {
    const { id } = req.query;

    // Validate id parameter
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID parameter is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Find user by id
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User status retrieved successfully",
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, targetChapterId } = req.body;

    const User = require("../models/User");
    const Chapter = require("../models/Chapter");

    if (action === "migrate") {
      if (!targetChapterId) {
        return res.status(400).json({ message: "Target chapter required" });
      }

      await User.updateMany({ chapterId: id }, { chapterId: targetChapterId });
    }

    if (action === "inactive") {
      await User.updateMany({ chapterId: id }, { status: "inactive" });
    }

    if (action === "deleteAll") {
      await User.deleteMany({ chapterId: id });
    }

    await Chapter.findByIdAndDelete(id);

    res.json({ success: true, message: "Chapter deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Delete failed" });
  }
};

module.exports = {
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
};
