import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/db';

// Maps User IDs to sets of active Socket IDs (supporting multiple browser tabs per user)
const activeConnections = new Map<string, Set<string>>();

export const initializeSocket = (io: Server) => {
  // Middleware: Authenticate socket handshake using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: Token required.'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Token invalid.'));
    }

    socket.data.userId = decoded.userId;
    next();
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    if (!userId) return;

    // Register socket connection
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, new Set());
    }
    activeConnections.get(userId)!.add(socket.id);

    console.log(`Socket connected: ${socket.id} (User ID: ${userId})`);

    // Flag user as online in DB and broadcast status
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
        select: { id: true, username: true, isOnline: true, lastSeen: true },
      });

      io.emit('user_status', {
        userId: user.id,
        isOnline: true,
        lastSeen: user.lastSeen.toISOString(),
      });
    } catch (err) {
      console.error('Socket connection status update failed:', err);
    }

    // Join conversation rooms for isolated broadcasting
    socket.on('join_room', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${userId} joined room: ${conversationId}`);
    });

    socket.on('leave_room', (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`User ${userId} left room: ${conversationId}`);
    });

    // Real-time typing indicators
    socket.on('typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      socket.to(conversationId).emit('typing', {
        conversationId,
        userId,
        isTyping,
      });
    });

    // =======================
    // WebRTC Calling System
    // =======================

    // Helper to send to a specific user's active sockets
    const emitToPartner = (partnerId: string, event: string, payload: any) => {
      const partnerSockets = activeConnections.get(partnerId);
      if (partnerSockets) {
        partnerSockets.forEach((sid) => io.to(sid).emit(event, payload));
      }
    };

    socket.on('call:start', async (data: { receiverId: string, callType: 'VOICE' | 'VIDEO', conversationId: string }) => {
      const { receiverId, callType, conversationId } = data;
      
      const receiverSockets = activeConnections.get(receiverId);
      if (!receiverSockets || receiverSockets.size === 0) {
        // Receiver is offline -> Missed Call
        try {
          await prisma.call.create({
            data: {
              callerId: userId,
              receiverId,
              callType,
              status: 'MISSED',
              conversationId
            }
          });
          socket.emit('call:missed', { reason: 'User is offline' });
        } catch (e) {
          console.error('Failed to log missed call', e);
        }
        return;
      }

      // Notify caller that it's ringing
      socket.emit('call:ringing', { receiverId });

      // Get caller details to send to receiver
      try {
        const caller = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, profilePicture: true }
        });

        // Notify receiver
        emitToPartner(receiverId, 'call:incoming', {
          caller,
          callType,
          conversationId
        });
      } catch (e) {
        console.error('Call start error', e);
      }
    });

    socket.on('call:accept', async (data: { callerId: string, callType: 'VOICE' | 'VIDEO', conversationId: string }) => {
      const { callerId, callType, conversationId } = data;
      
      try {
        // Create call record (In Progress/Completed)
        const callRecord = await prisma.call.create({
          data: {
            callerId,
            receiverId: userId,
            callType,
            status: 'COMPLETED',
            conversationId
          }
        });

        emitToPartner(callerId, 'call:accepted', {
          receiverId: userId,
          callId: callRecord.id
        });
      } catch (e) {
        console.error('Call accept error', e);
      }
    });

    socket.on('call:reject', async (data: { callerId: string, callType: 'VOICE' | 'VIDEO', conversationId: string }) => {
      const { callerId, callType, conversationId } = data;
      
      try {
        await prisma.call.create({
          data: {
            callerId,
            receiverId: userId,
            callType,
            status: 'REJECTED',
            conversationId
          }
        });
        emitToPartner(callerId, 'call:rejected', { receiverId: userId });
      } catch (e) {
        console.error('Call reject error', e);
      }
    });

    socket.on('call:end', async (data: { callId: string, partnerId: string, duration: number }) => {
      const { callId, partnerId, duration } = data;
      
      try {
        await prisma.call.update({
          where: { id: callId },
          data: {
            duration,
            endedAt: new Date()
          }
        });
        emitToPartner(partnerId, 'call:ended', { callId });
      } catch (e) {
        console.error('Call end error', e);
      }
    });

    socket.on('call:offer', (data: { targetId: string, offer: any }) => {
      emitToPartner(data.targetId, 'call:offer', {
        callerId: userId,
        offer: data.offer
      });
    });

    socket.on('call:answer', (data: { targetId: string, answer: any }) => {
      emitToPartner(data.targetId, 'call:answer', {
        receiverId: userId,
        answer: data.answer
      });
    });

    socket.on('call:iceCandidate', (data: { targetId: string, candidate: any }) => {
      emitToPartner(data.targetId, 'call:iceCandidate', {
        senderId: userId,
        candidate: data.candidate
      });
    });

    // Clean up connections on socket disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      const socketSet = activeConnections.get(userId);
      if (socketSet) {
        socketSet.delete(socket.id);
        
        // If all tabs/sockets of this user are closed
        if (socketSet.size === 0) {
          activeConnections.delete(userId);
          
          try {
            const lastSeen = new Date();
            await prisma.user.update({
              where: { id: userId },
              data: { isOnline: false, lastSeen },
            });

            // Broadcast offline state with lastSeen timestamp
            io.emit('user_status', {
              userId,
              isOnline: false,
              lastSeen: lastSeen.toISOString(),
            });
          } catch (err) {
            console.error('Socket disconnect status update failed:', err);
          }
        }
      }
    });
  });
};

/**
 * Sends a real-time event directly to a user's active sockets
 */
export const emitToUser = (io: Server, userId: string, eventName: string, payload: any) => {
  const socketSet = activeConnections.get(userId);
  if (socketSet) {
    socketSet.forEach((socketId) => {
      io.to(socketId).emit(eventName, payload);
    });
  }
};

/**
 * Returns the current map of active connections
 */
export const getActiveConnections = () => activeConnections;
