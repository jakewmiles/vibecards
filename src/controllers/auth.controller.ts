import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  try {
    await db('users').insert({ id, email, password_hash });
    res.status(201).json({ id, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await db('users').where({ email }).first();

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const sessionToken = uuidv4();
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db('sessions').insert({
    id: sessionToken,
    user_id: user.id,
    expires_at,
  });

  res.cookie('session_token', sessionToken, { httpOnly: true, expires: expires_at });
  res.status(200).json({ message: 'Logged in successfully' });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const sessionToken = req.cookies.session_token;
  await db('sessions').where({ id: sessionToken }).del();
  res.clearCookie('session_token');
  res.status(200).json({ message: 'Logged out successfully' });
};