/**
 * Server Entry Point
 * Starts the Express server and initializes database connection
 */

require("dotenv").config();

const app = require("./app");
const { connectDatabase } = require("./config/db");
const cron = require("node-cron");
const { cleanupExpiredOTPs } = require("./services/otpService");
const os = require("os");

// Function to get local IP address
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};

// Server configuration
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || "development";

let server;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${NODE_ENV}`);
      console.log(`🌐 API Base URL: http://${getLocalIP()}:${PORT}`);
      console.log(`${"=".repeat(50)}\n`);
    });

    /**
     * Setup cron job to cleanup expired OTPs
     * Runs every 10 minutes
     */
    cron.schedule("*/10 * * * *", async () => {
      try {
        await cleanupExpiredOTPs();
      } catch (error) {
        console.error("❌ Cron job error:", error.message);
      }
    });

    console.log("✅ OTP cleanup cron job scheduled (every 10 minutes)");

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} signal received: closing HTTP server`);

  if (server) {
    server.close(async () => {
      console.log("✅ HTTP server closed");

      try {
        // Disconnect database
        const { disconnectDatabase } = require("./config/db");
        await disconnectDatabase();
        console.log("✅ Database disconnected");
      } catch (err) {
        console.error("❌ Error during shutdown:", err.message);
      }

      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force exit if not shutdown within 10 seconds
  setTimeout(() => {
    console.error("⚠️  Forcing shutdown due to timeout");
    process.exit(1);
  }, 10000);
};

/**
 * Handle uncaught exceptions
 */
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  console.error(error.stack);
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

/**
 * Handle shutdown signals
 */
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

/**
 * Start the server if this is the main module
 */
if (require.main === module) {
  startServer();
}

module.exports = { server, startServer, gracefulShutdown };
