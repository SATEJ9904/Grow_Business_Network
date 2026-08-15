/**
 * Socket.IO Setup
 * Real-time channel for meeting notifications (admin -> chapter members)
 * and live booking updates (member payment -> admin dashboard).
 *
 * Rooms:
 *   - `admin`               joined by any connected user with role 'admin'
 *   - `chapter:<chapterId>` joined by members, scoped to their own chapter
 */

const { Server } = require('socket.io');
const { verifyAccessToken } = require('./generateToken');
const User = require('../models/User');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('role chapterId');

      if (!user) {
        return next(new Error('Account no longer exists'));
      }

      socket.userId = String(user._id);
      socket.userRole = user.role;
      socket.chapterId = user.chapterId ? String(user.chapterId) : null;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.userRole === 'admin') {
      socket.join('admin');
    } else if (socket.chapterId) {
      socket.join(`chapter:${socket.chapterId}`);
    }
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket(httpServer) first.');
  }
  return io;
};

module.exports = { initSocket, getIO };
