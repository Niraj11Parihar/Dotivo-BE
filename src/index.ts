import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import https from 'https';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import goalsRoutes from './routes/goals.routes';
import dailyPlanRoutes from './routes/daily-plan.routes';
import adminRoutes from './routes/admin.routes';
import { getActiveQuotesByCategory } from './controllers/quote.controller';

const app = express();

// ─── Security Middleware ──────────────────────────────────────────

// [SEC-09] CORS — restrict to known origins instead of wildcard.
// Add your admin dashboard domain to ALLOWED_ORIGINS when deployed.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
}));

app.use(helmet());
app.use(express.json());

// [SEC-04] Rate limiting — scoped to auth and admin login to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 10,                   // max 10 attempts per window per IP
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,     // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers
  skipSuccessfulRequests: true, // Only count failed attempts against the limit
});

app.use('/auth', authLimiter);
app.use('/admin/login', authLimiter);

// Self-ping to prevent Render free tier from sleeping
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
  setInterval(() => {
    https.get(RENDER_URL, (res) => {
      console.log(`Self-ping status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('Self-ping error:', err.message);
    });
  }, 10 * 60 * 1000); // 10 minutes
}

// ─── Routes ──────────────────────────────────────────────────────

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

// ─── Database & Server ───────────────────────────────────────────

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
