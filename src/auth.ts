import { Request, Response, NextFunction } from 'express';
import db from './db';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const sessionToken = req.cookies.session_token;

  if (!sessionToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const session = await db('sessions').where({ id: sessionToken }).first();

  if (!session || new Date(session.expires_at) < new Date()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await db('users').where({ id: session.user_id }).first();

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  (req as any).user = user;
  next();
};