import { Router, Request, Response, NextFunction } from 'express';
import { adminLogin, createInitialAdmin, getAllUsers, getAdmins, createAdmin } from '../controllers/admin.controller';
import { 
  getQuotes, 
  getQuoteById, 
  createQuote, 
  updateQuote, 
  deleteQuote 
} from '../controllers/quote.controller';
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createQuoteSchema, updateQuoteSchema } from '../validators/quote.validator';

const router = Router();

/**
 * [SEC-03] Guard for the bootstrap endpoint.
 * Requires the ADMIN_SETUP_SECRET header to match the env variable.
 * Set ADMIN_SETUP_SECRET to a strong random value on your deployment platform
 * and only share it with trusted admins for the initial setup.
 */
const setupSecretGuard = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.ADMIN_SETUP_SECRET;
  if (!secret) {
    return res.status(503).json({ message: 'Admin setup is disabled. Set ADMIN_SETUP_SECRET to enable.' });
  }
  if (req.headers['x-setup-secret'] !== secret) {
    return res.status(403).json({ message: 'Invalid or missing setup secret.' });
  }
  next();
};

// Auth
router.post('/login', adminLogin);

// [SEC-03] Bootstrap endpoint — protected by setup secret header
router.post('/setup', setupSecretGuard, createInitialAdmin);

// Admins Management (Protected)
router.get('/admins', adminAuthMiddleware, getAdmins);
router.post('/admins', adminAuthMiddleware, createAdmin);

// Users (Protected)
router.get('/users', adminAuthMiddleware, getAllUsers);

// Quotes (Protected) — [SEC-07] validate middleware strips unknown fields
router.get('/quotes', adminAuthMiddleware, getQuotes);
router.get('/quotes/:id', adminAuthMiddleware, getQuoteById);
router.post('/quotes', adminAuthMiddleware, validate(createQuoteSchema), createQuote);
router.put('/quotes/:id', adminAuthMiddleware, validate(updateQuoteSchema), updateQuote);
router.delete('/quotes/:id', adminAuthMiddleware, deleteQuote);

export default router;
