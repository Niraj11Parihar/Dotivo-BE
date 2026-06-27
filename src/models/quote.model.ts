import mongoose, { Document, Schema } from 'mongoose';

export interface QuoteDocument extends Document {
  text: string;
  author: string;
  category: string;
  tone: string;
  status: string;
  featured: boolean;
  toObject(): any;
}

const QuoteSchema = new Schema({
  text: { type: String, required: true },
  author: { type: String, default: 'Unknown' },
  category: { type: String, required: true, index: true },
  tone: { type: String, default: 'Neutral' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

export const Quote = mongoose.model<QuoteDocument>('Quote', QuoteSchema);
