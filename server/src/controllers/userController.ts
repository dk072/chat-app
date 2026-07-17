import { Request, Response } from 'express';
import prisma from '../config/db';
import { updateProfileSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { uploadMedia } from '../services/cloudinaryService';

/**
 * Searches for users by username or email. Excludes current user.
 */
export const searchUsers = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const currentUserId = authReq.user!.id;
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Search query is required.' });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query.toLowerCase() } },
              { email: { contains: query.toLowerCase() } },
            ],
          },
          { id: { not: currentUserId } },
          { isBanned: false },
        ],
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
      },
      take: 15,
    });

    return res.json({ users });
  } catch (error) {
    console.error('Search users controller error:', error);
    return res.status(500).json({ message: 'Internal server error while searching users.' });
  }
};

/**
 * Updates logged-in user bio, username, and profile picture avatar.
 */
export const updateProfile = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const currentUserId = authReq.user!.id;

  try {
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: validation.error.errors[0].message });
    }

    const { bio, username } = validation.data;
    const updateData: any = {};

    if (bio !== undefined) updateData.bio = bio;

    if (username !== undefined) {
      const lowerUsername = username.toLowerCase();
      // Ensure username is not already in use by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          username: lowerUsername,
          id: { not: currentUserId },
        },
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken by another user.' });
      }
      updateData.username = lowerUsername;
    }

    // Process file upload if multipart image was transmitted
    if (req.file) {
      const result = await uploadMedia(req.file.path, 'avatars', 'image');
      updateData.profilePicture = result.url;
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json({
      message: 'Profile details updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile controller error:', error);
    return res.status(500).json({ message: 'Internal server error while updating profile.' });
  }
};

/**
 * Fetches public user profile information.
 */
export const getUserProfile = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    return res.json({ user: userProfile });
  } catch (error) {
    console.error('Get profile controller error:', error);
    return res.status(500).json({ message: 'Internal server error retrieving user profile.' });
  }
};

/**
 * Creates abuse report against another user.
 */
export const reportUser = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const currentUserId = authReq.user!.id;
  const { reportedId, reason } = req.body;

  if (!reportedId || !reason) {
    return res.status(400).json({ message: 'Reported user ID and explanation reason are required.' });
  }

  if (currentUserId === reportedId) {
    return res.status(400).json({ message: 'You cannot submit a report against yourself.' });
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: reportedId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'The user you are reporting does not exist.' });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: currentUserId,
        reportedId,
        reason,
      },
    });

    return res.status(201).json({
      message: 'Abuse report logged successfully. System administrators will evaluate it.',
      report,
    });
  } catch (error) {
    console.error('Report user controller error:', error);
    return res.status(500).json({ message: 'Internal server error submitting report.' });
  }
};
