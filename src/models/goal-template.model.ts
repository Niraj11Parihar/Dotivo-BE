import mongoose, { Document, Schema, Types } from 'mongoose';

export interface GoalTemplateDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  category: string;
  frequencyType: string;
  selectedDays: number[];
  targetCount: number;
  isDailyMinimum: boolean;
  isTop3Default: boolean;
  reminderTime: string;
  color: string;
  icon: string;
  status: string;
}

const GoalTemplateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String },
  frequencyType: { type: String, enum: ['daily', 'weekly', 'specific_days'], default: 'daily' },
  selectedDays: { type: [Number], default: [] },
  targetCount: { type: Number, default: 1 },
  isDailyMinimum: { type: Boolean, default: false },
  isTop3Default: { type: Boolean, default: false },
  reminderTime: { type: String },
  color: { type: String },
  icon: { type: String },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });

export const GoalTemplate = mongoose.model<GoalTemplateDocument>('GoalTemplate', GoalTemplateSchema);
