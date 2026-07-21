/**
 * OTP Service
 * Handles OTP generation, storage, and verification logic
 */

const OTP = require('../models/OTP');
const { sendOTPEmail } = require('./emailService');

/**
 * Generate random 5-digit OTP
 * @returns {string} 5-digit OTP
 */
const generateOTP = () => {
  return String(Math.floor(Math.random() * 90000) + 10000);
};

/**
 * Generate a fresh OTP record for an email, replacing any existing one.
 * Does not send an email - callers decide what template to send.
 * @param {string} email - User email
 * @returns {Promise<{otp: string, expiryTime: Date}>}
 */
const createOTPRecord = async (email) => {
  const email_lower = email.toLowerCase();

  // Delete any existing OTPs for this email
  await OTP.deleteMany({ email: email_lower });

  // Generate new OTP
  const otp = generateOTP();

  // Calculate expiry time (5 minutes from now)
  const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

  // Save OTP to database
  const otpRecord = new OTP({
    email: email_lower,
    otp,
    expiry: expiryTime,
    attempts: 0,
  });

  await otpRecord.save();

  return { otp, expiryTime };
};

/**
 * Generate and send OTP to email
 * @param {string} email - User email
 * @returns {Promise<Object>} OTP generation response
 */
const generateAndSendOTP = async (email) => {
  try {
    const email_lower = email.toLowerCase();
    const { otp, expiryTime } = await createOTPRecord(email_lower);

    // Send OTP via email
    await sendOTPEmail(email_lower, otp);

    return {
      success: true,
      message: 'OTP sent successfully to your email',
      expiryTime,
    };
  } catch (error) {
    throw new Error(`OTP generation failed: ${error.message}`);
  }
};

/**
 * Verify OTP provided by user
 * @param {string} email - User email
 * @param {string} providedOTP - OTP provided by user
 * @returns {Promise<Object>} OTP verification response
 */
const verifyOTP = async (email, providedOTP) => {
  try {
    const email_lower = email.toLowerCase();

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: email_lower,
      isUsed: false,
    });

    if (!otpRecord) {
      throw new Error('No OTP found for this email. Please request a new OTP.');
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new Error('OTP has expired. Please request a new OTP.');
    }

    // Check if max attempts reached
    if (otpRecord.isMaxAttemptsReached()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.');
    }

    // Check if OTP matches
    if (otpRecord.otp !== providedOTP.trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = 3 - otpRecord.attempts;
      throw new Error(
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
          : 'Maximum attempts exceeded. Please request a new OTP.'
      );
    }

    // Mark OTP as used and delete
    await OTP.deleteOne({ _id: otpRecord._id });

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    throw new Error(`OTP verification failed: ${error.message}`);
  }
};

/**
 * Clean up expired OTPs (can be called by cron job)
 * @returns {Promise<Object>} Cleanup result
 */
const cleanupExpiredOTPs = async () => {
  try {
    const result = await OTP.deleteMany({
      expiry: { $lt: new Date() },
    });

    console.log(`✅ Cleaned up ${result.deletedCount} expired OTPs`);
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error('❌ OTP cleanup error:', error.message);
    throw new Error(`OTP cleanup failed: ${error.message}`);
  }
};

module.exports = {
  generateOTP,
  createOTPRecord,
  generateAndSendOTP,
  verifyOTP,
  cleanupExpiredOTPs,
};
