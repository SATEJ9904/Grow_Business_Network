/**
 * Meeting Fee Breakdown
 * Server-side source of truth for what a member actually pays to book a
 * meeting seat: the admin-set fee, plus GST on that fee at the admin-set
 * rate (Meeting.gstPercent), plus Razorpay's commission, plus GST on that
 * commission.
 */

const RAZORPAY_COMMISSION_RATE = 0.02;
const RAZORPAY_COMMISSION_GST_RATE = 0.18;

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * @param {number} meetingFee - Admin-set meeting fee in rupees
 * @param {number} [gstPercent] - Admin-set GST % on the meeting fee (e.g. 5, 18)
 * @returns {Object} Fee breakdown in rupees (and total in paise for Razorpay)
 */
const getMeetingFeeBreakdown = (meetingFee, gstPercent) => {
  const baseAmount = meetingFee;
  const resolvedGstPercent = gstPercent || 0;
  const gstAmount = round2(baseAmount * (resolvedGstPercent / 100));
  const commission = round2(baseAmount * RAZORPAY_COMMISSION_RATE);
  const commissionGst = round2(commission * RAZORPAY_COMMISSION_GST_RATE);

  const totalAmount = round2(baseAmount + gstAmount + commission + commissionGst);
  const totalPaise = Math.round(totalAmount * 100);

  return {
    baseAmount,
    gstPercent: resolvedGstPercent,
    gstAmount,
    commissionRate: RAZORPAY_COMMISSION_RATE,
    commission,
    commissionGstRate: RAZORPAY_COMMISSION_GST_RATE,
    commissionGst,
    totalAmount,
    totalPaise,
    currency: 'INR',
  };
};

module.exports = { getMeetingFeeBreakdown };
