import { Router } from 'express';
import { adminLogin, createInitialAdmin, getAllUsers, getAdmins, createAdmin } from '../controllers/admin.controller';
import { 
  getQuotes, 
  getQuoteById, 
  createQuote, 
  updateQuote, 
  deleteQuote 
} from '../controllers/quote.controller';
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';

const router = Router();

// Auth
router.post('/login', adminLogin);
router.post('/setup', createInitialAdmin); // Only works if no admins exist

// Admins Management (Protected)
router.get('/admins', adminAuthMiddleware, getAdmins);
router.post('/admins', adminAuthMiddleware, createAdmin);

// Users (Protected)
router.get('/users', adminAuthMiddleware, getAllUsers);

// Quotes (Protected)
router.get('/quotes', adminAuthMiddleware, getQuotes);
router.get('/quotes/:id', adminAuthMiddleware, getQuoteById);
router.post('/quotes', adminAuthMiddleware, createQuote);
router.put('/quotes/:id', adminAuthMiddleware, updateQuote);
router.delete('/quotes/:id', adminAuthMiddleware, deleteQuote);

export default router;
