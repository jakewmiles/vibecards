import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);

export default router;