const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('config');
const { errorHandler} = require('./libs/errors')
const { logger } = require('./libs/logger');
const app = express();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('./config/swagger');

app.use(helmet());
app.use(cors({
  origin: config.get('cors.origin') || '*'
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
const specs = swaggerJsdoc(swaggerConfig);
app.use('/docs', (req, res, next) => {
  logger.info('Swagger route hit: ' + req.path);
  next();
}, swaggerUi.serve, swaggerUi.setup(specs
  // , {
  //   explorer: true,
  //   swaggerOptions: { persistAuthorization: true },
  // }
));

app.use(require('./mws/rateLimit'));
app.get('/api/v1/health', (req, res) => res.send('OK'));

app.use('/api/v1/auth', require('./managers/authManager').router);
app.use('/api/v1/schools', require('./managers/schoolManager').router);
app.use('/api/v1/classrooms', require('./managers/classroomManager').router);
app.use('/api/v1/students', require('./managers/studentManager').router);

app.use(errorHandler);
app.use((req, res, next) => {
  logger.log(`No route matched: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: {
      code: 404,
      message: `Route not found: ${req.originalUrl}`
    }
  });
});

module.exports = app;