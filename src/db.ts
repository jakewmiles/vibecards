import knex from 'knex';
import config from '../knexfile';

const db = knex(config.development);

export default db;

export interface User {
  id: string;
  name: string;
}

export interface Flashcard {
  id: string;
  topic: string;
  question: string;
  answer: string;
}

export interface UserInterest {
  id?: number;
  user_id: string;
  topic: string;
  interest_score: number;
}

export interface UserFlashcardPerformance {
  id?: number;
  user_id: string;
  flashcard_id: string;
  ease_factor: number;
  interval: number;
  next_review_date: Date;
}

