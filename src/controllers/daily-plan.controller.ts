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

  for (const g of plan.goals) {
    if (g.isDailyMinimum) {
      hasMinimums = true;
      if (g.completedCount < g.targetCount) minimumsMet = false;
    }
    if (g.completedCount >= g.targetCount) completedGoals++;
  }

  let status = 'grey';
  if (hasMinimums && minimumsMet) status = 'green';
  else if (completedGoals > 0) status = 'partial';

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
      plan = await DailyPlan.findOne({ userId: new Types.ObjectId(userId), date }).session(session as any).exec();

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
    return res.status(500).json({ message: err.message });
  }
};

export const logCompletion = async (req: any, res: Response) => {
  try {
    const userId = req.user.sub;
    const { goalTemplateId, date, completedCount, note, source } = req.body;

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
    }

    await evaluateAndSaveDayStatus(userId, date, plan);
    await plan.save();

    return res.json(plan);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getHistory = async (req: any, res: Response) => {
  try {
    const range = parseInt(req.query.range as string) || 30;
    const history = await DayStatus.find({ userId: new Types.ObjectId(req.user.sub) })
      .sort({ date: -1 })
      .limit(range)
      .exec();
    return res.json(history);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
