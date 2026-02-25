const express = require('express');
const { Classroom } = require('../models/classroom');
const auth = require('../mws/auth');
const validate  = require('../libs/validator');
const { ApiError } = require('../libs/errors');
const { get, set, del } = require('../cache/redisCache');
const classroomSchemas = require('../libs/validation/classroomSchemas');

const router = express.Router();

router.use(auth(['schooladmin', 'superadmin'])); // RBAC for all ops

const checkSchoolScope = (req, res, next) => {
  if (req.user.role === 'schooladmin' && req.body.schoolId && req.body.schoolId.toString() !== req.user.schoolId.toString()) {
    throw new ApiError(403, 'Forbidden: School mismatch');
  }
  next();
};

/**
 * @swagger
 * /api/v1/classrooms:
 *   post:
 *     summary: Create a new classroom
 *     description: School admin creates classroom in their assigned school
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schoolId
 *               - name
 *               - capacity
 *             properties:
 *               schoolId:
 *                 type: string
 *                 format: uuid
 *                 example: 507f1f77bcf86cd799439011
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Science Lab B
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *                 example: 35
 *               resources:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["projector", "lab equipment"]
 *     responses:
 *       201:
 *         description: Classroom created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Classroom'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/', validate(classroomSchemas.create), checkSchoolScope, async (req, res) => {
  try {
    const classroom = new Classroom(req.body);
    await classroom.save();
    await del(`classrooms:${req.body.schoolId}`);
    res.status(201).json(classroom);
  } catch (err) {
    throw new ApiError(500, err.message || 'Create failed');
  }
});

/**
 * @swagger
 * /api/v1/classrooms:
 *   get:
 *     summary: List classrooms
 *     description: List classrooms (scoped to school for school admins)
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: schoolId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Required for superadmin; auto-set for schooladmin
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated classrooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classrooms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Classroom'
 *                 total:
 *                   type: integer
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    let { schoolId, page = 1, limit = 10, sort = 'name:asc' } = req.query;
    if (req.user.role === 'schooladmin') {
      schoolId = req.user.schoolId; // Force scope
    }
    if (!schoolId) throw new ApiError(400, 'schoolId required');
    const cacheKey = `classrooms:${schoolId}:${page}:${limit}:${sort}`;
    let result = await get(cacheKey);
    if (!result) {
      const [field, order] = sort.split(':');
      const classrooms = await Classroom.find({ schoolId })
        .sort({ [field]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();
      const total = await Classroom.countDocuments({ schoolId });
      result = { classrooms, total, page: Number(page), limit: Number(limit) };
      await set(cacheKey, result, 300);
    }
    res.json(result);
  } catch (err) {
    throw new ApiError(500, err.message || 'List failed');
  }
});

/**
 * @swagger
 * /api/v1/classrooms/{id}:
 *   get:
 *     summary: Get classroom by ID
 *     description: Retrieve single classroom (scoped check)
 *     tags: [Classrooms]
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
 *         description: Classroom details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Classroom'
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
    const classroom = await Classroom.findById(req.params.id).lean();
    if (!classroom) throw new ApiError(404, 'Classroom not found');
    if (req.user.role === 'schooladmin' && classroom.schoolId.toString() !== req.user.schoolId.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
    res.json(classroom);
  } catch (err) {
    throw new ApiError(500, err.message || 'Get failed');
  }
});

/**
 * @swagger
 * /api/v1/classrooms/{id}:
 *   put:
 *     summary: Update classroom
 *     description: Update classroom details (scoped)
 *     tags: [Classrooms]
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
 *               capacity:
 *                 type: integer
 *               resources:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated classroom
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Classroom'
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
router.put('/:id', validate(classroomSchemas.update), async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) throw new ApiError(404, 'Classroom not found');
    if (req.user.role === 'schooladmin' && classroom.schoolId.toString() !== req.user.schoolId.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
    Object.assign(classroom, req.body);
    await classroom.save();
    await del(`classrooms:${classroom.schoolId}`);
    res.json(classroom);
  } catch (err) {
    throw new ApiError(500, err.message || 'Update failed');
  }
});

/**
 * @swagger
 * /api/v1/classrooms/{id}:
 *   delete:
 *     summary: Delete classroom
 *     description: Delete classroom if no students enrolled
 *     tags: [Classrooms]
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
 *         description: Classroom deleted
 *       400:
 *         description: Classroom has enrolled students
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
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) throw new ApiError(404, 'Classroom not found');
    if (req.user.role === 'schooladmin' && classroom.schoolId.toString() !== req.user.schoolId.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
    const hasStudents = await Student.countDocuments({ classroomId: req.params.id });
    if (hasStudents) throw new ApiError(400, 'Cannot delete classroom with enrolled students');
    await Classroom.findByIdAndDelete(req.params.id);
    await del(`classrooms:${classroom.schoolId}`);
    res.status(204).send();
  } catch (err) {
    throw new ApiError(500, err.message || 'Delete failed');
  }
});

module.exports = { router };