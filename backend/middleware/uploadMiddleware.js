/**
 * Upload Middleware
 * Configures multer for file uploads with validation
 */

const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * Configure storage for different file types
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = "uploads/";

    // Determine upload directory based on field name
    if (file.fieldname === "companyLogo") {
      uploadDir += "logos/";
    } else if (file.fieldname === "profileImage") {
      uploadDir += "profiles/";
    } else if (file.fieldname === "coverImage") {
      uploadDir += "covers/";
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = `${Date.now()}-${uuidv4().substring(0, 8)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter to allow only specific file types
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 2097152; // 2MB default

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Only JPEG, PNG, and WEBP files are allowed");
    error.code = "INVALID_FILE_TYPE";
    return cb(error, false);
  }

  cb(null, true);
};

/**
 * Create multer middleware for file uploads
 */
const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 2097152, // 2MB
  },
});

/**
 * Middleware to handle upload errors
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Handle multer specific errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 2MB limit",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded",
      });
    }
  }

  if (error && error.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "File upload error",
    });
  }

  next();
};

module.exports = {
  uploadMiddleware,
  handleUploadError,
};
