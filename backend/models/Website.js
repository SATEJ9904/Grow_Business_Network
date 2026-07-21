// // models/Website.js
// const mongoose = require("mongoose");

// const websiteSchema = new mongoose.Schema(
//   {
//     userId: { type: String, required: true },
//     company: String,
//     services: String,
//     serviceItems: {
//       type: [mongoose.Schema.Types.Mixed],
//       default: [],
//     },
//     contactItems: {
//       type: [mongoose.Schema.Types.Mixed],
//       default: [],
//     },
//     about: String,
//     contactEmail: String,
//     contactPhone: String,
//     contactAddress: String,
//     footerInfo: String,
//     theme: String,
//     layoutId: String,
//     layoutName: String,
//     html: String,
//     slug: { type: String, unique: true },
//   },
//   { timestamps: true },
// );

// module.exports = mongoose.model("Website", websiteSchema);

const mongoose = require("mongoose");

// ================= IMAGE =================

const imageSchema = new mongoose.Schema(
  {
    url: String,
    alt: String,
  },
  { _id: false },
);

// ================= SERVICE =================

const serviceSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    image: mongoose.Schema.Types.Mixed,
    icon: String,
  },
  { _id: false },
);

// ================= PRODUCT =================

const productSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: String,
    oldPrice: String,
    category: String,
    image: mongoose.Schema.Types.Mixed,
  },
  { _id: false },
);

// ================= TESTIMONIAL =================

const testimonialSchema = new mongoose.Schema(
  {
    name: String,
    role: String,
    review: String,
    image: String,
  },
  { _id: false },
);

// ================= FAQ =================

const faqSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
  },
  { _id: false },
);

// ================= CONTACT =================

const contactSchema = new mongoose.Schema(
  {
    email: String,
    phone: String,
    address: String,
  },
  { _id: false },
);

// ================= VIDEO =================

const videoSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    videoUrl: String,
    thumbnail: mongoose.Schema.Types.Mixed,
    platform: String,
  },
  { _id: false },
);

// ================= WEBSITE =================

const websiteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    company: String,

    logo: mongoose.Schema.Types.Mixed,

    websiteMode: {
      type: String,
      enum: ["service", "product", "both"],
      default: "service",
    },

    theme: String,

    layoutId: String,

    layoutName: String,

    slug: {
      type: String,
      unique: true,
    },

    html: String,

    // ================= HERO =================

    heroTitle: String,

    heroHighlight: String,

    heroSubtitle: String,

    heroDescription: String,

    heroVideo: String,

    // ================= ABOUT =================

    about: String,

    // ================= BUSINESS PROFILE =================

    businessCategory: {
      type: String,
      default: "",
    },

    collaborationType: {
      type: String,
      default: "",
    },

    expertise: {
      type: String,
      default: "",
    },

    growthOpportunities: {
      type: String,
      default: "",
    },

    tagline: {
      type: String,
      default: "",
    },

    uniqueBusiness: {
      type: String,
      default: "",
    },

    // ================= COLORS =================

    primaryColor: {
      type: String,
      default: "#7c5cff",
    },

    secondaryColor: {
      type: String,
      default: "#06b6d4",
    },

    // ================= SERVICES =================

    serviceItems: {
      type: [serviceSchema],
      default: [],
    },

    // ================= PRODUCTS =================

    productItems: {
      type: [productSchema],
      default: [],
    },

    // ================= VIDEOS =================

    videoItems: {
      type: [videoSchema],
      default: [],
    },

    // ================= GALLERY =================

    galleryItems: {
      type: [imageSchema],
      default: [],
    },

    // ================= TESTIMONIALS =================

    testimonialItems: {
      type: [testimonialSchema],
      default: [],
    },

    // ================= FAQ =================

    faqItems: {
      type: [faqSchema],
      default: [],
    },

    // ================= CONTACT =================

    contactItems: {
      type: [contactSchema],
      default: [],
    },

    footerInfo: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Website", websiteSchema);
