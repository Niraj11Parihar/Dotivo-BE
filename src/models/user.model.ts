import mongoose, { Document, Schema } from 'mongoose';

export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  timezone: string;
  plan: string;
  onboardingCompleted: boolean;
  toObject(): any;
}

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  timezone: { type: String, default: 'UTC' },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model<UserDocument>('User', UserSchema);
