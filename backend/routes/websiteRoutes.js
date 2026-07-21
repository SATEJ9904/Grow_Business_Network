// const express = require("express");
// const router = express.Router();
// const { slugify } = require("../utils/slugify");
// const Website = require("../models/Website");

// const parseJsonArray = (value) => {
//   if (!value) return [];
//   if (Array.isArray(value)) return value;
//   if (typeof value === "string") {
//     try {
//       const parsed = JSON.parse(value);
//       return Array.isArray(parsed) ? parsed : [parsed];
//     } catch {
//       return [value];
//     }
//   }
//   return [value];
// };

// // ================= SAVE / UPDATE =================
// router.post("/save-website", async (req, res) => {
//   try {
//     console.log("SAVE WEBSITE REQUEST BODY", {
//       userId: req.body.userId,
//       company: req.body.company,
//       theme: req.body.theme,
//       about: req.body.about,
//       footerInfo: req.body.footerInfo,
//       contactItems: req.body.contactItems,
//       contactEmail: req.body.contactEmail,
//       contactPhone: req.body.contactPhone,
//       contactAddress: req.body.contactAddress,
//     });

//     const { userId, company } = req.body;

//     if (!userId || !company) {
//       return res.status(400).json({ message: "userId & company required" });
//     }

//     // ?? generate clean slug
//     const slug = slugify(company);

//     let website = await Website.findOne({ userId });

//     const layoutId = req.body.layoutId || req.body.id || req.body.style || null;
//     const layoutName = req.body.layoutName || req.body.style || null;
//     const websiteData = {
//       ...req.body,
//       serviceItems: parseJsonArray(req.body.serviceItems),
//       contactItems: parseJsonArray(req.body.contactItems),
//       layoutId,
//       layoutName,
//     };

//     if (website) {
//       console.log("SAVE WEBSITE UPDATE existing website", website._id);
//       const conflictingSlug = await Website.findOne({
//         slug,
//         userId: { $ne: userId },
//       });
//       const finalSlug = conflictingSlug
//         ? `${slug}-${userId || Date.now()}`
//         : slug;

//       website = await Website.findOneAndUpdate(
//         { userId },
//         { ...websiteData, slug: finalSlug },
//         { new: true },
//       );

//       return res.json({ message: "Updated", website });
//     }

//     const existingSlug = await Website.findOne({ slug });
//     const uniqueSlug = existingSlug ? `${slug}-${userId || Date.now()}` : slug;

//     const newWebsite = await Website.create({
//       ...websiteData,
//       slug: uniqueSlug,
//     });

//     res.json({ message: "Created", website: newWebsite });
//   } catch (err) {
//     console.log("? SAVE ERROR:", err);
//     res.status(500).json({ message: err.message, error: err.message });
//   }
// });

// // ================= GET BY USER ID =================
// router.get("/website/:userId", async (req, res) => {
//   try {
//     const website = await Website.findOne({ userId: req.params.userId });
//     res.json({ website });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================= GET BY SLUG (API) =================
// router.get("/site/:slug", async (req, res) => {
//   try {
//     const website = await Website.findOne({ slug: req.params.slug });

//     if (!website) {
//       return res.status(404).json({ error: "Website not found" });
//     }

//     res.json({ website }); // API response
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================= GET ALL =================
// router.get("/all-websites", async (req, res) => {
//   try {
//     const websites = await Website.find();
//     res.json({ websites });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================= DELETE =================
// router.delete("/website/:userId", async (req, res) => {
//   try {
//     await Website.deleteOne({ userId: req.params.userId });
//     res.json({ message: "Deleted" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const router = express.Router();

const Website = require("../models/Website");

const User = require("../models/User");

const { slugify } = require("../utils/slugify");

const generateWebsiteHtml = require("../utils/generateWebsite");

const uploadsDirectory = path.join(__dirname, "..", "uploads");
const imageUploadDir = path.join(uploadsDirectory, "images");
const videoUploadDir = path.join(uploadsDirectory, "videos");

