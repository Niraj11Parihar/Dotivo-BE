import mongoose, { Document, Schema, Types } from 'mongoose';

export interface DailyGoalSnapshot {
  goalTemplateId: Types.ObjectId;
  title: string;
  category: string;
  targetCount: number;
  completedCount: number;
  isDailyMinimum: boolean;
  isTop3Default: boolean;
  color: string;
  icon: string;
}

const DailyGoalSnapshotSchema = new Schema({
  goalTemplateId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  category: { type: String },
  targetCount: { type: Number, default: 1 },
  completedCount: { type: Number, default: 0 },
  isDailyMinimum: { type: Boolean, default: false },
  isTop3Default: { type: Boolean, default: false },
  color: { type: String },
  icon: { type: String },
}, { _id: false });

export interface DailyPlanDocument extends Document {
  userId: Types.ObjectId;
  date: string;
  top3Count: number;
  optionalCount: number;
  summaryStatus: string;
  goals: DailyGoalSnapshot[];
}

const DailyPlanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  top3Count: { type: Number, default: 0 },
  optionalCount: { type: Number, default: 0 },
  summaryStatus: { type: String, enum: ['green', 'partial', 'grey'], default: 'grey' },
  goals: { type: [DailyGoalSnapshotSchema], default: [] },
}, { timestamps: true });

DailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyPlan = mongoose.model<DailyPlanDocument>('DailyPlan', DailyPlanSchema);
