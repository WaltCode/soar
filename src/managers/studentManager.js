const express = require('express');
const { Student } = require('../models/student');
const { Classroom } = require('../models/classroom');
const auth = require('../mws/auth');
const validate = require('../libs/validator');
const { ApiError } = require('../libs/errors');
const { get, set, del } = require('../cache/redisCache');
const studentSchemas = require('../libs/validation/studentSchemas');

const router = express.Router();

router.use(auth(['schooladmin', 'superadmin']));

const checkSchoolScope = (req, res, next) => {
  if (req.user.role === 'schooladmin' && req.body.schoolId && req.body.schoolId.toString() !== req.user.schoolId.toString()) {
    throw new ApiError(403, 'Forbidden: School mismatch');
  }
  next();
};

/**
 * @swagger
 * /api/v1/students:
 *   post:
 *     summary: Create a new student
 *     description: School admin creates student in their school
 *     tags: [Students]
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
 *             properties:
 *               schoolId:
 *                 type: string
 *                 format: uuid
 *                 example: 507f1f77bcf86cd799439011
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Aisha Mohammed
 *               age:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 25
 *                 example: 14
 *               enrollmentDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-09-01T00:00:00.000Z
 *               profile:
 *                 type: object
 *                 properties:
 *                   photo:
 *                     type: string
 *                     format: uri
 *                     example: https://school.com/photos/aisha.jpg
 *                   bio:
 *                     type: string
 *                     maxLength: 500
 *               classroomId:
 *                 type: string
 *                 format: uuid
 *                 example: 507f191e810c19729de860ea
 *     responses:
 *       201:
 *         description: Student created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/', validate(studentSchemas.create), checkSchoolScope, async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    await del(`students:${req.body.schoolId}`);
    res.status(201).json(student);
  } catch (err) {
    throw new ApiError(500, err.message || 'Create failed');
  }
});

/**
 * @swagger
 * /api/v1/students:
 *   get:
 *     summary: List students
 *     description: List students (scoped to school for admins)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: schoolId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Required for superadmin
 *       - name: classroomId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional filter
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
 *         description: Paginated students list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
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
    let { schoolId, classroomId, page = 1, limit = 10, sort = 'name:asc' } = req.query;
    if (req.user.role === 'schooladmin') {
      schoolId = req.user.schoolId;
    }
    if (!schoolId) throw new ApiError(400, 'schoolId required');
    const filter = { schoolId };
    if (classroomId) filter.classroomId = classroomId;
    const cacheKey = `students:${schoolId}:${classroomId || 'all'}:${page}:${limit}:${sort}`;
    let result = await get(cacheKey);
    if (!result) {
      const [field, order] = sort.split(':');
      const students = await Student.find(filter)
        .sort({ [field]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();
      const total = await Student.countDocuments(filter);
      result = { students, total, page: Number(page), limit: Number(limit) };
      await set(cacheKey, result, 300);
    }
    res.json(result);
  } catch (err) {
    throw new ApiError(500, err.message || 'List failed');
  }
});

/**
 * @swagger
 * /api/v1/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     description: Retrieve single student (scoped check)
 *     tags: [Students]
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
 *         description: Student details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
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
    const student = await Student.findById(req.params.id).lean();
    if (!student) throw new ApiError(404, 'Student not found');
    if (req.user.role === 'schooladmin' && student.schoolId.toString() !== req.user.schoolId.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
    res.json(student);
  } catch (err) {
    throw new ApiError(500, err.message || 'Get failed');
  }
});

/**
 * @swagger
 * /api/v1/students/{id}:
 *   put:
 *     summary: Update student
 *     description: Update student profile/details
 *     tags: [Students]
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
 *               age:
 *                 type: integer
 *               enrollmentDate:
 *                 type: string
 *                 format: date-time
 *               profile:
 *                 type: object
 *                 properties:
 *                   photo:
 *                     type: string
 *                     format: uri
 *                   bio:
 *                     type: string
 *     responses:
 *       200:
 *         description: Updated student
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
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
router.put('/:id', validate(studentSchemas.update), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) throw new ApiError(404, 'Student not found');
    if (req.user.role === 'schooladmin' && student.schoolId.toString() !== req.user.schoolId.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
    Object.assign(student, req.body);
    await student.save();
    await del(`students:${student.schoolId}`);
    res.json(student);
  } catch (err) {
    throw new ApiError(500, err.message || 'Update failed');
  }
});

/**
 * @swagger
 * /api/v1/students/{id}/enroll:
 *   put:
 *     summary: Enroll/transfer student to classroom
 *     description: Assign student to classroom (validates capacity & school match)
 *     tags: [Students]
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
 *             required:
 *               - classroomId
 *             properties:
 *               classroomId:
 *                 type: string
 *                 format: uuid
 *                 example: 507f191e810c19729de860ea
 *     responses:
 *       200:
 *         description: Student enrolled/updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       400:
 *         description: Invalid classroom or capacity full
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
router.put('/:id/enroll', validate(studentSchemas.enroll), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) throw new ApiError(404, 'Student not found');
    if (req.user.role === 'schooladmin' && student.schoolId.toString() !== req.user.schoolId.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
    const classroom = await Classroom.findById(req.body.classroomId);
    if (!classroom || classroom.schoolId.toString() !== student.schoolId.toString()) {
      throw new ApiError(400, 'Invalid classroom for this school');
    }
    const enrolledCount = await Student.countDocuments({ classroomId: req.body.classroomId });
    if (enrolledCount >= classroom.capacity) throw new ApiError(400, 'Classroom at full capacity');
    student.classroomId = req.body.classroomId;
    student.enrollmentDate = student.enrollmentDate || new Date();
    await student.save();
    await del(`students:${student.schoolId}`);
    res.json(student);
  } catch (err) {
    throw new ApiError(500, err.message || 'Enroll failed');
  }
});

/**
 * @swagger
 * /api/v1/students/{id}:
 *   delete:
 *     summary: Delete student
 *     description: Remove student record
 *     tags: [Students]
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
 *         description: Student deleted
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
    const student = await Student.findById(req.params.id);
    if (!student) throw new ApiError(404, 'Student not found');
    if (req.user.role === 'schooladmin' && student.schoolId.toString() !== req.user.schoolId.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
    await Student.findByIdAndDelete(req.params.id);
    await del(`students:${student.schoolId}`);
    res.status(204).send();
  } catch (err) {
    throw new ApiError(500, err.message || 'Delete failed');
  }
});

module.exports = { router };