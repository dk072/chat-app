import prisma from '../config/db';
import { Server } from 'socket.io';

export const listIpRules = async () => {
  try {
    return await prisma.ipRule.findMany({ orderBy: { createdAt: 'desc' } });
  } catch (err) {
    console.error('Error fetching IP rules:', err);
    return [];
  }
};

export const addIpRule = async (ip: string, type: 'BLACKLIST' | 'WHITELIST', reason?: string, addedBy?: string) => {
  try {
    return await prisma.ipRule.upsert({
      where: { ip },
      update: { type, reason, addedBy },
      create: { ip, type, reason, addedBy },
    });
  } catch (err) {
    console.error('Error adding IP rule:', err);
    return null;
  }
};

export const removeIpRule = async (ip: string) => {
  try {
    return await prisma.ipRule.delete({ where: { ip } });
  } catch (err) {
    console.error('Error removing IP rule:', err);
    return null;
  }
};

export const forceLogoutUserSessions = async (userId: string, io?: Server) => {
  try {
    await prisma.userSession.updateMany({
      where: { userId },
      data: { isCurrentActive: false },
    });

    if (io) {
      const userRoom = `user_${userId}`;
      const userSockets = await io.in(userRoom).fetchSockets();
      for (const socket of userSockets) {
        socket.emit('force_logout', { message: 'Your session has been terminated by an administrator.' });
        socket.disconnect(true);
      }
    }
    return true;
  } catch (err) {
    console.error('Error force logging out user sessions:', err);
    return false;
  }
};

export const createApprovalRequest = async (actionType: string, requestedBy: string, targetId?: string, payload = {}) => {
  try {
    return await prisma.approvalRequest.create({
      data: {
        actionType,
        requestedBy,
        targetId,
        payload: JSON.stringify(payload),
        status: 'PENDING',
      },
    });
  } catch (err) {
    console.error('Error creating approval request:', err);
    return null;
  }
};

export const listApprovalRequests = async () => {
  try {
    const requests = await prisma.approvalRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => ({
      ...r,
      payload: r.payload ? JSON.parse(r.payload) : {},
    }));
  } catch (err) {
    console.error('Error listing approval requests:', err);
    return [];
  }
};

export const processApprovalRequest = async (id: string, approvedBy: string, status: 'APPROVED' | 'REJECTED') => {
  try {
    return await prisma.approvalRequest.update({
      where: { id },
      data: {
        status,
        approvedBy,
      },
    });
  } catch (err) {
    console.error('Error processing approval request:', err);
    return null;
  }
};
