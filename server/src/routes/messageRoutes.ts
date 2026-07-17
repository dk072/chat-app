import { Router } from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
  markAsSeen,
  togglePinConversation,
} from '../controllers/messageController';
import { protect } from '../middlewares/authMiddleware';
import { upload, validateUpload } from '../middlewares/uploadMiddleware';
import { apiLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(protect);
router.use(apiLimiter);

// Conversation management
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.post('/conversations/:conversationId/seen', markAsSeen);
router.post('/conversations/:conversationId/pin', togglePinConversation);

// Message listings & dispatch
router.get('/:conversationId', getMessages);
router.post('/send', upload.single('file'), (req, res, next) => {
  if (req.file) {
    const mime = req.file.mimetype;
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif',
      // Videos
      'video/mp4', 'video/quicktime', 'video/mpeg',
      // Audio/Voice notes
      'audio/webm', 'audio/ogg', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/x-m4a', 'audio/3gpp',
      // Documents
      'application/pdf',
    ];

    let maxBytes = 20 * 1024 * 1024; // 20MB standard cap

    if (mime.startsWith('image/')) {
      maxBytes = 10 * 1024 * 1024; // 10MB for images
    } else if (mime.startsWith('video/')) {
      maxBytes = 50 * 1024 * 1024; // 50MB for videos
    } else if (mime.startsWith('audio/')) {
      maxBytes = 10 * 1024 * 1024; // 10MB for audio voice recordings
    } else if (mime === 'application/pdf') {
      maxBytes = 25 * 1024 * 1024; // 25MB for PDFs
    }

    return validateUpload(allowedTypes, maxBytes)(req, res, next);
  }
  next();
}, sendMessage);

// Message edits & reactions
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/react', reactToMessage);

export default router;
