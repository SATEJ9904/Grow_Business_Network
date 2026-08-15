/**
 * Email Service
 * Handles all email sending operations
 */

const { sendEmail } = require("../config/mailer");

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} otp - One-Time Password
 * @returns {Promise<Object>} Email send response
 */
const sendOTPEmail = async (email, otp) => {
  const subject = "Your Email Verification OTP";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .otp-box { background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
          .message { color: #555; line-height: 1.6; margin-bottom: 20px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Email Verification</h2>
          </div>
          <p class="message">Hello,</p>
          <p class="message">Thank you for registering with Networking Club Member Management System. Please use the following OTP to verify your email address:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="message">This OTP is valid for only 5 minutes. If you did not request this OTP, please ignore this email.</p>
          <div class="footer">
            <p>&copy; 2024 Networking Club. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  });
};

/**
 * Send Account Approval Email
 * @param {string} email - Recipient email
 * @param {string} memberName - Member name
 * @returns {Promise<Object>} Email send response
 */
const sendApprovalEmail = async (email, memberName) => {
  const subject = "Your Account Has Been Approved!";
  const appLink = "gbn://open";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .success-message { background-color: #d4edda; padding: 15px; border-radius: 5px; color: #155724; margin-bottom: 20px; }
          .message { color: #555; line-height: 1.6; margin-bottom: 20px; }
          .login-button { display: block; width: 200px; margin: 20px auto; padding: 12px; text-align: center; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Account Approved</h2>
          </div>
          <div class="success-message">
            <strong>Your account has been successfully approved!</strong>
          </div>
          <p class="message">Hello ${memberName},</p>
          <p class="message">Congratulations! Your account with Networking Club Member Management System has been reviewed and approved. You can now log in and access all member features.</p>
          <a href="${appLink}" class="login-button">Log In Now</a>
          <p class="message">If you have any questions, please feel free to contact our support team.</p>
          <div class="footer">
            <p>&copy; 2024 Networking Club. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  });
};

/**
 * Send Account Rejection Email
 * @param {string} email - Recipient email
 * @param {string} memberName - Member name
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Email send response
 */
const sendRejectionEmail = async (email, memberName, reason = "") => {
  const subject = "Application Status Update";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .warning-message { background-color: #f8d7da; padding: 15px; border-radius: 5px; color: #721c24; margin-bottom: 20px; }
          .message { color: #555; line-height: 1.6; margin-bottom: 20px; }
          .reason { background-color: #f8f9fa; padding: 10px; border-left: 4px solid #dc3545; margin: 15px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Application Status</h2>
          </div>
          <div class="warning-message">
            <strong>Your application has been reviewed.</strong>
          </div>
          <p class="message">Hello ${memberName},</p>
          <p class="message">Thank you for your interest in joining Networking Club Member Management System. After careful review, we regret to inform you that your application has not been approved at this time.</p>
          ${reason ? `<div class="reason"><strong>Reason:</strong> ${reason}</div>` : ""}
          <p class="message">If you have any questions or would like to reapply in the future, please feel free to contact our support team.</p>
          <div class="footer">
            <p>&copy; 2024 Networking Club. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  });
};

/**
 * Send Password Reset Email with reset link
 * @param {string} email - Recipient email
 * @param {string} resetToken - Reset token
 * @param {string} memberName - Member name
 * @returns {Promise<Object>} Email send response
 */
const sendPasswordResetEmail = async (email, resetToken, memberName, otp) => {
  const subject = "Password Reset Request - Networking Club";
  const resetLink = `${process.env.API_BASE_URL}/reset-password?token=${resetToken}`;

  const otpSection = otp
    ? `
          <div class="otp-box">
            <p class="message" style="margin-top:0;">If you're using the mobile app, enter this code instead:</p>
            <div class="otp-code">${otp}</div>
          </div>`
    : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .info-box { background-color: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; margin-bottom: 20px; color: #0d47a1; }
          .message { color: #555; line-height: 1.6; margin-bottom: 20px; }
          .reset-button { display: block; width: 240px; margin: 25px auto; padding: 13px; text-align: center; background-color: #0b3d2e; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .reset-button:hover { opacity: 0.92; }
          .otp-box { background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #0b3d2e; letter-spacing: 5px; }
          .warning { background-color: #fff3cd; padding: 12px; border-radius: 5px; color: #856404; margin: 20px 0; border-left: 4px solid #ffc107; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
          code { word-break: break-all; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          <div class="info-box">
            <strong>We received a password reset request for your account.</strong>
          </div>
          <p class="message">Hello ${memberName},</p>
          <p class="message">Click the button below to reset your password from a browser.</p>
          <a href="${resetLink}" class="reset-button">Reset Password</a>
          ${otpSection}
          <div class="warning">
            <strong>Security Note:</strong> The link expires in 1 hour${otp ? " and the code in 5 minutes" : ""}. If you did not request this password reset, please ignore this email or contact support immediately.
          </div>
          <p class="message"><strong>Manual Reset Link:</strong><br/>
            If the button doesn't work, copy and paste this link in your browser:<br/>
            <code>${resetLink}</code>
          </p>
          <p class="message">For security reasons, never share your password, reset link, or code with anyone else.</p>
          <div class="footer">
            <p>&copy; 2024 Networking Club. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  });
};

/**
 * Send Password Reset Confirmation Email
 * @param {string} email - Recipient email
 * @param {string} memberName - Member name
 * @returns {Promise<Object>} Email send response
 */
const sendPasswordResetConfirmationEmail = async (email, memberName) => {
  const subject = "Your Password Has Been Successfully Reset";
  const appLink = "gbn://open";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .success-message { background-color: #d4edda; padding: 15px; border-radius: 5px; color: #155724; margin-bottom: 20px; border-left: 4px solid #28a745; }
          .message { color: #555; line-height: 1.6; margin-bottom: 20px; }
          .login-button { display: block; width: 200px; margin: 25px auto; padding: 13px; text-align: center; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .login-button:hover { background-color: #218838; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Successful</h2>
          </div>
          <div class="success-message">
            <strong>Your password has been successfully reset!</strong>
          </div>
          <p class="message">Hello ${memberName},</p>
          <p class="message">Your password for Networking Club Member Management System has been successfully updated. You can now log in with your new password.</p>
          <a href="${appLink}" class="login-button">Log In Now</a>
          <p class="message">If you did not request this change or believe your account has been compromised, please contact our support team immediately.</p>
          <div class="footer">
            <p>&copy; 2024 Networking Club. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  });
};

/**
 * Send "New Member Joined" notification to an existing member
 * @param {string} email - Recipient email
 * @param {string} recipientName - Recipient member name
 * @param {Object} newMember - The member who just joined
 * @param {string} newMember.name - New member's name
 * @param {string} newMember.companyName - New member's company
 * @returns {Promise<Object>} Email send response
 */
const sendNewMemberJoinedEmail = async (email, recipientName, newMember) => {
  const subject = "A New Member Has Joined GBN!";
  const appLink = "gbn://open";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .info-box { background-color: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; margin-bottom: 20px; color: #0d47a1; }
          .message { color: #555; line-height: 1.6; margin-bottom: 20px; }
          .open-button { display: block; width: 220px; margin: 25px auto; padding: 13px; text-align: center; background-color: #0b3d2e; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Member Alert</h2>
          </div>
          <div class="info-box">
            <strong>${newMember.name}${newMember.companyName ? ` from ${newMember.companyName}` : ""} has just joined GBN!</strong>
          </div>
          <p class="message">Hello ${recipientName},</p>
          <p class="message">We're growing! A new member has joined the GBN community. Open the app to view their profile and explore networking opportunities.</p>
          <a href="${appLink}" class="open-button">Open GBN App</a>
          <div class="footer">
            <p>&copy; 2024 Networking Club. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  });
};

/**
 * Send "Member Updated Profile" notification to an existing member
 * @param {string} email - Recipient email
 * @param {string} recipientName - Recipient member name
 * @param {string} memberName - Name of the member who updated their profile
 * @returns {Promise<Object>} Email send response
 */
const sendMemberProfileUpdatedEmail = async (email, recipientName, memberName) => {
  const subject = `${memberName} Updated Their Profile on GBN`;
  const appLink = "gbn://open";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .info-box { background-color: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; margin-bottom: 20px; color: #0d47a1; }
          .message { color: #555; line-height: 1.6; margin-bottom: 20px; }
          .open-button { display: block; width: 220px; margin: 25px auto; padding: 13px; text-align: center; background-color: #0b3d2e; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Profile Update</h2>
          </div>
          <div class="info-box">
            <strong>${memberName} has updated their professional profile.</strong>
          </div>
          <p class="message">Hello ${recipientName},</p>
          <p class="message">One of your fellow GBN members just updated their profile. Open the app to check out what's new and stay connected.</p>
          <a href="${appLink}" class="open-button">Open GBN App</a>
          <div class="footer">
            <p>&copy; 2024 Networking Club. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  });
};

/**
 * Send the generated membership registration invoice as a PDF attachment
 * @param {string} email - Recipient email
 * @param {string} memberName - Member name
 * @param {Object} invoice - Invoice document (invoiceNumber, amounts, issuedAt)
 * @param {Buffer} pdfBuffer - Rendered invoice PDF
 * @returns {Promise<Object>} Email send response
 */
const sendInvoiceEmail = async (email, memberName, invoice, pdfBuffer) => {
  const subject = `Your GBN Membership Invoice - ${invoice.invoiceNumber}`;
  const issuedDate = new Date(invoice.issuedAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .success-message { background-color: #d4edda; padding: 15px; border-radius: 5px; color: #155724; margin-bottom: 20px; border-left: 4px solid #28a745; }
          .message { color: #555; line-height: 1.6; margin-bottom: 20px; }
          .summary-box { background-color: #f0f7f3; border: 1px solid #cde2d7; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #333; }
          .summary-label { color: #6b7a72; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Your Invoice is Ready</h2>
          </div>
          <div class="success-message">
            <strong>Thank you for registering with GBN - Grow Business Network!</strong>
          </div>
          <p class="message">Hello ${memberName},</p>
          <p class="message">Your payment has been received and your official invoice is attached to this email as a PDF.</p>
          <div class="summary-box">
            <div class="summary-row"><span class="summary-label">Invoice Number</span><span>${invoice.invoiceNumber}</span></div>
            <div class="summary-row"><span class="summary-label">Invoice Date</span><span>${issuedDate}</span></div>
            <div class="summary-row"><span class="summary-label">Amount Paid</span><span>₹${invoice.amounts.totalAmount.toFixed(2)}</span></div>
          </div>
          <p class="message">Please keep this invoice for your records. If you have any questions about this payment, feel free to contact our support team.</p>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GBN - Grow Business Network. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: htmlContent,
    attachments: [
      {
        filename: `Invoice-${invoice.invoiceNumber.replace(/\//g, "-")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};

/**
 * Send Meeting Seat Booking Confirmation Email
 * @param {string} email - Recipient email
 * @param {string} memberName - Member name
 * @param {Object} meeting - Meeting document
 * @param {Object} booking - MeetingBooking document
 * @returns {Promise<Object>} Email send response
 */
const sendMeetingBookingConfirmationEmail = async (email, memberName, meeting, booking) => {
  const subject = `Seat Confirmed: ${meeting.name}`;

  const meetingDateLabel = new Date(meeting.meetingDateTime).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #333; margin-bottom: 30px; }
          .success-message { background-color: #d4edda; padding: 15px; border-radius: 5px; color: #155724; margin-bottom: 20px; }
          .message { color: #555; line-height: 1.6; margin-bottom: 20px; }
          .details-box { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e0e0e0; }
          .details-row:last-child { border-bottom: none; }
          .details-label { color: #555; }
          .details-value { color: #111; font-weight: 600; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Your Seat is Booked</h2>
          </div>
          <div class="success-message">
            <strong>Payment received — your seat for "${meeting.name}" is confirmed!</strong>
          </div>
          <p class="message">Hello ${memberName},</p>
          <p class="message">Thank you for booking your seat. Here are your meeting and payment details:</p>
          <div class="details-box">
            <div class="details-row"><span class="details-label">Meeting</span><span class="details-value">${meeting.name}</span></div>
            <div class="details-row"><span class="details-label">Date &amp; Time</span><span class="details-value">${meetingDateLabel}</span></div>
            <div class="details-row"><span class="details-label">Venue</span><span class="details-value">${meeting.venue}</span></div>
            <div class="details-row"><span class="details-label">Amount Paid</span><span class="details-value">₹${booking.totalAmount}</span></div>
            <div class="details-row"><span class="details-label">Transaction ID</span><span class="details-value">${booking.razorpayPaymentId}</span></div>
          </div>
          <p class="message">We look forward to seeing you there!</p>
          <div class="footer">
            <p>&copy; 2024 Networking Club. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  });
};

module.exports = {
  sendOTPEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendNewMemberJoinedEmail,
  sendMemberProfileUpdatedEmail,
  sendInvoiceEmail,
  sendMeetingBookingConfirmationEmail,
};
