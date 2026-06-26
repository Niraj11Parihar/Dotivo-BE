import { Request, Response } from 'express';
import { User } from '../models/user.model';

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { passwordHash, ...result } = user.toObject();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
