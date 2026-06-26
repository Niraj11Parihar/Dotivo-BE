import { Router } from 'express';
import * as UsersController from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authMiddleware, UsersController.getProfile);

export default router;
