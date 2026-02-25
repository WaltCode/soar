/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 *   schemas:
 *     Error:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: object
 *           required:
 *             - code
 *             - message
 *           properties:
 *             code:
 *               type: integer
 *               example: 400
 *             message:
 *               type: string
 *               example: "Validation failed"
 *             details:
 *               type: array
 *               items:
 *                 type: string
 *               example:
 *                 - "username is required"
 *                 - "password must contain uppercase letter"
 * 
 *     User:
 *       type: object
 *       description: Represents a system user (superadmin or schooladmin)
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           example: 507f1f77bcf86cd799439011
 *         username:
 *           type: string
 *           example: "superadmin"
 *         role:
 *           type: string
 *           enum: [superadmin, schooladmin]
 *           example: superadmin
 *         schoolId:
 *           type: string
 *           format: uuid
 *           description: Required only for schooladmin role
 *           example: 507f1f77bcf86cd799439012
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-02-01T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-02-01T10:00:00.000Z
 * 
 *     School:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           example: "Greenfield Academy"
 *         address:
 *           type: string
 *           example: "45 Education Lane, Lagos"
 *         contactEmail:
 *           type: string
 *           format: email
 *           example: info@greenfield.edu.ng
 *         phone:
 *           type: string
 *           example: "+2348012345678"
 *         profile:
 *           type: object
 *           properties:
 *             logo:
 *               type: string
 *               format: uri
 *               example: https://school.com/logo.png
 *             description:
 *               type: string
 *               example: "Leading educational institution"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Classroom:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           example: 507f191e810c19729de860ea
 *         schoolId:
 *           type: string
 *           format: uuid
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           example: "Science Lab A"
 *         capacity:
 *           type: integer
 *           example: 35
 *         resources:
 *           type: array
 *           items:
 *             type: string
 *           example: ["projector", "whiteboard", "computers"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Student:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           example: 507f1f77bcf86cd799439012
 *         schoolId:
 *           type: string
 *           format: uuid
 *           example: 507f1f77bcf86cd799439011
 *         classroomId:
 *           type: string
 *           format: uuid
 *           example: 507f191e810c19729de860ea
 *         name:
 *           type: string
 *           example: "Aisha Mohammed"
 *         age:
 *           type: integer
 *           example: 14
 *         enrollmentDate:
 *           type: string
 *           format: date-time
 *           example: 2024-09-01T00:00:00.000Z
 *         profile:
 *           type: object
 *           properties:
 *             photo:
 *               type: string
 *               format: uri
 *               example: https://school.com/photos/aisha.jpg
 *             bio:
 *               type: string
 *               example: "Bright student interested in science"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */