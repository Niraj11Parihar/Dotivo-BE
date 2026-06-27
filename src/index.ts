import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import goalsRoutes from './routes/goals.routes';
import dailyPlanRoutes from './routes/daily-plan.routes';
import adminRoutes from './routes/admin.routes';
import { getActiveQuotesByCategory } from './controllers/quote.controller';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/goals', goalsRoutes);
app.use('/admin', adminRoutes);
app.get('/public/quotes', getActiveQuotesByCategory);

// Health Check (registered before the '/' wildcard mount)
app.get('/', (req, res) => {
  res.json({ message: 'Dotivo Express API is running!' });
});

app.use('/', dailyPlanRoutes); // history, daily-plan, completions


// Database & Server
mongoose.connect(config.mongoUri as string)

  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
    });
  })
  .catch((err: any) => {
    console.error('Database connection error:', err);
  });
