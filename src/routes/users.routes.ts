import { Router } from 'express';
import * as UsersController from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authMiddleware, UsersController.getProfile);

// [BUG-01] DELETE /me — cascade deletes all user data (GDPR Art. 17)
router.delete('/me', authMiddleware, UsersController.deleteAccount);

export default router;

