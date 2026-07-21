/**
 * Slugify Utility
 * Converts text to URL-friendly slug format
 */

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .trim();
};

module.exports = { slugify };
