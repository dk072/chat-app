import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { uploadMedia, deleteMedia } from '../services/cloudinaryService';
import { emitToUser } from '../services/socketService';

/**
 * Retrieves a user's active conversations, enriched with the last message, 
 * unread badges, pinning configurations, and companion profiles.
 */
export const getConversations = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: { id: true, username: true, profilePicture: true, isOnline: true, lastSeen: true },
        },
        user2: {
          select: { id: true, username: true, profilePicture: true, isOnline: true, lastSeen: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        pinnedChats: {
          where: { userId },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Batch query to get all unread message counts in a single query
    const unreadCountsData = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversations.map(c => c.id) },
        senderId: { not: userId },
        isSeen: false,
        isDeletedForEveryone: false,
        NOT: {
          deletedForUsers: { contains: `,${userId},` },
        },
      },
      _count: {
        id: true,
      },
    });

    const unreadCountsMap = new Map();
    for (const data of unreadCountsData) {
      unreadCountsMap.set(data.conversationId, data._count.id);
    }

    const formatted = conversations.map((c) => {
      const partner = c.user1Id === userId ? c.user2 : c.user1;
      const lastMsg = c.messages[0] || null;
      const isPinned = c.pinnedChats.length > 0;

      // Skip listing if user deleted all messages or hasn't chatted, but keep conversation record
      // Filter out if last message is deleted locally for the user
      const lastMsgDeletedLocally = lastMsg ? lastMsg.deletedForUsers.includes(`,${userId},`) : false;

      const unreadCount = unreadCountsMap.get(c.id) || 0;

      return {
        id: c.id,
        partner,
        lastMessage: lastMsgDeletedLocally ? null : lastMsg,
        unreadCount,
        isPinned,
        updatedAt: c.updatedAt,
      };
    });

    // Sort pinned conversations to the top, then sort by last update time
    formatted.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return res.json({ conversations: formatted });
  } catch (error) {
    console.error('Get conversations controller error:', error);
    return res.status(500).json({ message: 'Internal server error fetching conversations.' });
  }
};

/**
 * Creates or retrieves an existing 1-to-1 conversation between the logged-in user and a partner.
 */
export const createConversation = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const currentUserId = authReq.user!.id;
  const { partnerId } = req.body;

  if (!partnerId) {
    return res.status(400).json({ message: 'Partner ID is required.' });
  }

  if (currentUserId === partnerId) {
    return res.status(400).json({ message: 'You cannot open a conversation with yourself.' });
  }

  try {
    const partner = await prisma.user.findUnique({ where: { id: partnerId } });
    if (!partner || partner.isBanned) {
      return res.status(404).json({ message: 'Chat partner not found or is suspended.' });
    }

    // Force unique ordering for user1Id < user2Id to maintain single 1-to-1 rooms
    const [u1Id, u2Id] = currentUserId < partnerId ? [currentUserId, partnerId] : [partnerId, currentUserId];

    let conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: { user1Id: u1Id, user2Id: u2Id },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user1Id: u1Id, user2Id: u2Id },
      });
    }

    return res.status(201).json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Create conversation controller error:', error);
    return res.status(500).json({ message: 'Internal server error initializing conversation.' });
  }
};

/**
 * Retrieves historical messages in a room with cursor-based pagination for infinite scroll.
 */
export const getMessages = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { conversationId } = req.params;
  const { limit = '25', cursor } = req.query;

  const pageSize = parseInt(limit as string, 10);

  try {
    // Authenticate participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({ message: 'Unauthorized. You are not a member of this chat.' });
    }

    // Fetch messages excluding those that have been marked as "deleted for me"
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        NOT: {
          deletedForUsers: { contains: `,${userId},` },
        },
      },
      take: pageSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor as string } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        parentMessage: {
          select: { id: true, content: true, type: true, senderId: true },
        },
        sender: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
    });

    // Return nextCursor for client state
    const nextCursor = messages.length === pageSize ? messages[messages.length - 1].id : null;

    // Return in chronological order for UI ease
    return res.json({
      messages: messages.reverse(),
      nextCursor,
    });
  } catch (error) {
    console.error('Get messages controller error:', error);
    return res.status(500).json({ message: 'Internal server error retrieving messages.' });
  }
};

