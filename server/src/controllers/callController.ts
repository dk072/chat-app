import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

/**
 * Retrieves call history for the authenticated user, or for a specific conversation.
 */
export const getCallHistory = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { conversationId } = req.query;

  try {
    const calls = await prisma.call.findMany({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ],
        ...(conversationId ? { conversationId: conversationId as string } : {})
      },
      include: {
        caller: {
          select: { id: true, username: true, profilePicture: true }
        },
        receiver: {
          select: { id: true, username: true, profilePicture: true }
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 50 // Fetch last 50 calls
    });

    return res.json({ calls: calls.reverse() });
  } catch (error) {
    console.error('Get call history error:', error);
    return res.status(500).json({ message: 'Internal server error fetching call history.' });
  }
};
