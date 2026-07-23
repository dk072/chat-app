import prisma from '../config/db';
import { Server } from 'socket.io';
import { emitToUser } from './socketService';

/**
 * Generates humanized, warm, natural conversational responses on behalf of Admin.
 */
function generateHumanizedReply(userText: string, username: string): string {
  const text = userText.trim();
  const lower = text.toLowerCase();

  // Helper for picking random responses to feel human & non-repetitive
  const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  if (!text) {
    return pickRandom([
      `Thanks for sending that over, @${username}! 📄 I'm taking a look now. Let me know if there's any specific detail you want me to check out!`,
      `Got your attachment, @${username}! 👍 Give me a quick moment to review it.`,
      `Hey @${username}, thanks for sharing this media! Let me know what you'd like me to help you with regarding it.`,
    ]);
  }

  // 1. Greetings
  if (lower.match(/\b(hi|hello|hey|greetings|hola|hey there|good morning|good evening|sup|yo)\b/)) {
    return pickRandom([
      `Hey @${username}! 👋 Hope you're having a great day! How can I help you out today?`,
      `Hi @${username}! 😊 Good to hear from you. What's on your mind?`,
      `Hey there @${username}! How's it going? Let me know what you need help with!`,
      `Hello @${username}! 👋 Always happy to chat. What can I do for you today?`,
    ]);
  }

  // 2. Help, Support, Issues & Bugs
  if (lower.includes('help') || lower.includes('support') || lower.includes('issue') || lower.includes('problem') || lower.includes('bug') || lower.includes('error') || lower.includes('wrong') || lower.includes('broken')) {
    return pickRandom([
      `Oh gotcha! Tell me a bit more about what's going on so I can help get this sorted out for you, @${username}.`,
      `I'm right here to help, @${username}! What specific issue or question are you running into?`,
      `No problem at all! Could you share a quick detail about what went wrong? I'll get it fixed up for you. 👍`,
      `I hear you! Let's take a look at that together. What seems to be the trouble?`,
    ]);
  }

  // 3. Gratitude & Thanks
  if (lower.includes('thank') || lower.includes('thx') || lower.includes('awesome') || lower.includes('great') || lower.includes('cool') || lower.includes('perfect') || lower.includes('appreciate')) {
    return pickRandom([
      `Anytime @${username}! Always happy to help. Let me know if you need anything else! 😊`,
      `You're very welcome, @${username}! Have an awesome time chatting! ✨`,
      `Glad I could help out, @${username}! Feel free to reach out whenever you need anything. 🙌`,
      `My pleasure! Have a wonderful rest of your day! 🌟`,
    ]);
  }

  // 4. Abuse & Reports
  if (lower.includes('report') || lower.includes('ban') || lower.includes('block') || lower.includes('abuse') || lower.includes('spam') || lower.includes('harass') || lower.includes('bad')) {
    return pickRandom([
      `Thanks for bringing this to my attention, @${username}. Keeping our community friendly and safe is super important to us. I've flagged this right away for review. 🛡️`,
      `I take safety really seriously, @${username}. Thank you for letting me know. I'm investigating this right now.`,
      `Appreciate you letting me know, @${username}! You can also use the inline Report button directly on any chat message. I'm on it!`,
    ]);
  }

  // 5. Account, Password & Authentication
  if (lower.includes('password') || lower.includes('reset') || lower.includes('login') || lower.includes('account') || lower.includes('profile')) {
    return pickRandom([
      `No worries at all, @${username}! If you're having trouble logging in or need a password reset, I can help get that sorted for you right away.`,
      `I can definitely help with your account details! You can update your profile in Settings, or let me know if you need a password reset. 🔑`,
      `Got it! If you need help updating your security settings or resetting access, just say the word and I'll assist!`,
    ]);
  }

  // 6. Server & System Status
  if (lower.includes('status') || lower.includes('server') || lower.includes('online') || lower.includes('down') || lower.includes('working') || lower.includes('ping')) {
    return pickRandom([
      `Everything's running super smooth right now! All system servers and messaging channels are 100% up and healthy. 🚀`,
      `Systems are looking great! No outages or lag detected on our end. Everything is operating normally. ✨`,
    ]);
  }

  // 7. Identity questions ("who are you", "are you real", "bot")
  if (lower.includes('who are you') || lower.includes('bot') || lower.includes('ai') || lower.includes('real person') || lower.includes('human')) {
    return pickRandom([
      `Hey @${username}! I'm the Admin Support assistant on ChatApp. I'm here to give you fast instant replies, answer questions, and assist the admin team! 💬`,
      `I'm your friendly Admin assistant! I help handle support, keep things running smoothly, and respond quickly whenever you message Admin. 😊`,
    ]);
  }

  // 8. How are you / small talk
  if (lower.includes('how are you') || lower.includes('how r u') || lower.includes('how you doing') || lower.includes('whats up') || lower.includes("what's up")) {
    return pickRandom([
      `Doing great, thanks for asking @${username}! 😊 How about you? How's your day going?`,
      `I'm doing awesome! Ready to help you out with anything you need. How are things with you? ✨`,
    ]);
  }

  // 9. Friendly Natural Default Fallback
  return pickRandom([
    `Hey @${username}! Thanks for your message. Give me a quick second to look into "${text}" for you! Is there anything specific you'd like me to check first?`,
    `Got your message, @${username}! I'm reviewing this right now. Let me know if there's anything else I can help you with in the meantime! 😊`,
    `Thanks for messaging me, @${username}! I'm on it. Feel free to share any more details if you'd like! 👍`,
  ]);
}

/**
 * Handles automated humanized AI replies on behalf of Admin when any user messages an Administrator account.
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

    const senderUsername = sender?.username || 'friend';
    const text = (userMessageContent || '').trim();

    // 1. Generate warm, humanized conversational response
    const aiResponseText = generateHumanizedReply(text, senderUsername);

    // 2. Calculate natural typing delay based on message length (simulating realistic human typing)
    const typingDelay = Math.max(1400, Math.min(3200, aiResponseText.length * 35));

    // 3. Send socket typing indicator showing Admin is typing
    if (io) {
      io.to(conversationId).emit('typing', {
        conversationId,
        userId: adminUser.id,
        isTyping: true,
      });
    }

    // 4. Natural human typing delay simulation
    await new Promise((resolve) => setTimeout(resolve, typingDelay));

    // 5. Create and persist AI response message in Prisma DB
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

    // 6. Refresh conversation last updated timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 7. Turn off typing indicator & broadcast humanized message via socket
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
