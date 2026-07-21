/**
 * Rate Limiter Middleware
 * Prevents brute force attacks and excessive requests
 */

const rateLimit = require("express-rate-limit");

// General rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased to 50 for development (was 5)
  message: "Too many login attempts, please try again later",
  skipSuccessfulRequests: true, // Don't count successful login attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts, please try again later",
    });
  },
});

// Rate limiter for OTP generation
const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit to 50 OTP requests per minute per IP
  message: "Too many OTP requests, please try again after 1 minute",
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many OTP requests, please try again after 1 minute",
    });
  },
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit to 100 registration attempts per minute per IP
  message: "Too many registration attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many registration attempts, please try again later",
    });
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
  otpLimiter,
  registerLimiter,
};
