import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { config } from '../config';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
    });
    await newUser.save();

    const payload = { email: newUser.email, sub: newUser._id };
    const token = jwt.sign(payload, config.jwtSecret as string, { expiresIn: String(config.jwtExpiresIn) } as jwt.SignOptions);
    
    const { passwordHash: _, ...result } = newUser.toObject();

    return res.status(201).json({
      access_token: token,
      user: result,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { email: user.email, sub: user._id };
    const token = jwt.sign(payload, config.jwtSecret as string, { expiresIn: String(config.jwtExpiresIn) } as jwt.SignOptions);
    
    const { passwordHash, ...userResult } = user.toObject();
    
    return res.json({
      access_token: token,
      user: userResult,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
