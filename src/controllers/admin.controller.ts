import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/admin-user.model';
import { User } from '../models/user.model'; // [STD-01] Top-level import — no more require() inside functions
import { config } from '../config';

/**
 * Validates password strength. Min 12 chars, at least one uppercase, one digit, one special char.
 */
function isStrongPassword(password: string): boolean {
  if (password.length < 12) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  return true;
}

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find admin user
    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: admin._id, role: admin.role, isAdmin: true },
      config.jwtSecret,
      { expiresIn: String(config.jwtExpiresIn) } as jwt.SignOptions
    );

    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createInitialAdmin = async (req: Request, res: Response) => {
  try {
    // Only allow this if no admins exist
    const count = await AdminUser.countDocuments();
    if (count > 0) {
      return res.status(403).json({ message: 'Admins already exist. Use POST /admin/admins to create additional admins.' });
    }

    const { name, email, password } = req.body;

    // [SEC-03] Enforce password strength for initial admin creation
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 12 characters and contain an uppercase letter, a number, and a special character.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = new AdminUser({
      name,
      email,
      passwordHash,
      role: 'superadmin'
    });

    await admin.save();
    res.status(201).json({ message: 'Initial admin created successfully' });
  } catch (err) {
    console.error('Create initial admin error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // [STD-01] Uses top-level import — no more dynamic require()
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await AdminUser.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    console.error('Get admins error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existing = await AdminUser.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = new AdminUser({
      name,
      email,
      passwordHash,
      role: role || 'product'
    });

    await admin.save();
    res.status(201).json({ message: 'Admin created successfully', admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
