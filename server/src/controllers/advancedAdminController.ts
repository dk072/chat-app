import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAdminAction, getAuditLogs } from '../services/adminAuditService';
import { analyzeTextContent, getModerationLogs } from '../services/aiModerationService';
import { getUserIntelligence } from '../services/userIntelligenceService';
import { getConversationTimeline, searchDeletedMessages, exportEvidenceData } from '../services/investigationService';
import { listIpRules, addIpRule, removeIpRule, forceLogoutUserSessions, listApprovalRequests, processApprovalRequest } from '../services/securityService';
import { getPerformanceMetrics } from '../services/performanceService';
import { scanMediaStorage, cleanupBrokenMedia } from '../services/mediaScannerService';
import { getAdvancedAnalytics } from '../services/analyticsService';
import { processCopilotQuery } from '../services/adminCopilotService';

export const getRealTimeMetricsHandler = async (req: Request, res: Response) => {
  try {
    const io = req.app.get('io');
    const onlineUsersCount = await prisma.user.count({ where: { isOnline: true } });
    const metrics = await getPerformanceMetrics(0, onlineUsersCount);
    return res.json({ metrics });
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    return res.status(500).json({ message: 'Error fetching telemetry metrics.' });
  }
};

export const analyzeTextHandler = async (req: Request, res: Response) => {
  const { text = '' } = req.body;
  try {
    const result = analyzeTextContent(text);
    return res.json({ result });
  } catch (error) {
    return res.status(500).json({ message: 'Error performing AI text analysis.' });
  }
};

export const getModerationLogsHandler = async (req: Request, res: Response) => {
  try {
    const logs = await getModerationLogs();
    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching moderation logs.' });
  }
};

export const getUserIntelligenceHandler = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const profile = await getUserIntelligence(userId);
    if (!profile) return res.status(404).json({ message: 'User intelligence profile not found.' });
    return res.json({ profile });
  } catch (error) {
    return res.status(500).json({ message: 'Error computing user intelligence.' });
  }
};

export const getConversationTimelineHandler = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  try {
    const timeline = await getConversationTimeline(conversationId);
    if (!timeline) return res.status(404).json({ message: 'Conversation not found.' });
    return res.json({ timeline });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching conversation timeline.' });
  }
};

export const searchDeletedMessagesHandler = async (req: Request, res: Response) => {
  const { query = '' } = req.query;
  try {
    const messages = await searchDeletedMessages(query as string);
    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ message: 'Error searching deleted messages.' });
  }
};

export const exportEvidenceHandler = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { format = 'json' } = req.query;
  try {
    const exportResult = await exportEvidenceData(conversationId, format as string);
    if (!exportResult) return res.status(404).json({ message: 'Evidence data generation failed.' });

    res.setHeader('Content-Type', exportResult.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    return res.send(exportResult.data);
  } catch (error) {
    return res.status(500).json({ message: 'Error exporting evidence package.' });
  }
};

export const getIpRulesHandler = async (req: Request, res: Response) => {
  try {
    const rules = await listIpRules();
    return res.json({ rules });
  } catch (error) {
    return res.status(500).json({ message: 'Error listing IP rules.' });
  }
};

export const addIpRuleHandler = async (req: Request, res: Response) => {
  const { ip, type, reason } = req.body;
  const adminId = (req as any).user?.id || 'admin';
  try {
    const rule = await addIpRule(ip, type, reason, adminId);
    await logAdminAction({ adminId, action: `ADD_IP_${type}`, targetType: 'IP', targetId: ip, details: { reason } });
    return res.json({ rule });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding IP rule.' });
  }
};

export const removeIpRuleHandler = async (req: Request, res: Response) => {
  const { ip } = req.params;
  const adminId = (req as any).user?.id || 'admin';
  try {
    await removeIpRule(ip);
    await logAdminAction({ adminId, action: 'REMOVE_IP_RULE', targetType: 'IP', targetId: ip });
    return res.json({ message: 'IP rule removed.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error removing IP rule.' });
  }
};

export const forceLogoutHandler = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const adminId = (req as any).user?.id || 'admin';
  const io = req.app.get('io');
  try {
    await forceLogoutUserSessions(userId, io);
    await logAdminAction({ adminId, action: 'FORCE_LOGOUT_USER', targetType: 'USER', targetId: userId });
    return res.json({ message: 'Force logout executed successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error executing force logout.' });
  }
};

export const getApprovalRequestsHandler = async (req: Request, res: Response) => {
  try {
    const requests = await listApprovalRequests();
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching approval requests.' });
  }
};

