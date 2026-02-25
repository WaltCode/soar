const express = require('express');
const { School } = require('../models/school');
const { Classroom } = require('../models/classroom');
const { Student } = require('../models/student');
const auth = require('../mws/auth');
const validate  = require('../libs/validator');
const { ApiError } = require('../libs/errors');
const { get, set, del } = require('../cache/redisCache');
const schoolSchemas = require('../libs/validation/schoolSchemas');

const router = express.Router();

router.use(auth(['superadmin'])); // Superadmin only for all school ops

/**
 * @swagger
 * /api/v1/schools:
 *   post:
 *     summary: Create a new school
 *     description: Superadmin only - creates a new school entry
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: Greenfield International School
 *               address:
 *                 type: string
 *                 example: 45 Education Lane, Lagos
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 example: info@greenfield.edu.ng
 *               phone:
 *                 type: string
 *                 example: +2348012345678
 *               profile:
 *                 type: object
 *                 properties:
 *                   logo:
 *                     type: string
 *                     format: uri
 *                     example: https://school.com/logo.png
 *                   description:
 *                     type: string
 *                     example: Leading school in Lagos
 *     responses:
 *       201:
 *         description: School created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/School'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/', validate(schoolSchemas.create), async (req, res) => {
  try {
    const school = new School(req.body);
    await school.save();
    await del('schools:all');
    res.status(201).json(school);
  } catch (err) {
    throw new ApiError(500, err.message || 'Create failed');
  }
});

/**
 * @swagger
 * /api/v1/schools:
 *   get:
 *     summary: List all schools
 *     description: Superadmin only - paginated list of schools
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: Items per page (default 10)
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort order (e.g. name:asc, createdAt:desc)
 *     responses:
 *       200:
 *         description: Paginated schools list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schools:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/School'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'name:asc' } = req.query;
    const cacheKey = `schools:all:${page}:${limit}:${sort}`;
    let result = await get(cacheKey);
    if (!result) {
      const [field, order] = sort.split(':');
      const schools = await School.find()
        .sort({ [field]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();
      const total = await School.countDocuments();
      result = { schools, total, page: Number(page), limit: Number(limit) };
      await set(cacheKey, result, 300); // 5 min TTL
    }
    res.json(result);
  } catch (err) {
    throw new ApiError(500, err.message || 'List failed');
  }
});

/**
 * @swagger
 * /api/v1/schools/{id}:
 *   get:
 *     summary: Get single school
 *     description: Superadmin only - retrieve school by ID
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: School details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/School'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `school:${req.params.id}`;
    let school = await get(cacheKey);
    if (!school) {
      school = await School.findById(req.params.id).lean();
      if (!school) throw new ApiError(404, 'School not found');
      await set(cacheKey, school, 600);
    }
    res.json(school);
  } catch (err) {
    throw new ApiError(500, err.message || 'Get failed');
  }
});

/**
 * @swagger
 * /api/v1/schools/{id}:
 *   put:
 *     summary: Update school
 *     description: Superadmin only - update school details
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               address:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               profile:
 *                 type: object
 *                 properties:
 *                   logo:
 *                     type: string
 *                     format: uri
 *                   description:
 *                     type: string
 *     responses:
 *       200:
 *         description: Updated school
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/School'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.put('/:id', validate(schoolSchemas.update), async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!school) throw new ApiError(404, 'School not found');
    await del(`school:${req.params.id}`);
    await del('schools:all');
    res.json(school);
  } catch (err) {
    throw new ApiError(500, err.message || 'Update failed');
  }
});

/**
 * @swagger
 * /api/v1/schools/{id}:
 *   delete:
 *     summary: Delete school
 *     description: Superadmin only - delete school if no classrooms/students exist
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: School deleted successfully (no content)
 *       400:
 *         description: Cannot delete school with associated classrooms or students
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req, res) => {
  try {
    const schoolId = req.params.id;
    const hasClassrooms = await Classroom.countDocuments({ schoolId });
    const hasStudents = await Student.countDocuments({ schoolId });
    if (hasClassrooms || hasStudents) throw new ApiError(400, 'Cannot delete school with associated resources');
    const school = await School.findByIdAndDelete(schoolId);
    if (!school) throw new ApiError(404, 'School not found');
    await del(`school:${schoolId}`);
    await del('schools:all');
    res.status(204).send();
  } catch (err) {
    throw new ApiError(500, err.message || 'Delete failed');
  }
});

module.exports = { router };