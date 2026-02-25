const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
  create: Joi.object({
    schoolId: Joi.objectId().required().messages({
      'any.required': 'schoolId is required'
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Student name must be at least 2 characters'
    }),
    age: Joi.number().integer().min(5).max(25).optional().messages({
      'number.min': 'Age must be at least 5',
      'number.max': 'Age must be realistic (max 25 for school context)'
    }),
    enrollmentDate: Joi.date().iso().optional(),
    profile: Joi.object({
      photo: Joi.string().uri({ scheme: ['http', 'https'] }).optional().messages({
        'string.uri': 'Photo must be a valid URL'
      }),
      bio: Joi.string().max(500).optional()
    }).optional(),
    classroomId: Joi.objectId().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    age: Joi.number().integer().min(5).max(25).optional(),
    enrollmentDate: Joi.date().iso().optional(),
    profile: Joi.object({
      photo: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
      bio: Joi.string().max(500).optional()
    }).optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  enroll: Joi.object({
    classroomId: Joi.objectId().required().messages({
      'any.required': 'classroomId is required for enrollment/transfer'
    })
  })
};