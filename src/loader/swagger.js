const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('../../config/swagger'); // or path to your config file
const { logger } = require('../libs/logger');

async function loadSwagger(app) {
  logger.info('starting swagger loader')
  try {
    const specs = swaggerJsdoc(swaggerConfig);

    // ─────────────── Add these lines ───────────────
    console.log('Swagger specs generated. Type:', typeof specs);
    console.log('Swagger specs keys:', Object.keys(specs || {}));
    console.log('Swagger paths count:', Object.keys(specs?.paths || {}).length);
    console.log('First path (if any):', Object.keys(specs?.paths || {})[0]);
    // ───────────────────────────────────────────────
    // app.use('/docs', (req, res) => {
    //   res.send('Swagger mount test - this should appear');
    // });
    app.use('/docs', (req, res, next) => {
      logger.info('Swagger route hit: ' + req.path);
      next();
    }, swaggerUi.serve, swaggerUi.setup(specs
      , {
        explorer: true,
        swaggerOptions: { persistAuthorization: true },
      }
    ));

    // app.get('/api-docs.json', (req, res) => {
    //   res.setHeader('Content-Type', 'application/json');
    //   res.send(specs);
    // });

    // const yaml = require('js-yaml');
    // app.get('/api-docs.yaml', (req, res) => {
    //   res.setHeader('Content-Type', 'text/yaml');
    //   res.send(yaml.dump(specs));
    // });

    logger.info('Swagger UI & auto-generated OpenAPI spec loaded at /docs');
  } catch (err) {
    logger.error('Swagger loader failed:', err);
    throw err;
  }
}

module.exports = loadSwagger;