import { Router } from 'express';
import { getNextFlashcard, submitFeedback } from '../controllers/flashcard.controller';
import { authMiddleware } from '../auth';

const router = Router();

router.get('/next', authMiddleware, getNextFlashcard);
router.post('/feedback', authMiddleware, submitFeedback);

export default router;