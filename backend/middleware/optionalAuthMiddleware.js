/**
 * Optional Authorization Middleware
 * Decodes the Bearer token if one is present and valid, attaching req.userId
 * and req.currentUser so a public endpoint can personalize its response
 * (e.g. filtering out users the caller has personally blocked) - but never
 * rejects the request if the token is missing, expired, or invalid. Use this
 * only on routes that are intentionally public; it is not a substitute for
 * authMiddleware on anything that requires authentication.
 */

const { verifyAccessToken } = require('../utils/generateToken');
const User = require('../models/User');

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('blockedUserIds accountStatus');

    if (user && user.accountStatus !== 0) {
      req.userId = decoded.userId;
      req.currentUser = user;
    }
  } catch (error) {
    // Invalid/expired token on a public route - proceed unauthenticated.
  }

  next();
};

module.exports = { optionalAuthMiddleware };
