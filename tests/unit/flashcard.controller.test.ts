import { Request, Response } from 'express';
import { getNextFlashcard, submitFeedback } from '../../src/controllers/flashcard.controller';
import db from '../../src/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('../../src/db');
jest.mock('@google/generative-ai');

describe('Flashcard Controller', () => {
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
      user: { id: 'user1' },
    };
    res = {
      status,
      json,
    };
  });

  describe('getNextFlashcard', () => {
    it('should return a due flashcard if one exists', async () => {
      const dueFlashcard = { id: 'flashcard1', question: 'What is 2+2?', answer: '4' };
      (db as any).mockReturnValueOnce({
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(dueFlashcard),
      });

      await getNextFlashcard(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(dueFlashcard);
    });

    it('should generate a new flashcard if no due flashcards exist', async () => {
      (db as any).mockReturnValueOnce({
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(undefined),
      });
      (db as any).mockReturnValueOnce({ where: jest.fn().mockResolvedValue([]) });
      const mockGenerateContent = jest.fn().mockResolvedValue({ response: { text: () => '{"question":"q","answer":"a"}' } });
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
      }));
      (db as any).mockReturnValueOnce({ insert: jest.fn().mockResolvedValue(undefined) });
      (db as any).mockReturnValueOnce({ insert: jest.fn().mockResolvedValue(undefined) });

      await getNextFlashcard(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ question: 'q', answer: 'a' }));
    });
  });

  describe('submitFeedback', () => {
    it('should update flashcard performance based on feedback', async () => {
      req.body = { flashcardId: 'flashcard1', interaction: 'good' };
      const flashcard = { id: 'flashcard1' };
      const performance = { id: 1, ease_factor: 2.5, interval: 1 };
      (db as any).mockReturnValueOnce({ where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(flashcard) }) });
      (db as any).mockReturnValueOnce({ where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(performance) }) });
      (db as any).mockReturnValueOnce({ where: jest.fn().mockReturnValue({ update: jest.fn().mockResolvedValue(undefined) }) });

      await submitFeedback(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Feedback received' });
    });
  });
});