fs.mkdirSync(imageUploadDir, { recursive: true });
fs.mkdirSync(videoUploadDir, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: imageUploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const videoStorage = multer.diskStorage({
  destination: videoUploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  cb(null, acceptedTypes.includes(file.mimetype));
};

const videoFileFilter = (req, file, cb) => {
  const acceptedTypes = [
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
    "video/mov",
  ];
  cb(null, acceptedTypes.includes(file.mimetype));
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const isHttpUrl = (url) => typeof url === "string" && /^https?:\/\//i.test(url);
const isUploadPath = (url) =>
  typeof url === "string" && /\/uploads\//.test(url);

const normalizeMediaUrl = (value, apiBaseUrl) => {
  if (!value) return "";

  let uri = "";

  if (typeof value === "object") {
    uri = value.uri || value.url || "";
  } else if (typeof value === "string") {
    uri = value;
  }

  if (!uri) {
    return "";
  }

  if (/^(file|content):\/\//i.test(uri)) {
    return "";
  }

  if (isHttpUrl(uri)) {
    return uri;
  }

  if (isUploadPath(uri)) {
    const cleaned = uri.replace(/^\/+/, "");
    return `${apiBaseUrl}/${cleaned}`;
  }

  return "";
};

// ================= HELPERS =================

const parseJsonArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }

  return [value];
};

router.post("/upload-image", uploadImage.single("file"), (req, res) => {
  console.log("IMAGE FILE:", req.file);
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image uploaded." });
  }

  const apiBaseUrl =
    process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const publicUrl = `${apiBaseUrl}/uploads/images/${req.file.filename}`;

  console.log("IMAGE URL:", publicUrl);

  return res.json({
    success: true,
    url: publicUrl,
    filename: req.file.filename,
  });
});

router.post("/upload-video", uploadVideo.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No video uploaded." });
  }

  const apiBaseUrl =
    process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const publicUrl = `${apiBaseUrl}/uploads/videos/${req.file.filename}`;

  return res.json({
    success: true,
    url: publicUrl,
    filename: req.file.filename,
  });
});

// ================= SAVE WEBSITE =================

