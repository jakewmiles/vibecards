import app from './app';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import flashcardRoutes from './routes/flashcard.routes';

dotenv.config();

const port = process.env.PORT || 3000;

app.use('/api/auth', authRoutes);
app.use('/flashcards', flashcardRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});