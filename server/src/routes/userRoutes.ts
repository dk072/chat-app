import { Router } from 'express';
import { searchUsers, updateProfile, getUserProfile, reportUser, executePanicDelete } from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';
import { upload, validateUpload } from '../middlewares/uploadMiddleware';
import { apiLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(protect);
router.use(apiLimiter);

router.get('/search', searchUsers);
router.put('/profile', upload.single('avatar'), (req, res, next) => {
  if (req.file) {
    // Validate image format, max 10MB
    return validateUpload(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'], 10 * 1024 * 1024)(req, res, next);
  }
  next();
}, updateProfile);
router.get('/:id', getUserProfile);
router.post('/report', reportUser);
router.post('/panic-delete', executePanicDelete);

export default router;
