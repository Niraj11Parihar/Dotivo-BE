import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';

export const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // Strip unknown fields — prevents mass-assignment attacks
    });
    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({ message: `Validation failed: ${messages}` });
    }
    // Replace req.body with the sanitized, stripped value
    req.body = value;
    next();
  };
};

