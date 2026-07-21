import { Router } from 'express';
import { getStats, listUsers, toggleBanUser, deleteUser, getReports, resolveReport } from '../controllers/adminController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);
router.use(adminOnly);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.post('/users/:userId/ban', toggleBanUser);
router.delete('/users/:userId', deleteUser);
router.get('/reports', getReports);
router.post('/reports/:id/resolve', resolveReport);

export default router;
