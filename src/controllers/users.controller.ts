import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { GoalTemplate } from '../models/goal-template.model';
import { DailyPlan } from '../models/daily-plan.model';
import { GoalCompletion } from '../models/goal-completion.model';
import { DayStatus } from '../models/day-status.model';

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { passwordHash, ...result } = user.toObject();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * [BUG-01] DELETE /users/me
 * Permanently deletes the authenticated user's account and ALL associated data.
 * This is required for GDPR Art. 17 (Right to Erasure) compliance.
 *
 * Cascade deletes: User → GoalTemplates → DailyPlans → GoalCompletions → DayStatuses
 */
export const deleteAccount = async (req: any, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user.sub);

    // Run all deletions in parallel for efficiency
    await Promise.all([
      User.findByIdAndDelete(userId),
      GoalTemplate.deleteMany({ userId }),
      DailyPlan.deleteMany({ userId }),
      GoalCompletion.deleteMany({ userId }),
      DayStatus.deleteMany({ userId }),
    ]);

    return res.json({ message: 'Account and all associated data have been permanently deleted.' });
  } catch (err: any) {
    console.error('Delete account error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
