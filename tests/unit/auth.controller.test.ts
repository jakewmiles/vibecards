import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../../src/db';
import { register, login, logout } from '../../src/controllers/auth.controller';

jest.mock('../../src/db');
jest.mock('bcrypt');
jest.mock('uuid');

describe('Auth Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn(() => ({ json }));
    req = {
      body: {},
      cookies: {},
    };
    res = {
      status,
      json,
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  describe('register', () => {
    it('should register a new user', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (uuidv4 as jest.Mock).mockReturnValue('some-uuid');
      (db as any).mockReturnValueOnce({ insert: jest.fn().mockResolvedValue(undefined) });

      await register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 'some-uuid', email: 'test@example.com' });
    });
  });

  describe('login', () => {
    it('should login a user with valid credentials', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      const user = { id: 'some-uuid', email: 'test@example.com', password_hash: 'hashedpassword' };
      (db as any).mockReturnValueOnce({ where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(user) }) });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (uuidv4 as jest.Mock).mockReturnValue('session-token');
      (db as any).mockReturnValueOnce({ insert: jest.fn().mockResolvedValue(undefined) });

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged in successfully' });
      expect(res.cookie).toHaveBeenCalledWith('session_token', 'session-token', expect.any(Object));
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      req.cookies = { session_token: 'session-token' };
      (db as any).mockReturnValueOnce({ where: jest.fn().mockReturnValue({ del: jest.fn().mockResolvedValue(undefined) }) });

      await logout(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
      expect(res.clearCookie).toHaveBeenCalledWith('session_token');
    });
  });
});