import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getTreeStatus,
  waterTree,
  setTreeName,
  getTreeHistory,
} from '../controllers/tree.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getTreeStatus);
router.post('/water', waterTree);
router.patch('/name', setTreeName);
router.get('/history', getTreeHistory);

export default router;
