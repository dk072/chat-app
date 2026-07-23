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

// Persistent Settings Cache
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
    const existingStar = await prisma.starredItem.findUnique({
      where: {
        userId_messageId: { userId, messageId },
      },
    });

    let isStarred = false;

    if (existingStar) {
      await prisma.starredItem.delete({
        where: { id: existingStar.id },
      });
      isStarred = false;
    } else {
      await prisma.starredItem.create({
        data: { userId, messageId },
      });
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
    const starredItems = await prisma.starredItem.findMany({
      where: { userId },
    });
    const messageIds = starredItems.map((s) => s.messageId);

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
    const formattedOptions = options.map((opt: string) => ({ text: opt, votes: [] }));

    const createdPoll = await prisma.inChatPoll.create({
      data: {
        pollId,
        conversationId,
        question,
        options: JSON.stringify(formattedOptions),
        isAnonymous,
        createdBy: userId,
      },
    });

    const pollData = {
      id: createdPoll.pollId,
      question: createdPoll.question,
      options: JSON.parse(createdPoll.options),
      isAnonymous: createdPoll.isAnonymous,
      createdBy: createdPoll.createdBy,
    };

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
    const dbPoll = await prisma.inChatPoll.findUnique({
      where: { pollId },
    });

    if (!dbPoll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    const optionsList: { text: string; votes: string[] }[] = JSON.parse(dbPoll.options);

    // Remove user previous vote from all options
    optionsList.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v !== userId);
    });

    // Add vote to target option
    if (optionsList[optionIndex]) {
      optionsList[optionIndex].votes.push(userId);
    }

    const updatedPoll = await prisma.inChatPoll.update({
      where: { id: dbPoll.id },
      data: { options: JSON.stringify(optionsList) },
    });

    const pollData = {
      id: updatedPoll.pollId,
      question: updatedPoll.question,
      options: JSON.parse(updatedPoll.options),
      isAnonymous: updatedPoll.isAnonymous,
      createdBy: updatedPoll.createdBy,
    };

    const io = req.app.get('io');
    if (io && conversationId) {
      io.to(conversationId).emit('poll_updated', pollData);
    }

    return res.json({ poll: pollData });
  } catch (error) {
    return res.status(500).json({ message: 'Error recording poll vote.' });
  }
};

export const getPollHandler = async (req: Request, res: Response) => {
  const { pollId } = req.params;
  try {
    const dbPoll = await prisma.inChatPoll.findUnique({
      where: { pollId },
    });
    if (!dbPoll) return res.status(404).json({ message: 'Poll not found.' });
    
    return res.json({
      poll: {
        id: dbPoll.pollId,
        question: dbPoll.question,
        options: JSON.parse(dbPoll.options),
        isAnonymous: dbPoll.isAnonymous,
        createdBy: dbPoll.createdBy,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving poll.' });
  }
};

export const createStoryHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user!;
  const { text, bgGradient = 'from-indigo-600 to-purple-600', mediaUrl } = req.body;

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    const createdStory = await prisma.userStory.create({
      data: {
        userId: user.id,
        username: dbUser?.username || user.username,
        profilePicture: dbUser?.profilePicture || '',
        text,
        mediaUrl,
        bgGradient,
        views: JSON.stringify([]),
      },
    });

    const storyData = {
      id: createdStory.id,
      userId: createdStory.userId,
      username: createdStory.username,
      profilePicture: createdStory.profilePicture || '',
      text: createdStory.text,
      mediaUrl: createdStory.mediaUrl,
      bgGradient: createdStory.bgGradient,
      views: [],
      createdAt: createdStory.createdAt.toISOString(),
    };

    const io = req.app.get('io');
    if (io) {
      io.emit('new_story_posted', storyData);
    }

    return res.status(201).json({ story: storyData });
  } catch (error) {
    return res.status(500).json({ message: 'Error posting story.' });
  }
};

export const getStoriesHandler = async (req: Request, res: Response) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dbStories = await prisma.userStory.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeStories = dbStories.map((s) => ({
      id: s.id,
      userId: s.userId,
      username: s.username,
      profilePicture: s.profilePicture || '',
      text: s.text,
      mediaUrl: s.mediaUrl,
      bgGradient: s.bgGradient,
      views: JSON.parse(s.views || '[]'),
      createdAt: s.createdAt.toISOString(),
    }));

    return res.json({ stories: activeStories });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching status updates.' });
  }
};

export const recordStoryViewHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { storyId } = req.params;

  try {
    const dbStory = await prisma.userStory.findUnique({
      where: { id: storyId },
    });

    if (dbStory) {
      const viewsList: string[] = JSON.parse(dbStory.views || '[]');
      if (!viewsList.includes(userId)) {
        viewsList.push(userId);
        await prisma.userStory.update({
          where: { id: storyId },
          data: { views: JSON.stringify(viewsList) },
        });
      }
      return res.json({ viewsCount: viewsList.length, views: viewsList });
    }
    return res.status(404).json({ message: 'Story not found.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error recording story view.' });
  }
};

export const deleteStoryHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.id;
  const { storyId } = req.params;

  try {
    const dbStory = await prisma.userStory.findUnique({
      where: { id: storyId },
    });

    if (!dbStory) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    if (dbStory.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this story.' });
    }

    await prisma.userStory.delete({
      where: { id: storyId },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('story_deleted', { storyId });
    }

    return res.json({ message: 'Story deleted successfully.', storyId });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting story.' });
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
