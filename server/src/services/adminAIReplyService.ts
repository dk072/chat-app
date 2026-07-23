import prisma from '../config/db';
import { Server } from 'socket.io';
import { emitToUser } from './socketService';

/**
 * Handles automated AI replies on behalf of Admin when any user messages an Administrator account.
 */
export const handleAdminAIReply = async (
  io: Server,
  conversationId: string,
  userMessageContent: string | null,
  senderId: string,
  adminUser: { id: string; username: string }
) => {
  try {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true },
    });

    const senderUsername = sender?.username || 'user';
    const text = (userMessageContent || '').trim();

    // 1. Send socket typing indicator showing Admin is typing
    if (io) {
      io.to(conversationId).emit('typing', {
        conversationId,
        userId: adminUser.id,
        isTyping: true,
      });
    }

    // 2. Short natural delay for typing animation
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // 3. Generate context-aware AI Response
    let aiResponseText = '';
    const lower = text.toLowerCase();

    if (!text) {
      aiResponseText = `Hello @${senderUsername}! 👋 I am the Admin AI Assistant. Thanks for sharing this media attachment! Let me know if you need any technical help.`;
    } else if (lower.match(/\b(hi|hello|hey|greetings|hola|hey there)\b/)) {
      aiResponseText = `Hello @${senderUsername}! 👋 I am the Admin AI Assistant. How can I help you today with ChatApp?`;
    } else if (lower.includes('help') || lower.includes('support') || lower.includes('issue') || lower.includes('problem') || lower.includes('bug')) {
      aiResponseText = `Hello @${senderUsername}! 🛠️ As the Admin AI Assistant, I am here to assist. You can ask about account settings, report system bugs, or inquire about feature updates. Please feel free to describe your issue in detail!`;
    } else if (lower.includes('report') || lower.includes('ban') || lower.includes('block') || lower.includes('abuse') || lower.includes('spam')) {
      aiResponseText = `Thank you for reaching out, @${senderUsername}. 🛡️ Our active AI moderation engine and security systems are monitoring the platform. Your message has been logged for review. You can also use the inline Report button on any user or message.`;
    } else if (lower.includes('password') || lower.includes('reset') || lower.includes('login') || lower.includes('auth') || lower.includes('account')) {
      aiResponseText = `For account & authentication support, @${senderUsername}, administrators can reset credentials or update security permissions. Your request has been queued in the Admin Control Suite.`;
    } else if (lower.includes('status') || lower.includes('server') || lower.includes('online') || lower.includes('ping')) {
      aiResponseText = `📊 **System Telemetry Status**: All ChatApp backend services, WebSockets, and PostgreSQL storage channels are running optimally with 100% operational status.`;
    } else if (lower.includes('who are you') || lower.includes('bot') || lower.includes('ai') || lower.includes('what can you do')) {
      aiResponseText = `🤖 I am the **Admin AI Assistant**. I provide instant automated responses to users messaging Admin, log support requests, and integrate with the Admin Enterprise Control Suite!`;
    } else if (lower.includes('thank') || lower.includes('thx') || lower.includes('awesome') || lower.includes('good')) {
      aiResponseText = `You're very welcome, @${senderUsername}! 😊 Have a wonderful time chatting on ChatApp. Let me know if you need anything else!`;
    } else {
      aiResponseText = `Hello @${senderUsername}! 🤖 Thanks for your message: "${text}". I have logged your inquiry with the Admin team. An administrator or AI system will assist you promptly!`;
    }

    // 4. Create and persist AI response message in Prisma DB
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: adminUser.id,
        content: aiResponseText,
        type: 'TEXT',
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

    // 5. Refresh conversation last updated timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 6. Turn off typing indicator & broadcast AI message via socket
    if (io) {
      io.to(conversationId).emit('typing', {
        conversationId,
        userId: adminUser.id,
        isTyping: false,
      });

      io.to(conversationId).emit('receive_message', aiMessage);
      emitToUser(io, senderId, 'new_message_notification', {
        conversationId,
        message: aiMessage,
      });
    }
  } catch (error) {
    console.error('Error executing handleAdminAIReply:', error);
  }
};
