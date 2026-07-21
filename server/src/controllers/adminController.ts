import { Request, Response } from 'express';
import prisma from '../config/db';
import { Server } from 'socket.io';

/**
 * Computes administrative dashboard metrics (user/message counts, activity channels, report totals).
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalMessages = await prisma.message.count();
    const pendingReports = await prisma.report.count({ where: { status: 'PENDING' } });

    // Active users online now or active within last 24 hours
    const activePeriod = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          { isOnline: true },
          { lastSeen: { gte: activePeriod } },
        ],
      },
    });

    // Message volumes grouped by type
    const messageTypes = await prisma.message.groupBy({
      by: ['type'],
      _count: {
        _all: true,
      },
    });

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json({
      stats: {
        totalUsers,
        totalMessages,
        activeUsers,
        pendingReports,
        messageBreakdown: messageTypes.map((item) => ({
          type: item.type,
          count: item._count._all,
        })),
        recentUsers,
      },
    });
  } catch (error) {
    console.error('Get stats admin controller error:', error);
    return res.status(500).json({ message: 'Internal server error generating dashboard statistics.' });
  }
};

/**
 * Lists all users registered in the system (supporting search filters).
 */
export const listUsers = async (req: Request, res: Response) => {
  const { query = '' } = req.query;

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query as string } },
          { email: { contains: query as string } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
        lastSeen: true,
        isOnline: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error) {
    console.error('List users admin controller error:', error);
    return res.status(500).json({ message: 'Internal server error fetching users list.' });
  }
};

/**
 * Toggles a user's ban status. Immediately forces disconnection on all active sockets of the target user.
 */
export const toggleBanUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const io = req.app.get('io') as Server;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Administrator accounts cannot be banned.' });
    }

    const nextBanStatus = !user.isBanned;

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: nextBanStatus },
    });

    // Terminate socket connections if user was banned
    if (nextBanStatus) {
      const userRoom = `user_${userId}`;
      const userSockets = await io.in(userRoom).fetchSockets();

      for (const socket of userSockets) {
        socket.emit('banned', { message: 'Your account has been suspended by an administrator.' });
        socket.disconnect(true);
      }
    }

    return res.json({
      message: `User has been successfully ${nextBanStatus ? 'banned' : 'unbanned'}.`,
      isBanned: nextBanStatus,
    });
  } catch (error) {
    console.error('Toggle ban user admin controller error:', error);
    return res.status(500).json({ message: 'Internal server error modifying ban state.' });
  }
};

/**
 * Permanently deletes a user from the system.
 */
export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const io = req.app.get('io') as Server;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Administrator accounts cannot be deleted.' });
    }

    // Force disconnect active sockets before deletion
    const userRoom = `user_${userId}`;
    const userSockets = await io.in(userRoom).fetchSockets();

    for (const socket of userSockets) {
      socket.emit('banned', { message: 'Your account has been permanently deleted by an administrator.' });
      socket.disconnect(true);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user admin controller error:', error);
    return res.status(500).json({ message: 'Internal server error deleting user.' });
  }
};

/**
 * Retrieves all reported abuse logs.
 */
export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: { id: true, username: true, email: true },
        },
        reported: {
          select: { id: true, username: true, email: true, isBanned: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ reports });
  } catch (error) {
    console.error('Get reports admin controller error:', error);
    return res.status(500).json({ message: 'Internal server error retrieving abuse reports.' });
  }
};

/**
 * Resolves report status.
 */
export const resolveReport = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ message: 'Abuse report log not found.' });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { status: 'RESOLVED' },
    });

    return res.json({ message: 'Report resolved successfully.', report: updatedReport });
  } catch (error) {
    console.error('Resolve report admin controller error:', error);
    return res.status(500).json({ message: 'Internal server error resolving report.' });
  }
};
