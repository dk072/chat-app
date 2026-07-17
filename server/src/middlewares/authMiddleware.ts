import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    isBanned: boolean;
  };
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1. Look for Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Look for Cookies (Parsed manually to keep dependencies light)
  else if (req.headers.cookie) {
    try {
      const cookies = req.headers.cookie.split(';').reduce((acc, current) => {
        const [key, value] = current.split('=');
        acc[key.trim()] = value ? value.trim() : '';
        return acc;
      }, {} as Record<string, string>);
      token = cookies['token'];
    } catch (e) {
      // Ignore parsing errors
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Access denied, your account has been banned' });
    }

    // Attach user payload to request
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication server error' });
  }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user && authReq.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied, administrator privileges required' });
  }
};
