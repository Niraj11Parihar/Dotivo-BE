import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AdminUser } from '../models/admin-user.model';

export const adminAuthMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    // Check if it's an admin token by finding the admin user
    const admin = await AdminUser.findById(decoded.userId);
    if (!admin) {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
};
