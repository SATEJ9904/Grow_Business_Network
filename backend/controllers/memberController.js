/**
 * Member Controller
 * Handles member profile and list operations
 */

const User = require("../models/User");
const DeletedRecord = require("../models/DeletedRecord");
const Website = require("../models/Website");
const jwt = require("jsonwebtoken");
const { generateAndSendOTP, verifyOTP } = require("../services/otpService");
const { logActivity } = require("../services/activityService");
const userService = require("../services/userService");
const { sendMemberProfileUpdatedEmail } = require("../services/emailService");

// Fields a member may set on their own profile via PUT /member/profile -
// exactly the set the mobile app's edit-profile screens actually send.
// Everything else (role, status, accountStatus, enforcementStatus,
// suspensionEndsAt, blockedUserIds, paymentStatus, refreshToken, password,
// etc.) must never be settable from this self-service endpoint, since a
// user could otherwise self-promote to admin or clear their own
// moderation enforcement by including those keys in the request body.
const SELF_EDITABLE_PROFILE_FIELDS = [
  "name",
  "email",
  "mobile",
  "companyName",
  "tagline",
  "businessCategory",
  "industry",
  "website",
  "uniqueBusiness",
  "professionalValues",
  "expertise",
  "achievements",
  "collaborationType",
  "growthOpportunities",
  "connectReason",
  "preferredCities",
  "products",
  "priceRange",
  "minimumOrder",
  "serviceAreas",
  "instagram",
  "linkedin",
];

function pickSelfEditableFields(body) {
  const picked = {};
  for (const field of SELF_EDITABLE_PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      picked[field] = body[field];
    }
  }
  return picked;
}

/**
 * Get current user profile
 * GET /api/member/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get user profile
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user.toJSON ? user.toJSON() : user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update current user profile
 * PUT /api/member/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const updateData = pickSelfEditableFields(req.body || {});

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // Profile Image
    if (req.files?.profileImage?.[0]) {
      const filePath = req.files.profileImage[0].path.replace(/\\/g, '/');
      updateData.profileImage = filePath;
      console.log("Profile Image Path:", filePath);
    }

    // Cover/Banner Image
    if (req.files?.coverImage?.[0]) {
      const filePath = req.files.coverImage[0].path.replace(/\\/g, '/');
      updateData.coverImage = filePath;
      console.log("Cover Image Path:", filePath);
    }

    console.log("Update Data:", updateData);
    const updatedUser = await userService.updateUserProfile(userId, updateData);

    // Notify all other approved members that this member updated their profile
    // Fire-and-forget: don't make the member wait on the whole membership's emails
    if (updatedUser?.status === "approved") {
      userService
        .getOtherApprovedMembers(userId)
        .then((otherMembers) =>
          Promise.allSettled(
            otherMembers.map((member) =>
              sendMemberProfileUpdatedEmail(
                member.email,
                member.name,
                updatedUser.name,
              ),
            ),
          ),
        )
        .catch((broadcastError) => {
          console.error(
            "Profile update broadcast email error:",
            broadcastError.message,
          );
        });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all members with pagination
 * GET /api/member/list?page=1&limit=10&status=approved
 */
