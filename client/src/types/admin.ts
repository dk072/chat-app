export interface TelemetryMetrics {
  cpuUsage: number;
  freeMemoryMB: number;
  totalMemoryMB: number;
  memoryUsagePct: number;
  nodeHeapUsedMB?: number;
  nodeRssMB?: number;
  totalDiskGB?: number;
  freeDiskGB?: number;
  usedDiskGB?: number;
  diskUsagePct?: number;
  uptimeSeconds: number;
  activeCalls: number;
  activeConversations: number;
  onlineUsers: number;
  dbLatencyMs: number;
  apiAvgLatencyMs: number;
  slowEndpoints: { endpoint: string; avgTimeMs: number; hits: number }[];
  cacheHitRatioPct: number;
  queuedBackgroundJobs: number;
}

export interface UserIntelligence {
  userId: string;
  username: string;
  email: string;
  trustScore: number;
  riskScore: number;
  suspiciousActivity: boolean;
  isDisposableEmail: boolean;
  isVpnUser: boolean;
  sharedIpAccounts: string[];
  altAccounts: string[];
  devices: { device: string; browser: string; os: string; lastSeen: string }[];
  ipHistory: { ip: string; country: string; lastUsed: string }[];
  sessionHistory: any[];
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  details?: any;
  createdAt: string;
}

export interface FeatureFlagItem {
  id: string;
  key: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  rules?: string;
}

export interface IpRuleItem {
  id: string;
  ip: string;
  type: 'BLACKLIST' | 'WHITELIST';
  reason?: string;
  addedBy?: string;
  createdAt: string;
}

export interface ApprovalRequestItem {
  id: string;
  actionType: string;
  requestedBy: string;
  approvedBy?: string;
  targetId?: string;
  payload?: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
