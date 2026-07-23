export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  password?: string;
  bio?: string;
  profilePicture?: string;
  lastSeen: string;
  isOnline: boolean;
  status?: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  role: 'USER' | 'ADMIN';
  createdAt: string;
  isBanned?: boolean;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: MessageType;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  isDelivered: boolean;
  isSeen: boolean;
  isEdited: boolean;
  isDeletedForEveryone: boolean;
  deletedForUsers: string[];
  parentId?: string | null;
  parentMessage?: {
    id: string;
    content: string | null;
    type: MessageType;
    senderId: string;
  } | null;
  reactions: Record<string, string>; // Maps userId -> emoji string
  isPinnedGlobally: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    username: string;
    profilePicture: string;
  };
}

export interface Conversation {
  id: string;
  partner: {
    id: string;
    username: string;
    profilePicture: string;
    isOnline: boolean;
    status?: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
    lastSeen: string;
    bio?: string;
  };
  lastMessage: Message | null;
  unreadCount: number;
  isPinned: boolean;
  updatedAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  reporter: {
    id: string;
    username: string;
    email: string;
  };
  reported: {
    id: string;
    username: string;
    email: string;
    isBanned: boolean;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalMessages: number;
  activeUsers: number;
  pendingReports: number;
  messageBreakdown: {
    type: MessageType;
    count: number;
  }[];
  recentUsers: {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
}

export type CallStatus = 'COMPLETED' | 'MISSED' | 'REJECTED' | 'BUSY' | 'FAILED';

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  callType: 'VOICE' | 'VIDEO';
  status: CallStatus;
  duration: number;
  startedAt: string;
  endedAt?: string;
  conversationId?: string;
  caller: {
    id: string;
    username: string;
    profilePicture: string;
  };
  receiver: {
    id: string;
    username: string;
    profilePicture: string;
  };
}
