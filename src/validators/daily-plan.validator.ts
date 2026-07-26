import * as Joi from 'joi';

export class LogCompletionDto {
  goalTemplateId: string;
  date: string;
  completedCount: number;
  note?: string;
  source?: string;
}

export const logCompletionSchema = Joi.object({
  goalTemplateId: Joi.string().required(),
  date: Joi.string().isoDate().required(),
  completedCount: Joi.number().min(0).max(1000).required(), // [BUG-02] Cap at 1000
  note: Joi.string().optional(),
  source: Joi.string().valid('app', 'widget', 'wallpaper').optional(),
});

