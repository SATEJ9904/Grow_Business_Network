// // /**
// //  * Express Application Setup
// //  * Configures middleware, routes, and error handling
// //  */

// // require("dotenv").config();

// // const express = require("express");
// // const helmet = require("helmet");
// // const cors = require("cors");
// // const path = require("path");

// // // Import middleware
// // const { apiLimiter } = require("./middleware/rateLimiter");
// // const {
// //   errorMiddleware,
// //   notFoundMiddleware,
// // } = require("./middleware/errorMiddleware");

// // // Database connection check middleware
// // const checkDatabaseConnection = (req, res, next) => {
// //   const mongoose = require("mongoose");
// //   if (mongoose.connection.readyState !== 1) {
// //     return res.status(503).json({
// //       success: false,
// //       message: "Database connection unavailable. Please try again later.",
// //       error: "SERVICE_UNAVAILABLE",
// //     });
// //   }
// //   next();
// // };

// // // Import routes
// // const authRoutes = require("./routes/authRoutes");
// // const memberRoutes = require("./routes/memberRoutes");
// // const adminRoutes = require("./routes/adminRoutes");

// // // Initialize Express app
// // const app = express();

// // /**
// //  * ============================================
// //  * MIDDLEWARE SETUP
// //  * ============================================
// //  */

// // // Security middleware
// // app.use(helmet());

// // // CORS configuration - Permissive for development
// // const corsOptions = {
// //   origin: process.env.CORS_ORIGIN || "http://localhost:3000",
// //   credentials: true,
// //   optionsSuccessStatus: 200,
// //   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
// //   allowedHeaders: ["Content-Type", "Authorization"],
// // };

// // app.use(cors(corsOptions));

// // // Additional CORS headers for all responses
// // app.use((req, res, next) => {
// //   const origin = corsOptions.origin;
// //   res.header("Access-Control-Allow-Origin", origin);
// //   res.header(
// //     "Access-Control-Allow-Methods",
// //     "GET, POST, PUT, DELETE, PATCH, OPTIONS",
// //   );
// //   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
// //   res.header("Access-Control-Allow-Credentials", "true");

// //   // Handle preflight requests
// //   if (req.method === "OPTIONS") {
// //     return res.sendStatus(200);
// //   }

// //   next();
// // });

// // // Body parser middleware
// // app.use(express.json({ limit: "10mb" }));
// // app.use(express.urlencoded({ limit: "10mb", extended: true }));

// // // Static files for uploads (CORS headers handled by global middleware above)
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // // Rate limiting on all API routes
// // app.use("/api/", apiLimiter);

// // // Database connection check middleware on all API routes
// // app.use("/api/", checkDatabaseConnection);

// // /**
// //  * ============================================
// //  * ROUTES SETUP
// //  * ============================================
// //  */

// // // Health check endpoint
// // app.get("/health", (req, res) => {
// //   const mongoose = require("mongoose");
// //   const dbStatus = {
// //     0: "disconnected",
// //     1: "connected",
// //     2: "connecting",
// //     3: "disconnecting",
// //   };

// //   const connectionStatus = mongoose.connection.readyState;
// //   const isHealthy = connectionStatus === 1;

// //   res.status(isHealthy ? 200 : 503).json({
// //     success: isHealthy,
// //     message: isHealthy ? "Server is running" : "Server is degraded",
// //     timestamp: new Date(),
// //     database: {
// //       status: dbStatus[connectionStatus],
// //       connected: isHealthy,
// //     },
// //   });
// // });

// // // Browser fallback for password reset link
// // app.get("/reset-password", (req, res) => {
// //   const { token } = req.query;

// //   console.log("🔑 Reset page requested");
// //   console.log("📝 Token received:", token);
// //   console.log("📝 Token length:", token?.length);

// //   if (!token) {
// //     console.log("❌ No token provided");
// //     return res.status(400).send("Password reset token is required.");
// //   }

// //   const appUrl = `gbn://reset-password?token=${encodeURIComponent(token)}`;
// //   const baseUrl = process.env.API_BASE_URL || "http://localhost:5001";
// //   const fallbackUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

// //   console.log("✅ App URL:", appUrl);
// //   console.log("✅ Fallback URL:", fallbackUrl);

