import mongoose, { Document, Schema, Types } from 'mongoose';

export type TreeGrowthStage =
  | 'seedling'
  | 'sapling'
  | 'sapling_1'
  | 'sapling_2'
  | 'growing'
  | 'flowering'
  | 'blooming'
  | 'fruiting'
  | 'mature';

export interface WateringRecord {
  date: string; // YYYY-MM-DD
  goalsCompleted: number;
  totalGoals: number;
}

export interface UserTreeDocument extends Document {
  userId: Types.ObjectId;
  treeName: string;
  growthStage: TreeGrowthStage;
  totalGrowthPoints: number;
  healthPercentage: number;
  consecutiveSuccessDays: number;
  missedDaysInRow: number;
  lastWateredDate: string | null; // YYYY-MM-DD
  currentWaterBonus: number;
  wateringHistory: WateringRecord[];
}

const WateringRecordSchema = new Schema<WateringRecord>(
  {
    date: { type: String, required: true },
    goalsCompleted: { type: Number, required: true },
    totalGoals: { type: Number, required: true },
  },
  { _id: false }
);

const UserTreeSchema = new Schema<UserTreeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    treeName: { type: String, default: 'My Tree', maxlength: 30 },
    growthStage: {
      type: String,
      enum: [
        'seedling',
        'sapling',
        'sapling_1',
        'sapling_2',
        'growing',
        'flowering',
        'blooming',
        'fruiting',
        'mature',
      ],
      default: 'seedling',
    },
    totalGrowthPoints: { type: Number, default: 0, min: 0 },
    healthPercentage: { type: Number, default: 100, min: 0, max: 100 },
    consecutiveSuccessDays: { type: Number, default: 0, min: 0 },
    missedDaysInRow: { type: Number, default: 0, min: 0 },
    lastWateredDate: { type: String, default: null },
    currentWaterBonus: { type: Number, default: 1.0, min: 0.3, max: 1.0 },
    wateringHistory: { type: [WateringRecordSchema], default: [] },
  },
  { timestamps: true }
);

UserTreeSchema.index({ userId: 1 });

export const UserTree = mongoose.model<UserTreeDocument>('UserTree', UserTreeSchema);
