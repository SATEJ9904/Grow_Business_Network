/**
 * Member Validation Schemas
 * Validates request data for member endpoints
 */

const Joi = require('joi');

/**
 * Schema for updating member profile
 */
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
    }),
  mobile: Joi.string()
    .pattern(/^\d{10}$/)
    .messages({
      'string.pattern.base': 'Mobile must be 10 digits',
    }),
  companyName: Joi.string()
    .messages({
      'any.required': 'Company name is invalid',
    }),
  services: Joi.array()
    .items(Joi.string())
    .messages({
      'array.base': 'Services must be an array',
    }),
  description: Joi.string()
    .max(500)
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
});

/**
 * Schema for pagination
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .positive()
    .default(1)
    .messages({
      'number.positive': 'Page must be a positive number',
    }),
  limit: Joi.number()
    .positive()
    .max(100)
    .default(10)
    .messages({
      'number.positive': 'Limit must be a positive number',
      'number.max': 'Limit cannot exceed 100',
    }),
});

/**
 * Schema for getting member by ID
 */
const getMemberByIdSchema = Joi.object({
  memberId: Joi.string()
    .required()
    .messages({
      'any.required': 'Member ID is required',
    }),
});

module.exports = {
  updateProfileSchema,
  paginationSchema,
  getMemberByIdSchema,
};
