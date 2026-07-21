/**
 * Authentication Validation Schemas
 * Validates request data for authentication endpoints
 */

const Joi = require("joi");

/**
 * Schema for sending OTP
 */
const sendOTPSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
});

/**
 * Schema for verifying OTP
 */
const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  otp: Joi.string().length(5).required().messages({
    "string.length": "OTP must be 5 digits",
    "any.required": "OTP is required",
  }),
});

/**
 * Schema for verifying the OTP sent during forgot-password
 */
const verifyResetOTPSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  otp: Joi.string().length(5).required().messages({
    "string.length": "OTP must be 5 digits",
    "any.required": "OTP is required",
  }),
});

/**
 * Schema for user registration
 */
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  mobile: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Mobile must be 10 digits",
      "any.required": "Mobile is required",
    }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
  companyName: Joi.string().required().messages({
    "any.required": "Company name is required",
  }),
  city: Joi.string().required().messages({
  "any.required": "City is required",
}),
  chapterId: Joi.string().required().messages({
    "any.required": "Chapter is required",
  }),
  razorpayOrderId: Joi.string().required().messages({
    "any.required": "Payment order id is required",
  }),
  razorpayPaymentId: Joi.string().required().messages({
    "any.required": "Payment id is required",
  }),
  razorpaySignature: Joi.string().required().messages({
    "any.required": "Payment signature is required",
  }),
  razorpayInvoiceId: Joi.string().optional(),
});

/**
 * Schema for user login
 * Accepts either an email or a username (at least one is required)
 */
const loginSchema = Joi.object({
  email: Joi.string().email().messages({
    "string.email": "Please provide a valid email address",
  }),
  username: Joi.string().min(3).max(30).messages({
    "string.min": "Username must be at least 3 characters",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
})
  .or("email", "username")
  .messages({
    "object.missing": "Email or Username is required",
  });

/**
 * Schema for checking user status by email
 */
const checkStatusSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
});

/**
 * Schema for refresh token
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

module.exports = {
  sendOTPSchema,
  verifyOTPSchema,
  verifyResetOTPSchema,
  checkStatusSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};
