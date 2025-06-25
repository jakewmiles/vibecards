import request from 'supertest';
import app from '../../src/app';
import db from '../../src/db';

jest.mock('../../src/db');

describe('Auth Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      (db as any).mockReturnValueOnce({ insert: jest.fn().mockResolvedValue(undefined) });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      const user = { id: 'some-uuid', email: 'test@example.com', password_hash: 'hashedpassword' };
      (db as any).mockReturnValueOnce({ where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(user) }) });
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      (db as any).mockReturnValueOnce({ insert: jest.fn().mockResolvedValue(undefined) });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logged in successfully' });
    });
  });
});