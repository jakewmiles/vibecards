import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import db, { Flashcard, UserInterest, UserFlashcardPerformance } from './db';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); 

// Seed the database with a dummy user if it doesn't exist
(async () => {
  const user = await db('users').where({ id: 'user1' }).first();
  if (!user) {
    await db('users').insert({ id: 'user1', name: 'Test User' });
  }
})();

app.get('/flashcards/next', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Check for due flashcards
    const dueFlashcard = await db('user_flashcard_performance')
      .join('flashcards', 'user_flashcard_performance.flashcard_id', 'flashcards.id')
      .where('user_flashcard_performance.user_id', userId)
      .where('user_flashcard_performance.next_review_date', '<=', new Date())
      .select('flashcards.*')
      .first();

    if (dueFlashcard) {
      res.json(dueFlashcard);
      return;
    }

    // If no due flashcards, generate a new one
    let selectedTopic: string;
    const userInterests: UserInterest[] = await db('user_interests').where({ user_id: userId });

    if (userInterests.length === 0) {
      const defaultTopics = ['World History', 'Basic Physics', 'JavaScript Fundamentals'];
      selectedTopic = defaultTopics[Math.floor(Math.random() * defaultTopics.length)];
    } else {
      userInterests.sort((a, b) => a.interest_score - b.interest_score);
      if (Math.random() < 0.5) {
        selectedTopic = userInterests[0].topic;
      } else {
        selectedTopic = userInterests[userInterests.length - 1].topic;
      }
    }

    console.log(`Selected topic for user ${userId}: ${selectedTopic}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a single flashcard (question and answer JSON object) for a user learning about ${selectedTopic}. Return ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const jsonResponse = JSON.parse(text.replace(/```json\n|```/g, '').trim());

    const newFlashcard: Flashcard = {
      id: uuidv4(),
      topic: selectedTopic,
      ...jsonResponse,
    };

    await db('flashcards').insert(newFlashcard);

    // Create a performance record for the new card
    await db('user_flashcard_performance').insert({
      user_id: userId,
      flashcard_id: newFlashcard.id,
      ease_factor: 2.5,
      interval: 1,
      next_review_date: new Date(),
    });

    res.json(newFlashcard);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate flashcard' });
  }
});

app.post('/feedback', async (req: Request, res: Response) => {
  const { userId, flashcardId, interaction } = req.body;

  if (!userId || !flashcardId || !interaction) {
    res.status(400).json({ error: 'userId, flashcardId, and interaction are required' });
    return;
  }

  const flashcard: Flashcard = await db('flashcards').where({ id: flashcardId }).first();
  if (!flashcard) {
    res.status(404).json({ error: 'Flashcard not found' });
    return;
  }

  let performance: UserFlashcardPerformance = await db('user_flashcard_performance')
    .where({ user_id: userId, flashcard_id: flashcardId })
    .first();

  if (!performance) {
    // This should not happen if the card was served, but handle it just in case
    performance = {
      user_id: userId,
      flashcard_id: flashcardId,
      ease_factor: 2.5,
      interval: 1,
      next_review_date: new Date(),
    };
    await db('user_flashcard_performance').insert(performance);
  }

  // SM-2 Algorithm Implementation
  let { ease_factor, interval } = performance;
  let quality: number;

  switch (interaction) {
    case 'easy':
      quality = 5;
      break;
    case 'good':
      quality = 4;
      break;
    case 'hard':
      quality = 3;
      break;
    default:
      quality = 2; // Default to a lower quality for unknown interactions
  }

  if (quality < 3) {
    interval = 1; // Reset interval if the answer was incorrect
  } else {
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    if (quality === 3) {
      interval = Math.round(interval * ease_factor);
    } else {
      interval = Math.round(interval * ease_factor);
    }
  }

  const next_review_date = new Date();
  next_review_date.setDate(next_review_date.getDate() + interval);

  await db('user_flashcard_performance')
    .where({ id: performance.id })
    .update({ ease_factor, interval, next_review_date });

  console.log(`Updated performance for user ${userId} on flashcard ${flashcardId}`);
  res.status(200).json({ message: 'Feedback received' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});