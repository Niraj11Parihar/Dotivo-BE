import mongoose, { Document, Schema, Types } from 'mongoose';

export interface GoalCompletionDocument extends Document {
  userId: Types.ObjectId;
  goalTemplateId: Types.ObjectId;
  date: string;
  completedCount: number;
  note: string;
  source: string;
}

const GoalCompletionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  goalTemplateId: { type: Schema.Types.ObjectId, ref: 'GoalTemplate', required: true },
  date: { type: String, required: true },
  completedCount: { type: Number, default: 1 },
  note: { type: String },
  source: { type: String, enum: ['app', 'widget', 'wallpaper'], default: 'app' },
}, { timestamps: true });

export const GoalCompletion = mongoose.model<GoalCompletionDocument>('GoalCompletion', GoalCompletionSchema);
