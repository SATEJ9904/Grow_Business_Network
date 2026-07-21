/**
 * Email Configuration Module
 * Configures NodeMailer with SMTP settings for sending emails
 */

const nodemailer = require("nodemailer");

/**
 * Create Email Transporter with SMTP Configuration
 * @returns {Object} Nodemailer transporter instance
 */
const createMailerTransport = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === "465", // true for port 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  });

  return transporter;
};

/**
 * Send Email using Nodemailer
 * @param {Object} mailOptions - Email options
 * @param {string} mailOptions.to - Recipient email
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.html - HTML email body
 * @returns {Promise<Object>} Email send response
 */
const htmlToText = (html) => {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
};

const sendEmail = async (mailOptions) => {
  try {
    const transporter = createMailerTransport();
    const fromEmail = process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || "";
    const replyToEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    const options = {
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      replyTo: replyToEmail,
      text: mailOptions.text || htmlToText(mailOptions.html),
      ...mailOptions,
    };

    const info = await transporter.sendMail(options);
    console.log(`✅ Email sent to ${mailOptions.to}:`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  createMailerTransport,
  sendEmail,
};
