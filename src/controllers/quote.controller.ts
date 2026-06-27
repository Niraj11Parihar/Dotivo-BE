import { Request, Response } from 'express';
import { Quote } from '../models/quote.model';

export const getQuotes = async (req: Request, res: Response) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching quotes' });
  }
};

export const getQuoteById = async (req: Request, res: Response) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching quote' });
  }
};

export const createQuote = async (req: Request, res: Response) => {
  try {
    const newQuote = new Quote(req.body);
    await newQuote.save();
    res.status(201).json(newQuote);
  } catch (err) {
    res.status(500).json({ message: 'Error creating quote', error: err });
  }
};

export const updateQuote = async (req: Request, res: Response) => {
  try {
    const updatedQuote = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedQuote) return res.status(404).json({ message: 'Quote not found' });
    res.json(updatedQuote);
  } catch (err) {
    res.status(500).json({ message: 'Error updating quote' });
  }
};

export const deleteQuote = async (req: Request, res: Response) => {
  try {
    const deleted = await Quote.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Quote not found' });
    res.json({ message: 'Quote deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting quote' });
  }
};

// Public endpoint for mobile app
export const getActiveQuotesByCategory = async (req: Request, res: Response) => {
  try {
    const quotes = await Quote.find({ status: 'active' });
    const grouped = quotes.reduce((acc: any, q) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push(`"${q.text}"${q.author !== 'Unknown' ? ` — ${q.author}` : ''}`);
      return acc;
    }, {});
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching public quotes' });
  }
};
