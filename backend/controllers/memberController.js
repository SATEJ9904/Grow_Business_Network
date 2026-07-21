/**
 * Member Controller
 * Handles member profile and list operations
 */

const User = require("../models/User");
const userService = require("../services/userService");
const { sendMemberProfileUpdatedEmail } = require("../services/emailService");

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

    const updateData = {
      ...req.body,
    };

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

    // Check if member is approved
    if (member.status !== "approved") {
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

    const users = await User.find({
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
    }).sort({ createdAt: -1 });

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
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with the provided email and mobile number",
      });
    }

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
  searchMembers,
};
