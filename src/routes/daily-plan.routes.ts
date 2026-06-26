import { Router } from 'express';
import * as DailyPlanController from '../controllers/daily-plan.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { logCompletionSchema } from '../validators/daily-plan.validator';

const router = Router();

router.use(authMiddleware);

router.get('/daily-plan', DailyPlanController.getDailyPlan);
router.post('/completions', validate(logCompletionSchema), DailyPlanController.logCompletion);
router.get('/history', DailyPlanController.getHistory);

export default router;
