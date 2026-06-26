import mongoose, { Document, Schema, Types } from 'mongoose';

export interface DayStatusDocument extends Document {
  userId: Types.ObjectId;
  date: string;
  status: string;
  dailyMinimumMet: boolean;
  totalGoals: number;
  completedGoals: number;
  completionScore: number;
}

const DayStatusSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['green', 'partial', 'grey'], default: 'grey' },
  dailyMinimumMet: { type: Boolean, default: false },
  totalGoals: { type: Number, default: 0 },
  completedGoals: { type: Number, default: 0 },
  completionScore: { type: Number, default: 0 },
}, { timestamps: true });

DayStatusSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DayStatus = mongoose.model<DayStatusDocument>('DayStatus', DayStatusSchema);
