import { Request, Response } from 'express';
import prisma from '../config/db';
import { improveTextTone, translateTextContent, summarizeConversationHistory } from '../services/aiAssistantService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

// In-Memory Storage for Next-Gen dynamic features (Stories, Polls, Starred Messages, Disappearing Timers)
const starredMessagesMap = new Map<string, Set<string>>(); // userId -> Set<messageId>
const pollStore = new Map<string, { id: string; question: string; options: { text: string; votes: string[] }[]; isAnonymous: boolean; createdBy: string }>();
const storiesStore: { id: string; userId: string; username: string; profilePicture: string; mediaUrl?: string; text?: string; bgGradient: string; views: string[]; createdAt: string }[] = [];
const disappearingTimersMap = new Map<string, number>(); // conversationId -> timerHours

export const improveTextHandler = async (req: Request, res: Response) => {
  const { text, tone = 'PROFESSIONAL' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ message: 'Valid text is required for AI writing assistant.' });
  }

  try {
    const result = improveTextTone(text, tone);
    return res.json({ result });
  } catch (error) {
    return res.status(500).json({ message: 'Error performing AI text improvement.' });
  }
};

export const translateTextHandler = async (req: Request, res: Response) => {
  const { text, targetLanguage = 'es' } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Text is required for translation.' });
  }

  try {
    const result = translateTextContent(text, targetLanguage);
    return res.json({ result });
  } catch (error) {
    return res.status(500).json({ message: 'Error translating text.' });
  }
};

export const summarizeChatHandler = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId, isDeletedForEveryone: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { sender: { select: { username: true } } },
    });

    const formattedMsgs = messages.reverse().map((m) => ({
      sender: m.sender.username,
      text: m.content || `[${m.type}]`,
    }));

    const result = summarizeConversationHistory(formattedMsgs);
    return res.json({ summaryResult: result });
  } catch (error) {
    return res.status(500).json({ message: 'Error summarizing chat conversation.' });
  }
};

export const toggleStarMessageHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { messageId } = req.params;

  try {
    if (!starredMessagesMap.has(userId)) {
      starredMessagesMap.set(userId, new Set());
    }

    const userStars = starredMessagesMap.get(userId)!;
    let isStarred = false;

    if (userStars.has(messageId)) {
      userStars.delete(messageId);
      isStarred = false;
    } else {
      userStars.add(messageId);
      isStarred = true;
    }

    return res.json({ isStarred, messageId });
  } catch (error) {
    return res.status(500).json({ message: 'Error toggling star message.' });
  }
};

export const getStarredMessagesHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;

  try {
    const userStars = starredMessagesMap.get(userId) || new Set();
    const messageIds = Array.from(userStars);

    const messages = await prisma.message.findMany({
      where: { id: { in: messageIds }, isDeletedForEveryone: false },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ starredMessages: messages });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching starred messages.' });
  }
};

export const createPollHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { conversationId, question, options, isAnonymous = false } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ message: 'Question and at least 2 options are required.' });
  }

  try {
    const pollId = `poll_${Date.now()}`;
    const pollData = {
      id: pollId,
      question,
      options: options.map((opt: string) => ({ text: opt, votes: [] })),
      isAnonymous,
      createdBy: userId,
    };

    pollStore.set(pollId, pollData);

    // Save as a SPECIAL POLL message in conversation
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: JSON.stringify({ pollId, question, isAnonymous }),
        type: 'FILE', // Handled customly in UI
        fileName: `POLL:${pollId}`,
      },
      include: {
        sender: { select: { id: true, username: true, profilePicture: true } },
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('receive_message', message);
      io.to(conversationId).emit('poll_updated', pollData);
    }

    return res.status(201).json({ poll: pollData, message });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating poll.' });
  }
};

export const votePollHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { pollId } = req.params;
  const { optionIndex, conversationId } = req.body;

  try {
    const poll = pollStore.get(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    // Remove user previous vote from all options
    poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v !== userId);
    });

    // Add vote to target option
    if (poll.options[optionIndex]) {
      poll.options[optionIndex].votes.push(userId);
    }

    pollStore.set(pollId, poll);

    const io = req.app.get('io');
    if (io && conversationId) {
      io.to(conversationId).emit('poll_updated', poll);
    }

    return res.json({ poll });
  } catch (error) {
    return res.status(500).json({ message: 'Error recording poll vote.' });
  }
};

export const getPollHandler = async (req: Request, res: Response) => {
  const { pollId } = req.params;
  const poll = pollStore.get(pollId);
  if (!poll) return res.status(404).json({ message: 'Poll not found.' });
  return res.json({ poll });
};

export const createStoryHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user!;
  const { text, bgGradient = 'from-indigo-600 to-purple-600', mediaUrl } = req.body;

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    const story = {
      id: `story_${Date.now()}`,
      userId: user.id,
      username: dbUser?.username || user.username,
      profilePicture: dbUser?.profilePicture || '',
      text,
      mediaUrl,
      bgGradient,
      views: [],
      createdAt: new Date().toISOString(),
    };

    storiesStore.unshift(story);

    const io = req.app.get('io');
    if (io) {
      io.emit('new_story_posted', story);
    }

    return res.status(201).json({ story });
  } catch (error) {
    return res.status(500).json({ message: 'Error posting story.' });
  }
};

export const getStoriesHandler = async (req: Request, res: Response) => {
  // Filter stories younger than 24 hours
  const now = Date.now();
  const activeStories = storiesStore.filter(
    (s) => now - new Date(s.createdAt).getTime() < 24 * 60 * 60 * 1000
  );
  return res.json({ stories: activeStories });
};

export const recordStoryViewHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { storyId } = req.params;

  try {
    const story = storiesStore.find((s) => s.id === storyId);
    if (story) {
      if (!story.views.includes(userId)) {
        story.views.push(userId);
      }
      return res.json({ viewsCount: story.views.length, views: story.views });
    }
    return res.status(404).json({ message: 'Story not found.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error recording story view.' });
  }
};

export const setDisappearingTimerHandler = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { timerHours = 24 } = req.body;

  try {
    disappearingTimersMap.set(conversationId, timerHours);
    return res.json({ message: `Disappearing timer set to ${timerHours} hours.`, timerHours });
  } catch (error) {
    return res.status(500).json({ message: 'Error setting disappearing messages timer.' });
  }
};