// //   res.send(`
// //     <!DOCTYPE html>
// //     <html lang="en">
// //       <head>
// //         <meta charset="UTF-8" />
// //         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
// //         <title>Password Reset</title>
// //         <style>
// //           body { font-family: Arial, sans-serif; padding: 40px; background: #f7f9fc; color: #333; }
// //           .card { max-width: 600px; margin: 0 auto; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
// //           a.button { display: inline-block; margin: 20px 0; padding: 14px 24px; background: #0B3D2E; color: white; text-decoration: none; border-radius: 8px; }
// //           code { display: block; padding: 15px; background: #f1f3f5; border-radius: 8px; word-break: break-all; }
// //         </style>
// //       </head>
// //       <body>
// //         <div class="card">
// //           <h1>Opening Password Reset...</h1>
// //           <p>If the app does not open automatically, click the button below:</p>
// //           <a class="button" href="${appUrl}">Open App</a>
// //           <p style="margin-top: 30px; color: #999; font-size: 12px;">If you don't have the app installed, use this link instead:</p>
// //           <code>${fallbackUrl}</code>
// //         </div>
// //         <script>
// //           // Try to open app immediately
// //           window.location.href = '${appUrl}';

// //           // If app doesn't open in 1.5 seconds, show fallback message
// //           setTimeout(function() {
// //             document.querySelector('.card h1').innerText = 'App did not open. Try clicking the button above.';
// //           }, 1500);
// //         </script>
// //       </body>
// //     </html>
// //   `);
// // });

// // // API v1 routes
// // app.use("/api/auth", authRoutes);
// // app.use("/api/member", memberRoutes);
// // app.use("/api/admin", adminRoutes);

// // /**
// //  * ============================================
// //  * ERROR HANDLING
// //  * ============================================
// //  */

// // // 404 Not Found handler
// // app.use(notFoundMiddleware);

// // // Global error handler (must be last)
// // app.use(errorMiddleware);

// // module.exports = app;

// /**
//  * Express Application Setup
//  * Configures middleware, routes, and error handling
//  */

// require("dotenv").config();

// const express = require("express");
// const helmet = require("helmet");
// const cors = require("cors");
// const path = require("path");

// // Import middleware
// const { apiLimiter } = require("./middleware/rateLimiter");
// const {
//   errorMiddleware,
//   notFoundMiddleware,
// } = require("./middleware/errorMiddleware");

// // 🔥 NEW: Website Routes
// const websiteRoutes = require("./routes/websiteRoutes");

// app.get("/site/:slug", async (req, res) => {
//   try {
//     const slug = req.params.slug;

//     console.log("🌐 Requested slug:", slug);

//     const website = await Website.findOne({ slug });

//     if (!website) {
//       return res.status(404).send("Website not found");
//     }

//     // 🔥 Send HTML directly
//     res.send(website.html);

//   } catch (err) {
//     console.log("❌ Error:", err);
//     res.status(500).send("Server Error");
//   }
// });

// // Database connection check middleware
// const checkDatabaseConnection = (req, res, next) => {
//   const mongoose = require("mongoose");
//   if (mongoose.connection.readyState !== 1) {
//     return res.status(503).json({
//       success: false,
//       message: "Database connection unavailable. Please try again later.",
//       error: "SERVICE_UNAVAILABLE",
//     });
//   }
//   next();
// };

// // Import routes
// const authRoutes = require("./routes/authRoutes");
// const memberRoutes = require("./routes/memberRoutes");
// const adminRoutes = require("./routes/adminRoutes");

// // Initialize Express app
// const app = express();

// /**
//  * ============================================
//  * MIDDLEWARE SETUP
//  * ============================================
//  */

// // Security middleware
// app.use(helmet());

// // CORS configuration
// const corsOptions = {
//   origin: "*", // 🔥 allow mobile app
//   credentials: true,
//   optionsSuccessStatus: 200,
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));

// // Additional CORS headers
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE, PATCH, OPTIONS"
//   );
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }

//   next();
// });

// // Body parser
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ limit: "10mb", extended: true }));

// // Static uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Rate limiting
// app.use("/api/", apiLimiter);

// // DB connection check
// app.use("/api/", checkDatabaseConnection);