/**
 * Creates and dispatches a new message. Emits Socket payloads to online users.
 */
export const sendMessage = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const senderId = authReq.user!.id;
  const { conversationId, content, type = 'TEXT', parentId } = req.body;
  const io = req.app.get('io');

  if (!conversationId) {
    return res.status(400).json({ message: 'Conversation ID is required.' });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      return res.status(403).json({ message: 'You are not a participant in this conversation.' });
    }

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;
    let filePublicId: string | undefined;

    // Process file uploading if present in request
    if (req.file) {
      const file = req.file;
      fileName = file.originalname;
      fileSize = file.size;

      let folder = 'files';
      let rType: 'image' | 'video' | 'raw' | 'auto' = 'auto';

      if (file.mimetype.startsWith('image/')) {
        folder = 'images';
        rType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        folder = 'videos';
        rType = 'video';
      } else if (file.mimetype.startsWith('audio/')) {
        folder = 'voice';
        rType = 'video'; // Cloudinary treats audio uploads as video resources
      } else if (file.mimetype === 'application/pdf') {
        folder = 'pdfs';
        rType = 'raw';
      } else {
        rType = 'raw';
      }

      const uploadResult = await uploadMedia(file.path, folder, rType);
      fileUrl = uploadResult.url;
      filePublicId = uploadResult.publicId;
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content || null,
        type,
        fileUrl,
        fileName,
        fileSize,
        filePublicId,
        parentId: parentId || null,
      },
      include: {
        parentMessage: {
          select: { id: true, content: true, type: true, senderId: true },
        },
        sender: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
    });

    // Update conversation activity timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Broadcast message to room
    io.to(conversationId).emit('receive_message', message);

    // Notify partner to trigger browser notifications / unread updates
    const partnerId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;
    emitToUser(io, partnerId, 'new_message_notification', {
      conversationId,
      message,
    });

    return res.status(201).json({ message });
  } catch (error) {
    console.error('Send message controller error:', error);
    return res.status(500).json({ message: 'Internal server error dispatching message.' });
  }
};

/**
 * Modifies text content of an existing message. Broadcasts socket update.
 */
export const editMessage = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { id } = req.params;
  const { content } = req.body;
  const io = req.app.get('io');

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Message content cannot be blank.' });
  }

  try {
    const msg = await prisma.message.findUnique({ where: { id } });

    if (!msg) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (msg.senderId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own messages.' });
    }

    if (msg.type !== 'TEXT') {
      return res.status(400).json({ message: 'Only text messages can be modified.' });
    }

    if (msg.isDeletedForEveryone) {
      return res.status(400).json({ message: 'Cannot edit deleted messages.' });
    }

    const updatedMsg = await prisma.message.update({
      where: { id },
      data: {
        content,
        isEdited: true,
      },
      include: {
        parentMessage: {
          select: { id: true, content: true, type: true, senderId: true },
        },
        sender: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
    });

    io.to(msg.conversationId).emit('message_updated', updatedMsg);

    return res.json({ message: updatedMsg });
  } catch (error) {
    console.error('Edit message controller error:', error);
    return res.status(500).json({ message: 'Internal server error updating message.' });
  }
};

/**
 * Deletes a message (Delete for me vs. Delete for everyone).
 */
