/**
 * Authorization Middleware
 * Verifies JWT token and attaches user info to request
 */

const { verifyAccessToken } = require('../utils/generateToken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token
 *
 * A valid signature only proves the token was issued at login time - it says
 * nothing about whether the account is still in good standing. Access tokens
 * live for a while after issuance, so an account that gets rejected or
 * deactivated *after* a token was handed out must still be caught here on
 * every subsequent request, not just re-checked at the next login.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Re-check the account's current standing on every request, not just at login
    const user = await User.findById(decoded.userId).select('status accountStatus role');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists',
      });
    }

    if (user.accountStatus === 0) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.',
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been rejected.',
      });
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.userRole = user.role;
    req.userStatus = user.status;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message || 'Invalid or expired token',
    });
  }
};

/**
 * Middleware to check if user is authenticated
 * @param {Object} req - Express request object
 * @returns {boolean} True if user is authenticated
 */
const isAuthenticated = (req) => {
  return !!req.userId;
};

module.exports = {
  authMiddleware,
  isAuthenticated,
};
