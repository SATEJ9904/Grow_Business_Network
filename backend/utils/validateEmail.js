/**
 * Email Validation Utility
 * Validates email format and checks for disposable email providers
 */

/**
 * List of blocked disposable email providers
 * Expand this list as needed
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'throwaway.email',
  'mailinator.com',
  'trashmail.com',
  'yopmail.com',
  'fakeinbox.com',
  'spam4.me',
  'maildrop.cc',
  'tempmaildomain.com',
  'testmail.com',
];

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email format is valid
 */
const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if email is from a disposable provider
 * @param {string} email - Email to check
 * @returns {boolean} True if email is disposable
 */
const isDisposableEmail = (email) => {
  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
};

/**
 * Validate email completely
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
const validateEmail = (email) => {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    return {
      valid: false,
      message: 'Email is required',
    };
  }

  if (!isValidEmailFormat(trimmedEmail)) {
    return {
      valid: false,
      message: 'Invalid email format',
    };
  }

  if (isDisposableEmail(trimmedEmail)) {
    return {
      valid: false,
      message: 'Disposable email addresses are not allowed',
    };
  }

  return {
    valid: true,
    message: 'Email is valid',
    email: trimmedEmail,
  };
};

module.exports = {
  validateEmail,
  isValidEmailFormat,
  isDisposableEmail,
};