export const deleteMessage = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { id } = req.params;
  const { deleteForEveryone = false } = req.body;
  const io = req.app.get('io');

  try {
    const msg = await prisma.message.findUnique({ where: { id } });

    if (!msg) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (deleteForEveryone) {
      if (msg.senderId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own messages for everyone.' });
      }

      // Perform Cloudinary/Local asset cleanup if it had a file attachment
      if (msg.filePublicId) {
        let rType: 'image' | 'video' | 'raw' = 'raw';
        if (msg.type === 'IMAGE') rType = 'image';
        if (msg.type === 'VIDEO' || msg.type === 'VOICE') rType = 'video';
        await deleteMedia(msg.filePublicId, rType);
      }

      // Redact message metadata in DB
      const updatedMsg = await prisma.message.update({
        where: { id },
        data: {
          content: 'This message was deleted.',
          fileUrl: null,
          fileName: null,
          fileSize: null,
          filePublicId: null,
          isDeletedForEveryone: true,
        },
        include: {
          parentMessage: {
            select: { id: true, content: true, type: true, senderId: true },
          },
          sender: {
            select: { id: true, username: true, profilePicture: true },
          },
        },
      });

      io.to(msg.conversationId).emit('message_updated', updatedMsg);
    } else {
      // Delete for me: Add user ID to string list (e.g. ,id1,id2,) for SQLite compatibility
      const formattedUserId = `,${userId},`;
      if (msg.deletedForUsers.includes(formattedUserId)) {
        return res.json({ message: 'Message already deleted for you.' });
      }

      const updatedDeletedForUsers = msg.deletedForUsers === '' 
        ? formattedUserId 
        : msg.deletedForUsers + `${userId},`;

      const updatedMsg = await prisma.message.update({
        where: { id },
        data: {
          deletedForUsers: updatedDeletedForUsers,
        },
      });
    }

    return res.json({ message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Delete message controller error:', error);
    return res.status(500).json({ message: 'Internal server error deleting message.' });
  }
};

/**
 * Handles adding/removing reactions to a message (JSON storage).
 */
export const reactToMessage = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { id } = req.params;
  const { emoji } = req.body; // Set empty to remove reaction
  const io = req.app.get('io');

  try {
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    let currentReactions: Record<string, string> = {};
    try {
      currentReactions = JSON.parse(msg.reactions || '{}');
    } catch (e) {
      currentReactions = {};
    }

    if (!emoji) {
      // Remove reaction
      delete currentReactions[userId];
    } else {
      // Add or update reaction
      currentReactions[userId] = emoji;
    }

    const updatedMsg = await prisma.message.update({
      where: { id },
      data: {
        reactions: JSON.stringify(currentReactions),
      },
      include: {
        parentMessage: {
          select: { id: true, content: true, type: true, senderId: true },
        },
        sender: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
    });

    io.to(msg.conversationId).emit('message_updated', updatedMsg);

    return res.json({ message: updatedMsg });
  } catch (error) {
    console.error('React message controller error:', error);
    return res.status(500).json({ message: 'Internal server error adding reaction.' });
  }
};

/**
 * Flags all messages in a conversation sent by partner as seen.
 */
export const markAsSeen = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { conversationId } = req.params;
  const io = req.app.get('io');

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isSeen: false,
      },
      data: {
        isSeen: true,
        isDelivered: true,
      },
    });

    // Notify the other user's active sockets
    const partnerId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
    emitToUser(io, partnerId, 'messages_seen', { conversationId });

    return res.json({ message: 'Conversation marked as read.' });
  } catch (error) {
    console.error('Mark as seen controller error:', error);
    return res.status(500).json({ message: 'Internal server error marking messages as read.' });
  }
};

/**
 * Puts conversation on/off pinned list for the user.
 */
export const togglePinConversation = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { conversationId } = req.params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const existingPin = await prisma.pinnedChat.findUnique({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    });

    if (existingPin) {
      await prisma.pinnedChat.delete({
        where: { id: existingPin.id },
      });
      return res.json({ message: 'Conversation unpinned successfully.', isPinned: false });
    } else {
      await prisma.pinnedChat.create({
        data: { userId, conversationId },
      });
      return res.json({ message: 'Conversation pinned successfully.', isPinned: true });
    }
  } catch (error) {
    console.error('Pin conversation controller error:', error);
    return res.status(500).json({ message: 'Internal server error toggling chat pin.' });
  }
};

/**
 * Clears message history in a conversation for the requesting user ("Delete Chat / Clear History").
 */
export const deleteConversation = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { conversationId } = req.params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
    });

    const formattedUserId = `,${userId},`;

    await Promise.all(
      messages.map((m) => {
        if (!m.deletedForUsers.includes(formattedUserId)) {
          const updatedDeletedForUsers = m.deletedForUsers === '' ? formattedUserId : m.deletedForUsers + `${userId},`;
          return prisma.message.update({
            where: { id: m.id },
            data: { deletedForUsers: updatedDeletedForUsers },
          });
        }
        return Promise.resolve();
      })
    );

    return res.json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    return res.status(500).json({ message: 'Internal server error clearing chat history.' });
  }
};

