import request from 'supertest';
import app from '../../src/app';
import db from '../../src/db';
import { authMiddleware } from '../../src/auth';

jest.mock('../../src/db');
jest.mock('../../src/auth');

describe('Flashcard Routes', () => {
  beforeEach(() => {
    (authMiddleware as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { id: 'user1' };
      next();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /flashcards/next', () => {
    it('should return the next flashcard', async () => {
      const dueFlashcard = { id: 'flashcard1', question: 'What is 2+2?', answer: '4' };
      (db as any).mockReturnValueOnce({
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(dueFlashcard),
      });

      const res = await request(app).get('/flashcards/next');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(dueFlashcard);
    });
  });

  describe('POST /flashcards/feedback', () => {
    it('should submit feedback for a flashcard', async () => {
      const flashcard = { id: 'flashcard1' };
      const performance = { id: 1, ease_factor: 2.5, interval: 1 };
      (db as any).mockReturnValueOnce({ where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(flashcard) }) });
      (db as any).mockReturnValueOnce({ where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(performance) }) });
      (db as any).mockReturnValueOnce({ where: jest.fn().mockReturnValue({ update: jest.fn().mockResolvedValue(undefined) }) });

      const res = await request(app)
        .post('/flashcards/feedback')
        .send({ flashcardId: 'flashcard1', interaction: 'good' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Feedback received' });
    });
  });
});