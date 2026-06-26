import { Router } from 'express';
import * as GoalsController from '../controllers/goals.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createGoalSchema, updateGoalSchema } from '../validators/goals.validator';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createGoalSchema), GoalsController.create);
router.get('/', GoalsController.findAll);
router.patch('/:id', validate(updateGoalSchema), GoalsController.update);
router.delete('/:id', GoalsController.deleteGoal);

export default router;
