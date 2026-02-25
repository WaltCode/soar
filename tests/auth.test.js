const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { connect } = require('../connect/mongoose');

beforeAll(async () => await connect());
afterAll(async () => await mongoose.disconnect());

describe('Auth', () => {
  it('registers user', async () => {
    // Assume superadmin token for test
    const res = await request(app).post('/auth/register').send({ username: 'test', password: 'Pass123!', role: 'superadmin' });
    expect(res.status).toBe(201);
  });
  it('logs in', async () => {
    const res = await request(app).post('/auth/login').send({ username: 'test', password: 'Pass123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
  // Add failure, refresh, logout tests
});