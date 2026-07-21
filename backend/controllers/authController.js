/**
 * Authorization Controller
 * Handles authentication operations: OTP, registration, login, refresh tokens, password reset
 */

const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const { validateEmail } = require("../utils/validateEmail");
const { generateTokens } = require("../utils/generateToken");
const {
  generateAndSendOTP,
  verifyOTP,
  createOTPRecord,
} = require("../services/otpService");
const {
  sendApprovalEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
} = require("../services/emailService");
const { verifyPaymentSignature } = require("../utils/razorpaySignature");
const { getFeeBreakdown } = require("../config/fees");
const { createInvoiceForPayment } = require("../services/invoiceService");
const userService = require("../services/userService");
const crypto = require("crypto");

/**
 * Send OTP to email for verification
 * POST /api/auth/send-otp
 */
const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    // Generate and send OTP
    const result = await generateAndSendOTP(emailValidation.email);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: emailValidation.email,
        expiresIn: "5 minutes",
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify OTP sent to email
 * POST /api/auth/verify-otp
 */
const verifyOTPController = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    // Verify OTP
    const result = await verifyOTP(emailValidation.email, otp);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: emailValidation.email,
        isVerified: true,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Check user registration status by email
 * POST /api/auth/check-status
 */
const checkStatus = async (req, res, next) => {
  try {
    const { email } = req.body;

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    const user = await userService.findUserByEmail(emailValidation.email);
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
        userId: user._id,
        email: user.email,
        name: user.name,
        status: user.status,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      companyName,
      city,
      chapterId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    // Check if email already registered
    const existingUser = await userService.findUserByEmail(
      emailValidation.email,
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Verify the Razorpay payment signature - this is the only proof of
    // payment we trust; a request without a valid signature never creates a user
    if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Please try again.",
      });
    }

    const feeBreakdown = getFeeBreakdown();

    // Prepare user data
    const userData = {
      name,
      email: emailValidation.email,
      mobile,
      password,
      companyName,
      city,
      chapterId,
      isEmailVerified: true, // OTP already verified
      paymentStatus: "paid",
      razorpayOrderId,
      razorpayPaymentId,
      paymentAmount: feeBreakdown.totalAmount,
      paidAt: new Date(),
    };

    // Handle file uploads
    if (req.files && req.files.companyLogo) {
      userData.companyLogo = req.files.companyLogo[0].path;
    }

    // Create user
    const newUser = await userService.createUser(userData);

    // Generate the official invoice PDF, save it, and email it to the
    // member. createInvoiceForPayment never throws - a PDF/email failure
    // must never fail a registration that already took real payment.
    await createInvoiceForPayment({
      user: newUser,
      razorpayOrderId,
      razorpayPaymentId,
      feeBreakdown,
    });

    return res.status(201).json({
      success: true,
      message: "Payment verified and registration successful. Your account is under review.",
      data: {
        userId: newUser._id,
        _id: newUser._id,
        id: newUser._id,
        email: newUser.email,
        status: newUser.status,
        paymentStatus: newUser.paymentStatus,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Username and password are required",
      });
    }

    // Identifier can be an email or a username - detect which
    const looksLikeEmail = identifier.includes("@");

    let user;
    if (looksLikeEmail) {
      const emailValidation = validateEmail(identifier);
      if (!emailValidation.valid) {
        return res.status(400).json({
          success: false,
          message: emailValidation.message,
        });
      }

      user = await User.findOne({
        email: emailValidation.email,
      }).select("+password");
    } else {
      user = await User.findOne({
        username: identifier.toLowerCase(),
      }).select("+password");
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password",
      });
    }

    // Email verification is only meaningful when the login itself is by
    // email - a username login never depends on email trust, so a
    // username-only account (or one that added an unverified email later
    // from its profile) can still log in with its username.
    if (looksLikeEmail && !user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    // Check account status
    if (user.status !== "approved") {
      return res.status(401).json({
        success: false,
        message:
          user.status === "pending"
            ? "Your account is under review. Please wait for approval."
            : "Your account has been rejected.",
      });
    }

    if (user.accountStatus === 0) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact admin.",
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString()
    );

    // Update refresh token directly without validating entire document
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          refreshToken,
        },
      }
    );

    // Attach refresh token to response object
    user.refreshToken = refreshToken;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: providedRefreshToken } = req.body;

    if (!providedRefreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Find user with this refresh token
    const user = await User.findOne({
      refreshToken: providedRefreshToken,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString(),
    );

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
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
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Clear refresh token
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    // Find user by email
    const user = await userService.findUserByEmail(emailValidation.email);
    if (!user) {
      // For security, don't reveal if user exists
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link and OTP will be sent.",
      });
    }

    // Generate reset token
    const resetToken = PasswordReset.generateResetToken();
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Delete any existing reset tokens for this email
    await PasswordReset.deleteMany({ email: emailValidation.email });

    // Create new password reset document
    const passwordReset = new PasswordReset({
      email: emailValidation.email,
      resetToken: resetToken,
      resetTokenHash: resetTokenHash,
      expiry: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    });

    await passwordReset.save();

    // Also generate an OTP for the mobile app's OTP-entry flow, and send
    // it in the same email alongside the browser reset link
    const { otp } = await createOTPRecord(emailValidation.email);

    // Send reset email (link for web, OTP code for the mobile app)
    await sendPasswordResetEmail(
      emailValidation.email,
      resetToken,
      user.name,
      otp,
    );

    // Log activity
    const { logActivity } = require("../services/activityService");
    await logActivity(user._id, "FORGOT_PASSWORD_REQUESTED", {
      email: emailValidation.email,
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link and OTP will be sent.",
      data: {
        email: emailValidation.email,
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
 * Verify the OTP sent by forgotPassword (mobile app flow)
 * POST /api/auth/verify-reset-otp
 */
const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    // Throws if the OTP is missing/expired/wrong - message bubbles up as-is
    await verifyOTP(emailValidation.email, otp);

    // Mark the matching password-reset request as OTP-verified so
    // resetPassword can trust it without requiring the emailed token
    const passwordReset = await PasswordReset.findOne({
      email: emailValidation.email,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!passwordReset || passwordReset.isExpired()) {
      return res.status(400).json({
        success: false,
        message:
          "Reset request has expired. Please request a new password reset.",
      });
    }

    passwordReset.isOtpVerified = true;
    await passwordReset.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        email: emailValidation.email,
        isVerified: true,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify password reset token
 * GET /api/auth/verify-reset-token/:token
 */
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    // Hash the token
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find password reset record
    const passwordReset = await PasswordReset.findOne({
      resetTokenHash: resetTokenHash,
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    // Check if token is expired
    if (passwordReset.isExpired()) {
      await PasswordReset.deleteOne({ _id: passwordReset._id });
      return res.status(400).json({
        success: false,
        message: "Reset token has expired. Please request a new one.",
      });
    }

    // Check if token already used
    if (passwordReset.isUsed) {
      return res.status(400).json({
        success: false,
        message: "This reset token has already been used.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reset token is valid",
      data: {
        email: passwordReset.email,
        isValid: true,
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
 * Reset password with token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password, confirmPassword } = req.body;

    // Validate inputs
    if ((!token && !email) || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "A reset token (or verified email) and password are required",
      });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    let passwordReset;

    if (token) {
      // Web flow: reset link with token
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      passwordReset = await PasswordReset.findOne({
        resetTokenHash: resetTokenHash,
      });

      if (!passwordReset) {
        return res.status(400).json({
          success: false,
          message: "Invalid reset token",
        });
      }
    } else {
      // Mobile app flow: email already verified via OTP
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({
          success: false,
          message: emailValidation.message,
        });
      }

      passwordReset = await PasswordReset.findOne({
        email: emailValidation.email,
        isUsed: false,
        isOtpVerified: true,
      }).sort({ createdAt: -1 });

      if (!passwordReset) {
        return res.status(400).json({
          success: false,
          message:
            "OTP verification required or has expired. Please verify the OTP again.",
        });
      }
    }

    // Check if token is expired
    if (passwordReset.isExpired()) {
      await PasswordReset.deleteOne({ _id: passwordReset._id });
      return res.status(400).json({
        success: false,
        message: "Reset request has expired. Please request a new one.",
      });
    }

    // Check if token already used
    if (passwordReset.isUsed) {
      return res.status(400).json({
        success: false,
        message: "This reset request has already been used.",
      });
    }

    // Find user
    const user = await userService.findUserByEmail(passwordReset.email);
    if (!user) {
      console.log("❌ User not found:", passwordReset.email);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update password
    user.password = password;
    await user.save();
    console.log("✅ Password updated");

    // Mark token as used
    passwordReset.isUsed = true;
    await passwordReset.save();
    console.log("✅ Token marked as used");

    // Send confirmation email
    await sendPasswordResetConfirmationEmail(user.email, user.name);

    // Log activity
    const { logActivity } = require("../services/activityService");
    await logActivity(user._id, "PASSWORD_RESET_SUCCESSFUL", {
      email: user.email,
    });

    console.log("✅ Password reset successful");

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    console.log("🚨 Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTPController,
  checkStatus,
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  verifyResetOTP,
  verifyResetToken,
  resetPassword,
};