export const processApprovalHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const adminId = (req as any).user?.id || 'admin';
  try {
    const request = await processApprovalRequest(id, adminId, status);
    await logAdminAction({ adminId, action: `PROCESS_APPROVAL_${status}`, targetType: 'APPROVAL_REQUEST', targetId: id });
    return res.json({ request });
  } catch (error) {
    return res.status(500).json({ message: 'Error processing approval request.' });
  }
};

export const getAuditLogsHandler = async (req: Request, res: Response) => {
  const { limit = '50', page = '1' } = req.query;
  try {
    const logsData = await getAuditLogs(parseInt(limit as string), parseInt(page as string));
    return res.json(logsData);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching audit logs.' });
  }
};

export const getAdvancedAnalyticsHandler = async (req: Request, res: Response) => {
  try {
    const analytics = await getAdvancedAnalytics();
    return res.json({ analytics });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching advanced analytics.' });
  }
};

export const scanMediaHandler = async (req: Request, res: Response) => {
  try {
    const scanResult = await scanMediaStorage();
    return res.json({ scanResult });
  } catch (error) {
    return res.status(500).json({ message: 'Error scanning media storage.' });
  }
};

export const cleanupMediaHandler = async (req: Request, res: Response) => {
  const adminId = (req as any).user?.id || 'admin';
  try {
    const result = await cleanupBrokenMedia();
    await logAdminAction({ adminId, action: 'CLEANUP_BROKEN_MEDIA', details: result });
    return res.json({ result });
  } catch (error) {
    return res.status(500).json({ message: 'Error cleaning broken media.' });
  }
};

export const getFeatureFlagsHandler = async (req: Request, res: Response) => {
  try {
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
    return res.json({ flags });
  } catch (error) {
    return res.status(500).json({ message: 'Error listing feature flags.' });
  }
};

export const toggleFeatureFlagHandler = async (req: Request, res: Response) => {
  const { key, isEnabled, name, description } = req.body;
  const adminId = (req as any).user?.id || 'admin';
  try {
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: { isEnabled },
      create: { key, isEnabled, name: name || key, description: description || '' },
    });
    await logAdminAction({ adminId, action: 'TOGGLE_FEATURE_FLAG', targetType: 'FEATURE_FLAG', targetId: key, details: { isEnabled } });
    return res.json({ flag });
  } catch (error) {
    return res.status(500).json({ message: 'Error toggling feature flag.' });
  }
};

export const copilotQueryHandler = async (req: Request, res: Response) => {
  const { prompt } = req.body;
  try {
    const copilotResponse = await processCopilotQuery(prompt || '');
    return res.json(copilotResponse);
  } catch (error) {
    return res.status(500).json({ message: 'Error processing AI copilot query.' });
  }
};

export const broadcastAnnouncementHandler = async (req: Request, res: Response) => {
  const { title, message } = req.body;
  const adminId = (req as any).user?.id || 'admin';
  const io = req.app.get('io');
  try {
    if (io) {
      io.emit('system_announcement', {
        id: Date.now().toString(),
        title,
        message,
        timestamp: new Date().toISOString(),
      });
    }

    await logAdminAction({
      adminId,
      action: 'BROADCAST_ANNOUNCEMENT',
      details: { title, message },
    });

    return res.json({ message: 'System announcement broadcasted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error broadcasting announcement.' });
  }
};

export const purgeUserMessagesHandler = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const adminId = (req as any).user?.id || 'admin';
  const io = req.app.get('io');

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    // Find all unique conversations where this user sent messages
    const userMessages = await prisma.message.findMany({
      where: { senderId: userId },
      select: { conversationId: true },
    });

    const conversationIds = Array.from(new Set(userMessages.map((m) => m.conversationId)));

    // Purge all messages sent by this user
    const result = await prisma.message.deleteMany({
      where: { senderId: userId },
    });

    // Notify active socket rooms for affected conversations
    if (io) {
      conversationIds.forEach((convId) => {
        io.to(convId).emit('messages_purged', { senderId: userId, conversationId: convId });
      });
    }

    // Log admin audit action
    await logAdminAction({
      adminId,
      action: 'PURGE_USER_MESSAGES',
      targetType: 'USER',
      targetId: userId,
      details: { deletedCount: result.count, username: user.username },
    });

    return res.json({
      message: `Successfully deleted all ${result.count} messages sent by @${user.username}.`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error purging user messages:', error);
    return res.status(500).json({ message: 'Error purging user messages.' });
  }
};


