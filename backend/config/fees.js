/**
 * Registration Fee Breakdown
 * Single server-side source of truth for the membership registration fee.
 * Mirrors the breakdown shown to the member at checkout in the mobile app
 * (gbn-22-6-2026/Components/Screens/RegisterScreen.js) so the invoice line
 * items match exactly what they agreed to pay. Amounts are computed here,
 * never trusted from the client, since this is what actually gets charged.
 */

const GST_RATE = 0.18;
const RAZORPAY_COMMISSION_RATE = 0.02;
const RAZORPAY_COMMISSION_GST_RATE = 0.18;

/**
 * @returns {Object} Fee breakdown in rupees (and total in paise for Razorpay)
 */
const getFeeBreakdown = () => {
  const baseAmountPaise = parseInt(process.env.REGISTRATION_FEE_PAISE, 10) || 95900;
  const baseAmount = baseAmountPaise / 100;

  const gstAmount = Math.round(baseAmount * GST_RATE * 100) / 100;
  const commission = Math.round(baseAmount * RAZORPAY_COMMISSION_RATE * 100) / 100;
  const commissionGst = Math.round(commission * RAZORPAY_COMMISSION_GST_RATE * 100) / 100;

  const totalAmount = Math.round((baseAmount + gstAmount + commission + commissionGst) * 100) / 100;
  const totalPaise = Math.round(totalAmount * 100);

  return {
    baseAmount,
    gstRate: GST_RATE,
    gstAmount,
    commissionRate: RAZORPAY_COMMISSION_RATE,
    commission,
    commissionGstRate: RAZORPAY_COMMISSION_GST_RATE,
    commissionGst,
    totalAmount,
    totalPaise,
    currency: "INR",
  };
};

module.exports = { getFeeBreakdown };
