/**
 * Authentication Routes
 * Handles email verification, registration, login, and token management
 */

const express = require("express");
const router = express.Router();
const Joi = require("joi");

const {
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
} = require("../controllers/authController");

const { authMiddleware } = require("../middleware/authMiddleware");
const {
  uploadMiddleware,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

const {
  sendOTPSchema,
  verifyOTPSchema,
  verifyResetOTPSchema,
  checkStatusSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} = require("../validations/authValidation");

/**
 * Validation middleware that validates request body against schema
 * @param {Object} schema - Joi schema for validation
 * @returns {Function} Express middleware
 */
const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const messages = error.details.map((err) => err.message).join(", ");
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${messages}`,
    });
  }

  req.body = value;
  next();
};

/**
 * Send OTP for email verification
 * POST /api/auth/send-otp
 * @param {string} email - User email address
 */
router.post("/send-otp", validateRequest(sendOTPSchema), sendOTP);

/**
 * Verify OTP and confirm email
 * POST /api/auth/verify-otp
 * @param {string} email - User email address
 * @param {string} otp - 5-digit OTP received via email
 */
router.post(
  "/verify-otp",
  validateRequest(verifyOTPSchema),
  verifyOTPController,
);

/**
 * Register new member
 * POST /api/auth/register
 * Body: name, email, mobile, password, companyName, chapterId,
 *       razorpayOrderId, razorpayPaymentId, razorpaySignature, razorpayInvoiceId
 * Files: companyLogo (optional)
 */
router.post(
  "/register",
  uploadMiddleware.fields([{ name: "companyLogo", maxCount: 1 }]),
  handleUploadError,
  validateRequest(registerSchema),
  register,
);

/**
 * Check existing user status by email
 * POST /api/auth/check-status
 */
router.post("/check-status", validateRequest(checkStatusSchema), checkStatus);

/**
 * Login member
 * POST /api/auth/login
 * @param {string} email - User email
 * @param {string} password - User password
 */
router.post("/login", validateRequest(loginSchema), login);

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 * @param {string} refreshToken - Valid refresh token
 */
router.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  refreshToken,
);

/**
 * Logout member
 * POST /api/auth/logout
 * Headers: Authorization: Bearer {accessToken}
 */
router.post("/logout", authMiddleware, logout);

/**
 * Request password reset
 * POST /api/auth/forgot-password
 * @param {string} email - User email address
 */
router.post(
  "/forgot-password",
  validateRequest(
    Joi.object({
      email: Joi.string().email().required(),
    }),
  ),
  forgotPassword,
);

/**
 * Verify the OTP sent by forgot-password (mobile app flow)
 * POST /api/auth/verify-reset-otp
 * @param {string} email - User email address
 * @param {string} otp - 5-digit OTP received via email
 */
router.post(
  "/verify-reset-otp",
  validateRequest(verifyResetOTPSchema),
  verifyResetOTP,
);

/**
 * Verify password reset token
 * GET /api/auth/verify-reset-token/:token
 * @param {string} token - Password reset token from email
 */
router.get("/verify-reset-token/:token", verifyResetToken);

/**
 * Reset password
 * POST /api/auth/reset-password
 * Web flow: @param {string} token - Password reset token from the emailed link
 * Mobile flow: @param {string} email - Email already verified via /verify-reset-otp
 * @param {string} password - New password
 * @param {string} confirmPassword - Confirm new password
 */
router.post(
  "/reset-password",
  validateRequest(
    Joi.object({
      token: Joi.string(),
      email: Joi.string().email(),
      password: Joi.string().min(6).required(),
      confirmPassword: Joi.string().min(6).required(),
    })
      .or("token", "email")
      .messages({
        "object.missing": "A reset token or verified email is required",
      }),
  ),
  resetPassword,
);

module.exports = router;
