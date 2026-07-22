import { Router } from 'express';
import { protect, adminOnly } from '../middlewares/authMiddleware';
import {
  getRealTimeMetricsHandler,
  analyzeTextHandler,
  getModerationLogsHandler,
  getUserIntelligenceHandler,
  getConversationTimelineHandler,
  searchDeletedMessagesHandler,
  exportEvidenceHandler,
  getIpRulesHandler,
  addIpRuleHandler,
  removeIpRuleHandler,
  forceLogoutHandler,
  getApprovalRequestsHandler,
  processApprovalHandler,
  getAuditLogsHandler,
  getAdvancedAnalyticsHandler,
  scanMediaHandler,
  cleanupMediaHandler,
  getFeatureFlagsHandler,
  toggleFeatureFlagHandler,
  copilotQueryHandler,
  broadcastAnnouncementHandler,
} from '../controllers/advancedAdminController';

const router = Router();

router.use(protect);
router.use(adminOnly);

// Metrics & Realtime
router.get('/metrics', getRealTimeMetricsHandler);

// AI Moderation
router.post('/moderation/analyze-text', analyzeTextHandler);
router.get('/moderation/logs', getModerationLogsHandler);

// User Intelligence
router.get('/user-intelligence/:userId', getUserIntelligenceHandler);

// Investigation
router.get('/investigation/timeline/:conversationId', getConversationTimelineHandler);
router.get('/investigation/deleted', searchDeletedMessagesHandler);
router.get('/investigation/export/:conversationId', exportEvidenceHandler);

// Security & RBAC
router.get('/security/ip-rules', getIpRulesHandler);
router.post('/security/ip-rules', addIpRuleHandler);
router.delete('/security/ip-rules/:ip', removeIpRuleHandler);
router.post('/security/force-logout', forceLogoutHandler);
router.get('/security/approval-requests', getApprovalRequestsHandler);
router.post('/security/approval-requests/:id/process', processApprovalHandler);
router.get('/audit-logs', getAuditLogsHandler);

// Advanced Analytics
router.get('/analytics', getAdvancedAnalyticsHandler);

// File & Media Protection
router.get('/media/scan', scanMediaHandler);
router.post('/media/cleanup', cleanupMediaHandler);

// Developer Tools & Feature Flags
router.get('/feature-flags', getFeatureFlagsHandler);
router.post('/feature-flags/toggle', toggleFeatureFlagHandler);

// AI Copilot
router.post('/copilot', copilotQueryHandler);

// System Announcements Broadcast
router.post('/announcements/broadcast', broadcastAnnouncementHandler);

export default router;

