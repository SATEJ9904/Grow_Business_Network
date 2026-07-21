/**
 * Error Middleware
 * Centralized error handling for the application
 */

/**
 * Global error handler middleware
 * Must be last middleware in the chain
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorMiddleware = (error, req, res, next) => {
  // Set default error status and message
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  // Log error for debugging
  console.error('❌ Error:', {
    status,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors)
      .map((err) => err.message)
      .join(', ');

    return res.status(400).json({
      success: false,
      message: `Validation Error: ${messages}`,
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // MongoDB Cast Error
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(403).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(403).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Default error response
  return res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

/**
 * 404 Not Found middleware
 * Should be placed before error middleware
 */
const notFoundMiddleware = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.path} not found`,
  });
};

module.exports = {
  errorMiddleware,
  notFoundMiddleware,
};
