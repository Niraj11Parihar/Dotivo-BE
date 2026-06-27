import mongoose, { Document, Schema } from 'mongoose';

export interface AdminUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  toObject(): any;
}

const AdminUserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'product', 'support', 'marketing', 'finance'], 
    default: 'superadmin' 
  },
}, { timestamps: true });

export const AdminUser = mongoose.model<AdminUserDocument>('AdminUser', AdminUserSchema);
