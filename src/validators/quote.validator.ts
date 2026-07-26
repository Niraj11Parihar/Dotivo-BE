import * as Joi from 'joi';

// [SEC-07] Whitelist schema for quote create/update — prevents mass-assignment and injection
export const createQuoteSchema = Joi.object({
  text: Joi.string().min(5).max(1000).required(),
  author: Joi.string().max(200).optional().default('Unknown'),
  category: Joi.string().max(100).optional(),
  tone: Joi.string().valid('motivational', 'calm', 'reflective', 'energetic', 'humorous').optional(),
  status: Joi.string().valid('active', 'inactive', 'draft').optional().default('active'),
  featured: Joi.boolean().optional().default(false),
});

export const updateQuoteSchema = Joi.object({
  text: Joi.string().min(5).max(1000).optional(),
  author: Joi.string().max(200).optional(),
  category: Joi.string().max(100).optional(),
  tone: Joi.string().valid('motivational', 'calm', 'reflective', 'energetic', 'humorous').optional(),
  status: Joi.string().valid('active', 'inactive', 'draft').optional(),
  featured: Joi.boolean().optional(),
});
