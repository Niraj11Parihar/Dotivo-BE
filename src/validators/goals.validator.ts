import * as Joi from 'joi';

export class CreateGoalTemplateDto {
  title: string;
  category?: string;
  frequencyType?: string;
  selectedDays?: number[];
  targetCount?: number;
  isDailyMinimum?: boolean;
  isTop3Default?: boolean;
  reminderTime?: string;
  color?: string;
  icon?: string;
}

export class UpdateGoalTemplateDto extends CreateGoalTemplateDto {}

export const createGoalSchema = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().optional(),
  frequencyType: Joi.string().valid('daily', 'weekly', 'specific_days').optional(),
  selectedDays: Joi.array().items(Joi.number().min(0).max(6)).optional(),
  targetCount: Joi.number().optional(),
  isDailyMinimum: Joi.boolean().optional(),
  isTop3Default: Joi.boolean().optional(),
  reminderTime: Joi.string().optional(),
  color: Joi.string().optional(),
  icon: Joi.string().optional(),
});

export const updateGoalSchema = createGoalSchema.fork(
  Object.keys(createGoalSchema.describe().keys),
  (schema) => schema.optional()
);
