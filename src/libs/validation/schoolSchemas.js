const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'School name must be at least 3 characters'
    }),
    address: Joi.string().max(200).optional(),
    contactEmail: Joi.string().email({ minDomainSegments: 2 }).max(100).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).messages({
      'string.pattern.base': 'Phone must be a valid international format (e.g. +234...)'
    }).optional(),
    profile: Joi.object({
      logo: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
      description: Joi.string().max(1000).optional()
    }).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    address: Joi.string().max(200).optional(),
    contactEmail: Joi.string().email().max(100).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    profile: Joi.object({
      logo: Joi.string().uri().optional(),
      description: Joi.string().max(1000).optional()
    }).optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};