const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
  create: Joi.object({
    schoolId: Joi.objectId().required().messages({
      'any.required': 'schoolId is required',
      'string.pattern.name': 'schoolId must be a valid MongoDB ObjectId'
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Classroom name must be at least 2 characters',
      'string.max': 'Classroom name cannot exceed 100 characters'
    }),
    capacity: Joi.number().integer().min(1).max(1000).required().messages({
      'number.min': 'Capacity must be at least 1',
      'number.max': 'Capacity cannot exceed 1000',
      'number.integer': 'Capacity must be an integer'
    }),
    resources: Joi.array().items(Joi.string().min(1).max(50)).unique().optional().messages({
      'array.unique': 'Resources must not contain duplicates'
    })
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    capacity: Joi.number().integer().min(1).max(1000).optional(),
    resources: Joi.array().items(Joi.string().min(1).max(50)).unique().optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};