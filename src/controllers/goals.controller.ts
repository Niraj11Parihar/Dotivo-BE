import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { GoalTemplate } from '../models/goal-template.model';
import { DailyPlan } from '../models/daily-plan.model';

function getLocalDateUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Explicit allowlist of fields a user may update on their own goal template.
// This is the last line of defence against mass-assignment, even if Joi is misconfigured.
const ALLOWED_UPDATE_FIELDS = [
  'title', 'category', 'frequencyType', 'selectedDays',
  'targetCount', 'isDailyMinimum', 'isTop3Default',
  'reminderTime', 'color', 'icon',
] as const;

export const create = async (req: any, res: Response) => {
  try {
    const newGoal = new GoalTemplate({
      ...req.body,
      userId: new Types.ObjectId(req.user.sub),
    });
    await newGoal.save();
    return res.status(201).json(newGoal);
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const findAll = async (req: any, res: Response) => {
  try {
    const goals = await GoalTemplate.find({ 
      userId: new Types.ObjectId(req.user.sub), 
      status: 'active' 
    }).exec();
    return res.json(goals);
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const update = async (req: any, res: Response) => {
  try {
    // Whitelist: only allow known, safe fields — never allow userId, status, or __proto__
    const sanitized = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => (ALLOWED_UPDATE_FIELDS as readonly string[]).includes(k))
    );

    const updatedGoal = await GoalTemplate.findOneAndUpdate(
      { _id: new Types.ObjectId(req.params.id), userId: new Types.ObjectId(req.user.sub) },
      { $set: sanitized },
      { new: true },
    ).exec();

    if (!updatedGoal) {
      return res.status(404).json({ message: 'Goal template not found' });
    }
    return res.json(updatedGoal);
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteGoal = async (req: any, res: Response) => {
  try {
    const userId = req.user.sub;
    const targetDate = getLocalDateUTC();

    const deletedGoal = await GoalTemplate.findOneAndDelete({
      _id: new Types.ObjectId(req.params.id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!deletedGoal) {
      return res.status(404).json({ message: 'Goal template not found or unauthorized' });
    }

    // Remove the goal snapshot from today AND all future daily plans.
    // Using $gte ensures stale snapshots don't linger in pre-generated future plans.
    await DailyPlan.updateMany(
      { userId: new Types.ObjectId(userId), date: { $gte: targetDate } },
      { $pull: { goals: { goalTemplateId: new Types.ObjectId(req.params.id) } } }
    ).exec();

    return res.json({ message: 'Goal deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
