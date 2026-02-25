// swaggerConfig.js
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'School Management System API',
      version: '1.0.0',
      description: 'API for managing schools, classrooms, students with RBAC',
      contact: { name: 'Olawale Hameed' },
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Development' },
    ],
  },
  apis: [
    path.join(__dirname, './docs/swagger-shared.js'),
    path.join(__dirname, '../src/managers/*.js'),
    path.join(__dirname, '../src/models/*.js'), 
    path.join(__dirname, '../mws/*.js'),
  ],
};

module.exports = options;