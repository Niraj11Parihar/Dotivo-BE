import dotenv from 'dotenv';
dotenv.config();

// Fail fast: critical secrets must be provided via environment variables.
// Never use hard-coded fallback secrets in any environment.
if (!process.env.JWT_SECRET) {
  throw new Error('[STARTUP ERROR] JWT_SECRET environment variable is required but not set. Set it via your deployment platform (e.g. Render → Environment).');
}
if (!process.env.MONGODB_URI) {
  throw new Error('[STARTUP ERROR] MONGODB_URI environment variable is required but not set.');
}

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
