/**
 * Number to Words (Indian numbering system: lakh/crore)
 * Used to render the invoice's "Amount in Words" legal-style line.
 */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

const twoDigitsToWords = (num) => {
  if (num < 20) return ONES[num];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return `${TENS[tens]}${ones ? " " + ONES[ones] : ""}`;
};

const threeDigitsToWords = (num) => {
  const hundreds = Math.floor(num / 100);
  const rest = num % 100;
  let words = "";
  if (hundreds) words += `${ONES[hundreds]} Hundred`;
  if (rest) words += `${words ? " " : ""}${twoDigitsToWords(rest)}`;
  return words;
};

const integerToWords = (num) => {
  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  const parts = [];
  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitsToWords(hundred));

  return parts.join(" ");
};

/**
 * @param {number} amount - Amount in rupees (may include paise as decimals)
 * @returns {string} e.g. "Rupees One Thousand One Hundred Fifty Four and Fifty Paise Only"
 */
const amountToWords = (amount) => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = `Rupees ${integerToWords(rupees)}`;
  if (paise) {
    words += ` and ${integerToWords(paise)} Paise`;
  }
  words += " Only";
  return words;
};

module.exports = { amountToWords };
