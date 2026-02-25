const jwt = require('jsonwebtoken');
const config = require('config');
const { ApiError } = require('../libs/errors');
const { get } = require('../cache/redisCache');
const redisClient = global.redisClient;


function auth(roles = []) {
  return (req, res, next) => {  // Remove async here – wrap inside
    (async () => {
      try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new ApiError(401, 'No token');

        const blacklisted = await get(redisClient, `blacklist:${token}`);
        if (blacklisted) throw new ApiError(401, 'Token revoked');

        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded;
        req.token = token;

        if (roles.length && !roles.includes(decoded.role)) {
          throw new ApiError(403, 'Forbidden');
        }

        next();
      } catch (err) {
        next(err); 
      }
    })();
  };
}

module.exports = auth;

module.exports = auth;