const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
  register: Joi.object({
    username: Joi.string().min(3).max(50).required().messages({ 'string.min': 'Username must be at least 3 characters' }),
    password: Joi.string().min(8).max(100).required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .messages({ 'string.pattern.base': 'Password must include uppercase, lowercase, number, and special char' }),
    role: Joi.string().valid('superadmin', 'schooladmin').required(),
    schoolId: Joi.objectId().when('role', { is: 'schooladmin', then: Joi.required(), otherwise: Joi.forbidden() })
  }),
  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }),
  refresh: Joi.object({
    refreshToken: Joi.string().required()
  })
};