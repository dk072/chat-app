import express from 'express';
import { getCallHistory } from '../controllers/callController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/history', getCallHistory);

export default router;