router.post(
  "/save-website",

  async (req, res) => {
    try {
      const { userId, company } = req.body;

      // ================= VALIDATION =================

      if (!userId || !company) {
        return res.status(400).json({
          message: "userId & company required",
        });
      }

      // ================= SLUG =================

      let slug = slugify(company);

      const existingSlug = await Website.findOne({
        slug,

        userId: {
          $ne: userId,
        },
      });

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      // ================= EXISTING WEBSITE =================

      let website = await Website.findOne({
        userId,
      });

      // ================= FETCH USER PROFILE =================
      // Get user data to auto-populate missing website fields
      const user = await User.findById(userId);

      // ================= API BASE URL =================
      const apiBaseUrl =
        process.env.API_BASE_URL || `http://${req.get("host")}`;

      // ================= WEBSITE DATA =================
      console.log("HERO VIDEO RECEIVED:", req.body.heroVideo);
      console.log("VIDEO ITEMS RECEIVED:", req.body.videoItems);
      const websiteData = {
        // ================= BASIC =================

        userId,

        company:
          req.body.company && req.body.company.trim()
            ? req.body.company
            : user?.companyName || "",

        websiteMode: req.body.websiteMode || "service",

        theme: req.body.theme || "Modern",

        layoutId: req.body.layoutId || "modern-layout",

        layoutName: req.body.layoutName || "Modern Layout",

        slug,

        // ================= HERO =================

        heroTitle:
          req.body.heroTitle && req.body.heroTitle.trim()
            ? req.body.heroTitle
            : user?.uniqueBusiness || "",

        heroHighlight:
          req.body.heroHighlight && req.body.heroHighlight.trim()
            ? req.body.heroHighlight
            : user?.tagline || "",

        heroSubtitle:
          req.body.heroSubtitle && req.body.heroSubtitle.trim()
            ? req.body.heroSubtitle
            : user?.businessCategory || "",

        heroDescription:
          req.body.heroDescription && req.body.heroDescription.trim()
            ? req.body.heroDescription
            : user?.expertise || "",

        // ================= ABOUT =================

        about:
          req.body.about && req.body.about.trim()
            ? req.body.about
            : user?.aboutBusiness || "",

        logo: normalizeMediaUrl(
          req.body.logo || user?.companyLogo || "",
          apiBaseUrl,
        ),

        heroVideo: normalizeMediaUrl(req.body.heroVideo || "", apiBaseUrl),

        videoItems: parseJsonArray(req.body.videoItems)
          .map((item) => {
            console.log("?? PROCESSING VIDEO ITEM:", {
              title: item.title,
              hasVideoUrl: !!item.videoUrl,
              videoUrl: item.videoUrl,
              hasVideoObject: !!item.video,
              videoObject: item.video,
              hasThumbnail: !!item.thumbnail,
              thumbnail: item.thumbnail,
            });

            const url = normalizeMediaUrl(
              item.videoUrl ||
                (item.video && item.video.uri) ||
                item.video ||
                "",
              apiBaseUrl,
            );

            console.log("? NORMALIZED VIDEO URL:", url);

            return {
              title: item.title || "",
              description: item.description || "",
              videoUrl: url,
              thumbnail: normalizeMediaUrl(item.thumbnail || "", apiBaseUrl),
              platform: item.platform || "",
            };
          })
          .filter((item) => {
            const hasTitle = item.title;
            const hasUrl = item.videoUrl;
            console.log(
              `?? VIDEO FILTER: title=${hasTitle}, url=${hasUrl}, KEEP=${hasTitle && hasUrl}`,
            );
            return hasTitle && hasUrl;
          }),

        // ================= PROFILE FIELDS =================

        expertise:
          req.body.expertise && req.body.expertise.trim()
            ? req.body.expertise
            : user?.expertise || "",

        uniqueBusiness:
          req.body.uniqueBusiness && req.body.uniqueBusiness.trim()
            ? req.body.uniqueBusiness
            : user?.uniqueBusiness || "",

        tagline:
          req.body.tagline && req.body.tagline.trim()
            ? req.body.tagline
            : user?.tagline || "",

        industry:
          req.body.industry && req.body.industry.trim()
            ? req.body.industry
            : user?.industry || "",

        businessCategory:
          req.body.businessCategory && req.body.businessCategory.trim()
            ? req.body.businessCategory
            : user?.businessCategory || "",

        growthOpportunities:
          req.body.growthOpportunities && req.body.growthOpportunities.trim()
            ? req.body.growthOpportunities
            : user?.growthOpportunities || "",

        website:
          req.body.website && req.body.website.trim()
            ? req.body.website
            : user?.website || "",

        linkedin:
          req.body.linkedin && req.body.linkedin.trim()
            ? req.body.linkedin
            : user?.linkedin || "",

        instagram:
          req.body.instagram && req.body.instagram.trim()
            ? req.body.instagram
            : user?.instagram || "",

        city:
          req.body.city && req.body.city.trim()
            ? req.body.city
            : user?.city || "",

        // ================= COLORS =================

        primaryColor: req.body.primaryColor || "#7c5cff",

        secondaryColor: req.body.secondaryColor || "#06b6d4",

        // ================= SERVICES =================

        serviceItems: parseJsonArray(req.body.serviceItems)
          .filter((item) => item?.title)
          .map((item) => ({
            title: item.title || "",
            description: item.description || "",
            image: normalizeMediaUrl(item.image || "", apiBaseUrl),
            icon: item.icon || "",
          })),

        // ================= PRODUCTS =================

        productItems: parseJsonArray(req.body.productItems)
          .filter((item) => item?.title)
          .map((item) => ({
            title: item.title || "",
            description: item.description || "",
            image: normalizeMediaUrl(item.image || "", apiBaseUrl),
            category: item.category || "",
            price: item.price || "",
            oldPrice: item.oldPrice || "",
          })),

        // ================= TESTIMONIALS =================

        testimonialItems: parseJsonArray(req.body.testimonialItems)
          .filter((item) => item?.name)
          .map((item) => ({
            name: item.name || "",
            role: item.role || "",
            review: item.review || "",
            image: normalizeMediaUrl(item.image || "", apiBaseUrl),
          })),

        // ================= FAQ =================

        faqItems: parseJsonArray(req.body.faqItems)
          .filter((item) => item?.question)

          .map((item) => ({
            question: item.question || "",

            answer: item.answer || "",
          })),

        // ================= GALLERY =================

        galleryItems: parseJsonArray(req.body.galleryItems)
          .map((item) => ({
            url: normalizeMediaUrl(item.url || "", apiBaseUrl),
            alt: item.alt || "",
          }))
          .filter((item) => item.url),

        // ================= CONTACT =================

        contactItems: parseJsonArray(req.body.contactItems).map((item) => ({
          email:
            item.email && item.email.trim() ? item.email : user?.email || "",

          phone:
            item.phone && item.phone.trim() ? item.phone : user?.mobile || "",

          address:
            item.address && item.address.trim()
              ? item.address
              : user?.city || "",
        })),

        // ================= FOOTER =================

        footerInfo: req.body.footerInfo || "",
      };

      // ================= LOGS =================

      console.log("?? WEBSITE SAVE REQUEST", {
        company,

        userId,

        websiteMode: websiteData.websiteMode,

        services: websiteData.serviceItems.length,

        products: websiteData.productItems.length,

        testimonials: websiteData.testimonialItems.length,

        faq: websiteData.faqItems.length,
      });

      // ================= GENERATE HTML =================

      websiteData.html = generateWebsiteHtml(websiteData, apiBaseUrl);

      if (!websiteData.html || websiteData.html.trim() === "") {
        console.log("?? HTML generation returned empty, using fallback");
        websiteData.html = `<html><body style="background:#040712;color:white;display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;"><h1>${websiteData.company || "Website"}</h1><p>Website is being built...</p></body></html>`;
      }

      console.log("? HTML Generated, size:", websiteData.html.length);

      // ================= UPDATE =================

      if (website) {
        website = await Website.findOneAndUpdate(
          { userId },

          websiteData,

          {
            new: true,
          },
        );

        console.log("? WEBSITE UPDATED");

        return res.json({
          success: true,

          message: "Updated",

          website,
        });
      }

      // ================= CREATE =================

      const newWebsite = await Website.create(websiteData);
      console.log("HTML EXISTS:", !!newWebsite.html);
      console.log("HTML LENGTH:", newWebsite.html?.length);

      console.log("? WEBSITE CREATED");

      res.json({
        success: true,

        message: "Created",

        website: newWebsite,
      });
    } catch (err) {
      console.log("? WEBSITE SAVE ERROR:", err);

      res.status(500).json({
        success: false,

        error: err.message,
      });
    }
  },
);

