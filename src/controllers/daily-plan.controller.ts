import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';

import { format } from 'date-fns';
import { DailyPlan } from '../models/daily-plan.model';
import { GoalCompletion } from '../models/goal-completion.model';
import { DayStatus } from '../models/day-status.model';
import { GoalTemplate } from '../models/goal-template.model';

const evaluateAndSaveDayStatus = async (userId: string, date: string, plan: any, session?: any) => {
  let minimumsMet = true;
  let hasMinimums = false;
  let completedGoals = 0;

  let hasAnyProgress = false;
  for (const g of plan.goals) {
    if (g.completedCount > 0) hasAnyProgress = true;
    if (g.isDailyMinimum) {
      hasMinimums = true;
      if (g.completedCount < g.targetCount) minimumsMet = false;
    }
    if (g.completedCount >= g.targetCount) completedGoals++;
  }

  let status = 'grey';
  if (hasMinimums) {
    if (minimumsMet && plan.goals.length > 0) status = 'green';
    else if (hasAnyProgress) status = 'partial';
  } else {
    if (completedGoals > 0) status = 'green';
    else if (hasAnyProgress) status = 'partial';
  }

  plan.summaryStatus = status;

  await DayStatus.updateOne(
    { userId: new Types.ObjectId(userId), date },
    {
      $set: {
        status,
        dailyMinimumMet: minimumsMet,
        totalGoals: plan.goals.length,
        completedGoals,
        completionScore: plan.goals.length > 0 ? completedGoals / plan.goals.length : 0
      }
    },
    { upsert: true, session: session as any }
  );
};


const generatePlanForDate = async (userId: string, date: string) => {
  const templates = await GoalTemplate.find({ 
    userId: new Types.ObjectId(userId), 
    status: 'active' 
  }).exec();

  const snapshots = templates.map((t: any) => ({
    goalTemplateId: t._id,
    title: t.title,
    category: t.category,
    targetCount: t.targetCount,
    completedCount: 0,
    isDailyMinimum: t.isDailyMinimum,
    isTop3Default: t.isTop3Default,
    color: t.color,
    icon: t.icon,
  }));

  const top3Count = snapshots.filter(s => s.isTop3Default).length;
  const optionalCount = snapshots.length - top3Count;

  const session = await mongoose.startSession();

  session.startTransaction();
  let plan: any = null;

  try {
    plan = new DailyPlan({
      userId: new Types.ObjectId(userId),
      date,
      top3Count,
      optionalCount,
      summaryStatus: 'grey',
      goals: snapshots,
    });
    await plan.save({ session });
    await evaluateAndSaveDayStatus(userId, date, plan, session);
    await session.commitTransaction();
  } catch (e: any) {
    await session.abortTransaction();
    if (e.code === 11000) {
      // [BUG-07] Read WITHOUT the aborted session — using an aborted session throws on Atlas
      plan = await DailyPlan.findOne({ userId: new Types.ObjectId(userId), date }).exec();
    } else {
      throw e;
    }
  } finally {
    session.endSession();
  }

  if (!plan) throw new Error('Failed to generate daily plan');
  return plan;
};

export const getDailyPlan = async (req: any, res: Response) => {
  try {
    const userId = req.user.sub;
    const targetDate = (req.query.date as string) || format(new Date(), 'yyyy-MM-dd');
    
    let plan = await DailyPlan.findOne({ userId: new Types.ObjectId(userId), date: targetDate }).exec();
    if (!plan) {
      plan = await generatePlanForDate(userId, targetDate);
    }
    return res.json(plan);
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logCompletion = async (req: any, res: Response) => {
  try {
    const userId = req.user.sub;
    const { goalTemplateId, date, completedCount, note, source } = req.body;

    // [BUG-02] Verify ownership: ensure the goal belongs to the requesting user
    const goalTemplate = await GoalTemplate.findOne({
      _id: new Types.ObjectId(goalTemplateId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!goalTemplate) {
      return res.status(403).json({ message: 'Forbidden: goal does not belong to this user.' });
    }

    // The frontend always sends the new absolute completedCount total (not a delta).
    // We store it in the audit log for traceability.
    const completion = new GoalCompletion({
      userId: new Types.ObjectId(userId),
      goalTemplateId: new Types.ObjectId(goalTemplateId),
      date,
      completedCount,
      note,
      source,
    });
    await completion.save();

    let plan: any = await DailyPlan.findOne({ userId: new Types.ObjectId(userId), date }).exec();
    if (!plan) {
      plan = await generatePlanForDate(userId, date);
    }

    const goalIndex = plan.goals.findIndex((g: any) => g.goalTemplateId.toString() === goalTemplateId);
    if (goalIndex >= 0) {
      // Direct assignment: completedCount from the client is the new absolute total.
      plan.goals[goalIndex].completedCount = completedCount;
      // Mongoose doesn't track subdocument mutations automatically — must mark modified
      plan.markModified('goals');
    } else {
      plan.goals.push({
        goalTemplateId: goalTemplate._id,
        title: goalTemplate.title,
        category: goalTemplate.category,
        targetCount: goalTemplate.targetCount,
        completedCount,
        isDailyMinimum: goalTemplate.isDailyMinimum,
        isTop3Default: goalTemplate.isTop3Default,
        color: goalTemplate.color,
        icon: goalTemplate.icon,
      });
      plan.markModified('goals');
    }

    await evaluateAndSaveDayStatus(userId, date, plan);
    await plan.save();

    return res.json(plan);
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getHistory = async (req: any, res: Response) => {
  try {
    // [STD-04] Cap range to 90 to prevent abuse — user cannot dump the entire history collection
    const requestedRange = parseInt(req.query.range as string) || 30;
    const range = Math.min(requestedRange, 90);

    const plans = await DailyPlan.find({ userId: new Types.ObjectId(req.user.sub) })
      .sort({ date: -1 })
      .limit(range)
      .exec();

    const history = plans.map((plan: any) => {
      let completedGoals = 0;
      let totalActive = 0;
      for (const g of plan.goals) {
        totalActive++;
        if (g.completedCount >= g.targetCount) {
          completedGoals++;
        }
      }
      const completionScore = totalActive > 0 ? completedGoals / totalActive : 0;
      
      return {
        date: plan.date,
        status: plan.summaryStatus,
        completionScore,
        goals: plan.goals
      };
    });
    
    return res.json(history);
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
