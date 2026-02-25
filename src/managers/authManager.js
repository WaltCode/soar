const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('config');
const { User } = require('../models/user');
const validate  = require('../libs/validator');
const { ApiError } = require('../libs/errors');
const  auth  = require('../mws/auth');
const authSchemas = require('../libs/validation/authSchemas');
const { set, del } = require('../cache/redisCache');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Brute-force protection for login (5 attempts/15min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: { code: 429, message: 'Too many login attempts' } }
});

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Superadmin creates a new user (schooladmin or superadmin). School ID required for schooladmin role.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: schooladmin1
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Passw0rd!
 *               role:
 *                 type: string
 *                 enum: [superadmin, schooladmin]
 *                 example: schooladmin
 *               schoolId:
 *                 type: string
 *                 format: uuid
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId: { type: string, format: uuid }
 *                 username: { type: string }
 *                 role: { type: string }
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/register', auth(['superadmin']), validate(authSchemas.register), async (req, res) => {
  try {
    const { username, password, role, schoolId } = req.body;
    const existing = await User.findOne({ username }).lean();
    if (existing) throw new ApiError(400, 'Username taken');
    const user = new User({ username, password, role, schoolId });
    await user.save();
    res.status(201).json({ userId: user._id, username, role });
  } catch (err) {
    throw new ApiError(500, err.message || 'Registration failed');
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login and get tokens
 *     description: Authenticate user and receive access + refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: schooladmin1
 *               password:
 *                 type: string
 *                 example: Passw0rd!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     role: { type: string }
 *                     schoolId: { type: string, format: uuid }
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       429:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/login', loginLimiter, validate(authSchemas.login), async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select('+password');
    if (!user || !await user.comparePassword(password)) {
      throw new ApiError(401, 'Invalid credentials'); // Non-revealing
    }
    const token = jwt.sign({ id: user._id, role: user.role, schoolId: user.schoolId }, config.get('jwtSecret'), { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id }, config.get('jwtSecret'), { expiresIn: '7d' });
    user.refreshToken = refreshToken;
    await user.save();
    res.json({ token, refreshToken, user: { id: user._id, role: user.role, schoolId: user.schoolId } });
  } catch (err) {
    throw new ApiError(500, err.message || 'Login failed');
  }
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Use refresh token to get new access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/refresh', validate(authSchemas.refresh), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, config.get('jwtSecret'));
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) throw new ApiError(401, 'Invalid refresh token');
    const newToken = jwt.sign({ id: user._id, role: user.role, schoolId: user.schoolId }, config.get('jwtSecret'), { expiresIn: '1h' });
    res.json({ token: newToken });
  } catch (err) {
    throw new ApiError(401, 'Refresh failed');
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Blacklist current token and clear refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/logout', auth(), async (req, res) => {
  try {
    const expiry = Math.floor((jwt.decode(req.token).exp - Date.now() / 1000)); // Remaining time
    await set(`blacklist:${req.token}`, 'true', expiry);
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    throw new ApiError(500, 'Logout failed');
  }
});

module.exports = { router };