// ================= GET WEBSITE HTML =================

router.get(
  "/site/:slug",

  async (req, res) => {
    try {
      const website = await Website.findOne({
        slug: req.params.slug,
      });

      if (!website) {
        return res.status(404).send(`

          <html>

            <body
              style="
                background:#050816;
                color:white;
                display:flex;
                justify-content:center;
                align-items:center;
                height:100vh;
                font-family:Arial;
              "
            >

              <h1>
                Website Not Found
              </h1>

            </body>

          </html>

        `);
      }

      res.send(website.html);
    } catch (err) {
      console.log("? GET WEBSITE ERROR:", err);

      res.status(500).json({
        error: err.message,
      });
    }
  },
);

// ================= GET USER WEBSITE =================

router.get(
  "/website/:userId",

  async (req, res) => {
    try {
      const website = await Website.findOne({
        userId: req.params.userId,
      });

      // Fetch user profile to provide complete data
      const user = await User.findById(req.params.userId);

      res.json({
        success: true,

        website,

        user: user
          ? {
              name: user.name,
              email: user.email,
              companyName: user.companyName,
              expertise: user.expertise,
              uniqueBusiness: user.uniqueBusiness,
              tagline: user.tagline,
              growthOpportunities: user.growthOpportunities,
              industry: user.industry,
              businessCategory: user.businessCategory,
              linkedin: user.linkedin,
              instagram: user.instagram,
              city: user.city,
              aboutBusiness: user.aboutBusiness,
              website: user.website,
              mobile: user.mobile,
              profileImage: user.profileImage,
              companyLogo: user.companyLogo,
            }
          : null,
      });
    } catch (err) {
      res.status(500).json({
        success: false,

        error: err.message,
      });
    }
  },
);

// ================= GET ALL WEBSITES =================

router.get(
  "/all-websites",

  async (req, res) => {
    try {
      const websites = await Website.find()

        .sort({
          createdAt: -1,
        });

      res.json({
        success: true,

        websites,
      });
    } catch (err) {
      res.status(500).json({
        success: false,

        error: err.message,
      });
    }
  },
);

// ================= DELETE WEBSITE =================

router.delete(
  "/website/:userId",

  async (req, res) => {
    try {
      await Website.deleteOne({
        userId: req.params.userId,
      });

      res.json({
        success: true,

        message: "Deleted",
      });
    } catch (err) {
      res.status(500).json({
        success: false,

        error: err.message,
      });
    }
  },
);

// ================= REGENERATE HTML FOR WEBSITE =================

router.post(
  "/regenerate-html/:userId",

  async (req, res) => {
    try {
      const website = await Website.findOne({
        userId: req.params.userId,
      });

      if (!website) {
        return res.status(404).json({
          success: false,

          message: "Website not found",
        });
      }

      const apiBaseUrl =
        process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`;

      website.html = generateWebsiteHtml(website, apiBaseUrl);

      await website.save();

      console.log("? WEBSITE HTML REGENERATED");

      res.json({
        success: true,

        message: "HTML regenerated successfully",

        website,
      });
    } catch (err) {
      console.log("? REGENERATE HTML ERROR:", err);

      res.status(500).json({
        success: false,

        error: err.message,
      });
    }
  },
);

module.exports = router;