# School Management API

Production-grade REST API for managing schools, classrooms, and students with JWT authentication and RBAC.

## Features

- Role-based access (superadmin, school_admin)
- JWT authentication
- MongoDB data persistence
- Redis caching for performance
- Input validation (Joi)
- Rate limiting & security headers
- Centralized error handling
- Swagger API documentation
- Unit & integration tests

## Tech Stack

- Node.js, Express
- MongoDB, Mongoose
- Redis
- JWT, bcrypt
- Jest, Supertest

## Installation

1. Clone the repository.
2. Install dependencies: `npm install`
3. Create `.env` file (see `.env.example`).
4. Ensure MongoDB and Redis are running locally or provide remote URLs.
5. Start the server: `npm start` (production) or `npm run dev` (development).

## Environment Variables

| Variable               | Description                          |
|------------------------|--------------------------------------|
| PORT                   | Server port (default 3000)           |
| NODE_ENV               | Environment (development/production) |
| MONGODB_URI            | MongoDB connection string            |
| REDIS_URL              | Redis connection string              |
| JWT_SECRET             | Secret for signing JWT               |
| JWT_EXPIRES_IN         | JWT expiration (e.g., 7d)            |
| BCRYPT_ROUNDS          | Salt rounds for bcrypt               |
| RATE_LIMIT_WINDOW_MS   | Rate limit window (ms)               |
| RATE_LIMIT_MAX         | Max requests per window              |

### Database Schema (Mongoose Models)

- **User**
  - _id: ObjectId
  - username: String (unique, required)
  - password: String (hashed)
  - role: Enum ['superadmin', 'schooladmin']
  - schoolId: ObjectId (ref 'School', required for schooladmin)
  - refreshToken: String
  - createdAt, updatedAt

- **School**
  - _id: ObjectId
  - name: String (required)
  - address: String
  - contactEmail: String
  - phone: String
  - profile: { logo: String, description: String }
  - createdAt, updatedAt

- **Classroom**
  - _id: ObjectId
  - schoolId: ObjectId (ref 'School', required)
  - name: String (required)
  - capacity: Number (required, min 1)
  - resources: [String]
  - createdAt, updatedAt

- **Student**
  - _id: ObjectId
  - schoolId: ObjectId (ref 'School', required)
  - classroomId: ObjectId (ref 'Classroom')
  - name: String (required)
  - age: Number
  - enrollmentDate: Date
  - profile: { photo: String, bio: String }
  - createdAt, updatedAt

## API Documentation

After running, visit `/docs` for Swagger UI.

## Testing

Run tests: `npm test`

## Deployment

- Deploy to any Node.js hosting (Heroku, Render, AWS).
- Set environment variables.
- Ensure MongoDB and Redis are accessible.