const getMemberList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status; // Optional filter

    // Build filters
    const filters = { role: "member", status: "approved" };
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filters.status = status;
    }
    // Hide members the requesting (identified) caller has personally blocked
    if (req.currentUser?.blockedUserIds?.length) {
      filters._id = { $nin: req.currentUser.blockedUserIds };
    }

    // Get members list
    const result = await userService.getAllMembers(page, limit, filters);

    return res.status(200).json({
      success: true,
      message: "Members list retrieved successfully",
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
 * Get member by ID
 * GET /api/member/:id
 */
const getMemberById = async (req, res, next) => {
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

    // Check if member is approved. Demo accounts are treated the same as
    // unapproved ones here: they can use the app fully themselves, but
    // their profile is never shown to other members.
    if (member.status !== "approved" || member.role === "demo") {
      return res.status(403).json({
        success: false,
        message: "This member profile is not available",
      });
    }

    // If the requesting (identified) caller has personally blocked this
    // member, hide the profile from them exactly as if it didn't exist.
    if (req.currentUser?.blockedUserIds?.some((blockedId) => String(blockedId) === String(id))) {
      return res.status(403).json({
        success: false,
        message: "This member profile is not available",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member retrieved successfully",
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
 * Delete account (soft delete)
 * PUT /api/member/delete/:id
 * Marks user account as deleted
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own account",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { accountStatus: 0 },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Account deactivated",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const recoverAccount = async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus: 1 },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Account recovered successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const permanentDelete = async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await User.findByIdAndDelete(userId);

    return res.json({
      success: true,
      message: "Account permanently deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * Search members
 * GET /api/member/search
 */
const searchMembers = async (req, res) => {
  try {
    const search = req.query.search || "";

    const query = {
      role: "member",
      status: "approved",

      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },

        {
          companyName: {
            $regex: search,
            $options: "i",
          },
        },

        {
          mobile: {
            $regex: search,
            $options: "i",
          },
        },

        {
          chapter: {
            $regex: search,
            $options: "i",
          },
        },

        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    };

    // Hide members the requesting (identified) caller has personally blocked
    if (req.currentUser?.blockedUserIds?.length) {
      query._id = { $nin: req.currentUser.blockedUserIds };
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteAccountByEmail = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    console.log("Request Body:", req.body);

    // Validation
    if (!email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Email and mobile number are required",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
    }).populate("chapterId", "name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with the provided email and mobile number",
      });
    }

    // Snapshot the account into the permanent deleted-records audit trail
    // before the User document itself is removed - this is the only place
    // this data survives, and it's what powers the "Deleted Accounts" tab
    // (and the rejoin tracking below) on the admin panel.
    await DeletedRecord.create({
      originalUserId: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      companyName: user.companyName,
      chapterName: user.chapterId?.name || "",
      city: user.city,
      profileImage: user.profileImage,
      deletionReason: user.deletionRequest?.reason || "",
      deletedAt: new Date(),
      deletedBy: req.user?._id || null,
    });

    // Permanently delete user
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message: "Account permanently deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const requestDeletion = async (req, res) => {
  try {
    const { email, mobile, reason } = req.body;

    if (!email || !mobile || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email, mobile number and reason are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account found with the provided email and mobile number",
      });
    }

    if (user.deletionRequest?.requested) {
      return res.status(400).json({
        success: false,
        message: "Deletion request already submitted",
      });
    }

    user.deletionRequest = {
      requested: true,
      reason: reason.trim(),
      requestedAt: new Date(),
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Your account deletion request has been submitted successfully. Our team will process it shortly.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all account deletion requests
 * GET /api/member/request-deletion
 */
const getDeletionRequests = async (req, res) => {
  try {
    const requests = await User.find({
      "deletionRequest.requested": true,
    })
      .select(
        "_id name email mobile companyName profileImage deletionRequest createdAt"
      )
      .populate("chapterId", "name")
      .sort({
        "deletionRequest.requestedAt": -1,
      });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reject an account deletion request - the admin has decided to keep this
 * member. Clears the request flag so it stops showing up as pending; the
 * account itself is left completely untouched.
 * PUT /api/member/request-deletion/:userId/reject
 */
const rejectDeletionRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (!user.deletionRequest?.requested) {
      return res.status(400).json({
        success: false,
        message: "This member has no pending deletion request",
      });
    }

    user.deletionRequest = {
      requested: false,
      reason: "",
      requestedAt: null,
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Deletion request rejected. The member's account has been kept.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Short-lived proof that the member re-verified their email by OTP just now.
// Returned by verifyDeletionOTP and required by deleteMyAccount, so a stolen
// or left-open session alone can never delete an account.
const DELETION_TOKEN_PURPOSE = "account_deletion";
const DELETION_TOKEN_EXPIRY = "10m";

/**
 * Email an OTP to the logged-in member's own address before self-deletion.
 * The address is taken from the account, never from the request body.
 * POST /api/member/delete-me/send-otp
 */
const sendDeletionOTP = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("email");

    if (!user?.email) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await generateAndSendOTP(user.email);

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
      data: { expiresIn: "5 minutes" },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify the self-deletion OTP and hand back a short-lived deletion token.
 * POST /api/member/delete-me/verify-otp
 * Body: otp
 */
const verifyDeletionOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || !String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required",
      });
    }

    const user = await User.findById(req.userId).select("email");

    if (!user?.email) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Throws with a user-facing message on a wrong/expired code
    await verifyOTP(user.email, String(otp));

    const deletionToken = jwt.sign(
      { userId: String(user._id), purpose: DELETION_TOKEN_PURPOSE },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: DELETION_TOKEN_EXPIRY },
    );

    return res.status(200).json({
      success: true,
      message: "Email verified",
      data: { deletionToken },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message.replace(/^OTP verification failed: /, ""),
    });
  }
};

/**
 * Permanently delete the logged-in member's own account after OTP
 * verification. Removes exactly one User document (the caller's) plus that
 * member's own generated website, snapshots it into DeletedRecord and writes
 * a DELETE_ACCOUNT entry to the admin activity log.
 * DELETE /api/member/delete-me
 * Body: deletionToken, acceptedTerms (true)
 */
const deleteMyAccount = async (req, res) => {
  try {
    const { deletionToken, acceptedTerms } = req.body;

    if (acceptedTerms !== true) {
      return res.status(400).json({
        success: false,
        message: "Please accept the terms to delete your account",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(deletionToken, process.env.JWT_ACCESS_SECRET);
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: "Your verification has expired. Please verify your email again.",
      });
    }

    if (
      decoded.purpose !== DELETION_TOKEN_PURPOSE ||
      decoded.userId !== String(req.userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own account",
      });
    }

    const user = await User.findById(req.userId).populate("chapterId", "name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await DeletedRecord.create({
      originalUserId: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      companyName: user.companyName,
      chapterName: user.chapterId?.name || "",
      city: user.city,
      profileImage: user.profileImage,
      deletionReason: "Deleted by the member from the mobile app",
      deletedAt: new Date(),
      deletedBy: user._id,
    });

    // Scoped to this one member only - deleteOne by their own id
    await Website.deleteOne({ userId: String(user._id) });
    const result = await User.deleteOne({ _id: user._id });

    if (result.deletedCount !== 1) {
      return res.status(500).json({
        success: false,
        message: "Could not delete your account. Please try again.",
      });
    }

    await logActivity({
      adminId: null,
      adminEmail: null,
      activityType: "DELETE_ACCOUNT",
      description: `${user.name || user.email} deleted their account from the mobile app`,
      targetUserEmail: user.email,
      targetUserName: user.name,
      targetCompany: user.companyName || null,
      metadata: {
        source: "self_service_app",
        originalUserId: String(user._id),
        mobile: user.mobile,
        chapterName: user.chapterId?.name || "",
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || null,
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
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
  sendDeletionOTP,
  verifyDeletionOTP,
  deleteMyAccount,
  searchMembers,
};
