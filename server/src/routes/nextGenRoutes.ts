import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { apiLimiter } from '../middlewares/rateLimiter';
import {
  improveTextHandler,
  translateTextHandler,
  summarizeChatHandler,
  toggleStarMessageHandler,
  getStarredMessagesHandler,
  createPollHandler,
  votePollHandler,
  getPollHandler,
  createStoryHandler,
  getStoriesHandler,
  recordStoryViewHandler,
  setDisappearingTimerHandler,
} from '../controllers/nextGenController';

const router = Router();

router.use(protect);
router.use(apiLimiter);

// AI Assistant Features
router.post('/ai/improve-text', improveTextHandler);
router.post('/ai/translate', translateTextHandler);
router.get('/ai/summarize/:conversationId', summarizeChatHandler);

// Starred Messages
router.post('/messages/:messageId/star', toggleStarMessageHandler);
router.get('/messages/starred', getStarredMessagesHandler);

// Interactive In-Chat Polls
router.post('/polls/create', createPollHandler);
router.post('/polls/:pollId/vote', votePollHandler);
router.get('/polls/:pollId', getPollHandler);

// User Stories & Status Updates
router.post('/stories', createStoryHandler);
router.get('/stories', getStoriesHandler);
router.post('/stories/:storyId/view', recordStoryViewHandler);

// Disappearing Chats Settings
router.post('/disappearing-timer/:conversationId', setDisappearingTimerHandler);

export default router;
