import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const register = async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.errors[0].message,
      });
    }

    const { username, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email.toLowerCase()
            ? 'An account with this email is already registered.'
            : 'Username is already taken.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id);

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      message: 'Registration successful!',
      user,
      token,
    });
  } catch (error) {
    console.error('Registration controller error:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.errors[0].message,
      });
    }

    const { emailOrUsername, password } = validation.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'This account has been suspended by an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(user.id);

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
};

export const me = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json({ user });
  } catch (error) {
    console.error('Self verification error:', error);
    return res.status(500).json({ message: 'Internal server error during validation.' });
  }
};
