export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporter: { id: string; username: string };
  reported: { id: string; username: string; isBanned: boolean };
  reason: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalMessages: number;
  activeUsers: number;
  pendingReports: number;
  messageBreakdown: { type: string; count: number }[];
  recentUsers: User[];
}