// /**
//  * ============================================
//  * ROUTES SETUP
//  * ============================================
//  */

// // Health check
// app.get("/health", (req, res) => {
//   const mongoose = require("mongoose");

//   const dbStatus = {
//     0: "disconnected",
//     1: "connected",
//     2: "connecting",
//     3: "disconnecting",
//   };

//   const status = mongoose.connection.readyState;

//   res.status(status === 1 ? 200 : 503).json({
//     success: status === 1,
//     message: status === 1 ? "Server is running" : "Server is degraded",
//     database: {
//       status: dbStatus[status],
//       connected: status === 1,
//     },
//   });
// });

// // Existing routes
// app.use("/api/auth", authRoutes);
// app.use("/api/member", memberRoutes);
// app.use("/api/admin", adminRoutes);

// // 🔥 NEW WEBSITE ROUTES
// app.use("/api/website", websiteRoutes);

// /**
//  * ============================================
//  * ERROR HANDLING
//  * ============================================
//  */

// // 404
// app.use(notFoundMiddleware);

// // Global error
// app.use(errorMiddleware);

// module.exports = app;

/**
 * Express Application Setup
 */

require("dotenv").config();

const express = require("express");
const fs = require("fs");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const app = express(); // ✅ VERY IMPORTANT (FIRST)

const uploadsDir = path.join(__dirname, "uploads");
const uploadsImagesDir = path.join(uploadsDir, "images");
const uploadsVideosDir = path.join(uploadsDir, "videos");
const uploadsLogosDir = path.join(uploadsDir, "logos");
const uploadsProfilesDir = path.join(uploadsDir, "profiles");
const uploadsCoversDir = path.join(uploadsDir, "covers");
const uploadsInvoicesDir = path.join(uploadsDir, "invoices");

fs.mkdirSync(uploadsImagesDir, { recursive: true });
fs.mkdirSync(uploadsVideosDir, { recursive: true });
fs.mkdirSync(uploadsLogosDir, { recursive: true });
fs.mkdirSync(uploadsProfilesDir, { recursive: true });
fs.mkdirSync(uploadsCoversDir, { recursive: true });
fs.mkdirSync(uploadsInvoicesDir, { recursive: true });

// ================= IMPORT MODELS =================
const Website = require("./models/Website");

// ================= IMPORT UTILITIES =================
const generateWebsiteHtml = require("./utils/generateWebsite");

// ================= IMPORT MIDDLEWARE =================
const {
  errorMiddleware,
  notFoundMiddleware,
} = require("./middleware/errorMiddleware");

// ================= IMPORT ROUTES =================
const authRoutes = require("./routes/authRoutes");
const memberRoutes = require("./routes/memberRoutes");
const adminRoutes = require("./routes/adminRoutes");
const websiteRoutes = require("./routes/websiteRoutes");
const chapterRoutes = require("./routes/chapterRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// ================= DATABASE CHECK =================
const checkDatabaseConnection = (req, res, next) => {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable",
    });
  }
  next();
};

// ================= MIDDLEWARE =================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= STATIC FILES WITH CORS =================
// Serve uploads with proper CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "public, max-age=31536000");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

app.use("/api/", checkDatabaseConnection);

// ================= 🔥 PUBLIC WEBSITE ROUTE =================
// 👉 THIS IS YOUR MAIN FEATURE
app.get("/site/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    console.log("🌐 Opening website for:", slug);

    const website = await Website.findOne({ slug });

    if (!website) {
      return res.status(404).send("❌ Website not found");
    }

    // ✅ Set proper headers for HTML response
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // 🔥 ALWAYS REGENERATE HTML WITH CORRECT PROTOCOL
    const apiBaseUrl = `${req.protocol}://${req.get("host")}`;
    const freshHtml = generateWebsiteHtml(website, apiBaseUrl);

    // 🔥 SEND HTML DIRECTLY
    res.send(freshHtml);
  } catch (err) {
    console.log("❌ ERROR:", err);
    res.status(500).send("Server Error");
  }
});

// ================= HEALTH =================
app.get("/health", (req, res) => {
  res.json({ message: "Server running ✅" });
});

// ================= API ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/website", websiteRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);

// ================= ERRORS =================
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
