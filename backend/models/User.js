/**
 * User Model
 * Represents a member in the Networking Club
 */

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // allows many docs without an email while still enforcing uniqueness when set
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows many docs without a username while still enforcing uniqueness when set
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-z0-9_. ]+$/, "Username can only contain letters, numbers, spaces, dots and underscores"],
    },
    mobile: {
      type: String,
      match: [/^\d{10}$/, "Mobile must be 10 digits"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    companyName: {
      type: String,
      trim: true,
    },
    companyLogo: {
      type: String, // File path
      default: null,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: [true, "Chapter is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    profileImage: {
      type: String,
      default: null,
    },

    coverImage: {
      type: String,
      default: null,
    },
    services: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpayInvoiceId: {
      type: String,
      default: null,
    },
    paymentAmount: {
      type: Number, // Amount in INR (rupees)
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    accountStatus: {
      type: Number,
      default: 1, // 1 = active, 0 = deleted
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    aboutBusiness: {
      type: String,
      maxlength: [2000, "About Business cannot exceed 2000 characters"],
      default: "",
    },
    businessStarted: {
      type: String,
      default: "",
    },

    employees: {
      type: String,
      default: "",
    },

    turnover: {
      type: String,
      default: "",
    },

    gstRegistered: {
      type: String,
      enum: ["Yes", "No", ""],
      default: "",
    },

    businessType: {
      type: String,
      default: "",
    },

    sellType: [
      {
        type: String,
      },
    ],

    tagline: {
      type: String,
      maxlength: [150, "Tagline cannot exceed 150 characters"],
      default: "",
    },

    businessCategory: {
      type: String,
      default: "",
    },

    industry: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      maxlength: [500, "Address too long"],
      default: "",
    },

    lookingFor: [
      {
        type: String,
      },
    ],

    preferredCities: {
      type: String,
      default: "",
    },

    franchisePartner: {
      type: String,
      enum: ["Yes", "No", ""],
      default: "",
    },

    products: {
      type: String,
      maxlength: [2000, "Products too long"],
      default: "",
    },

    priceRange: {
      type: String,
      default: "",
    },

    minimumOrder: {
      type: String,
      default: "",
    },

    serviceAreas: {
      type: String,
      default: "",
    },

    uniqueBusiness: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    deletionRequest: {
  requested: {
    type: Boolean,
    default: false,
  },
  reason: {
    type: String,
    default: "",
  },
  requestedAt: {
    type: Date,
    default: null,
  },
},

    professionalValues: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    businessChallenges: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    specialization: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    connectReason: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    collaborationType: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    growthOpportunities: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    longTermVision: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    achievements: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    expertise: {
      type: String,
      maxlength: [2000, "Text too long"],
      default: "",
    },

    instagram: {
      type: String,
      default: "",
    },

    linkedin: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

/**
 * Hash password before saving
 */
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Prevent password field from being returned in queries
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

/**
 * Compare provided password with hashed password
 * @param {string} providedPassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function (providedPassword) {
  return await bcrypt.compare(providedPassword, this.password);
};

/**
 * Create index for automatic deletion of expired OTPs using MongoDB TTL
 */
userSchema.index({ createdAt: 1 });

module.exports = mongoose.model("User", userSchema);
