import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { Conversation, Message, MessageType } from '../types';

interface ChatContextType {
  conversations: Conversation[];
  activeChat: Conversation | null;
  messages: Message[];
  loadingChats: boolean;
  loadingMessages: boolean;
  hasMoreMessages: boolean;
  replyingTo: Message | null;
  partnerTyping: Record<string, boolean>; // Maps conversationId -> boolean
  loadConversations: () => Promise<void>;
  selectChat: (chat: Conversation | null) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string | null, type: MessageType, file?: File) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string, deleteForEveryone: boolean) => Promise<void>;
  clearChatHistory: (conversationId: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string | null) => Promise<void>;
  togglePinChat: (conversationId: string) => Promise<void>;
  setReplyingTo: (msg: Message | null) => void;
  sendTypingStatus: (isTyping: boolean) => void;
  playChime: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [partnerTyping, setPartnerTyping] = useState<Record<string, boolean>>({});

  const activeChatRef = useRef<Conversation | null>(null);

  // Sync activeChat state with useRef to avoid stale closure in socket listeners
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Generate synthetic notification sound chime (no asset dependencies)
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 note
      osc.frequency.exponentialRampToValueAtTime(987.77, audioCtx.currentTime + 0.12); // B5 note

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (err) {
      // Audio context is typically blocked by browser autoplay rules until direct interaction
    }
  };

  const loadConversations = async () => {
    if (!user) return;
    setLoadingChats(true);
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  // Run on login
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setActiveChat(null);
      setMessages([]);
    }
  }, [user]);

  const selectChat = async (chat: Conversation | null) => {
    // Leave previous room if active
    if (activeChat && socket) {
      socket.emit('leave_room', activeChat.id);
    }

    setActiveChat(chat);
    setReplyingTo(null);

    if (!chat) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      if (socket) {
        socket.emit('join_room', chat.id);
      }

      // Mark conversation as seen immediately on open
      if (chat.unreadCount > 0) {
        await api.post(`/messages/conversations/${chat.id}/seen`);
        // Reset unread count locally
        setConversations((prev) =>
          prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
        );
      }

      const res = await api.get(`/messages/${chat.id}?limit=25`);
      setMessages(res.data.messages);
      setNextCursor(res.data.nextCursor);
      setHasMoreMessages(!!res.data.nextCursor);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!activeChat || !nextCursor || loadingMessages) return;

    try {
      const res = await api.get(`/messages/${activeChat.id}?limit=25&cursor=${nextCursor}`);
      
      // Prepend previous messages
      setMessages((prev) => [...res.data.messages, ...prev]);
      setNextCursor(res.data.nextCursor);
      setHasMoreMessages(!!res.data.nextCursor);
    } catch (err) {
      console.error('Error fetching older messages:', err);
    }
  };

  const sendMessage = async (content: string | null, type: MessageType, file?: File) => {
    if (!activeChat || !user) return;

    const tempId = `temp_${Date.now()}`;
    const parentMsg = replyingTo
      ? {
          id: replyingTo.id,
          content: replyingTo.content,
          type: replyingTo.type,
          senderId: replyingTo.senderId,
        }
      : null;

    // Instant Optimistic Message Bubble (0ms UI paint)
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: activeChat.id,
      senderId: user.id,
      content,
      type,
      fileUrl: file ? URL.createObjectURL(file) : null,
      fileName: file?.name || null,
      fileSize: file?.size || null,
      isDelivered: true,
      isSeen: false,
      isEdited: false,
      isDeletedForEveryone: false,
      deletedForUsers: [],
      parentId: replyingTo?.id || null,
      parentMessage: parentMsg,
      reactions: {},
      isPinnedGlobally: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture || '',
      },
    };

    // Instant local UI update
    setMessages((prev) => [...prev, optimisticMessage]);
    setReplyingTo(null);

    try {
      const formData = new FormData();
      formData.append('conversationId', activeChat.id);
      formData.append('type', type);
      
      if (content) {
        formData.append('content', content);
      }
      if (file) {
        formData.append('file', file);
      }
      if (replyingTo) {
        formData.append('parentId', replyingTo.id);
      }

      const res = await api.post('/messages/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Replace optimistic message with actual persisted message
      const actualMessage: Message = res.data.message;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? actualMessage : m)));
    } catch (err) {
      console.error('Error sending message:', err);
      // Rollback optimistic message if request fails
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    try {
      await api.put(`/messages/${messageId}`, { content });
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const deleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    try {
      await api.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
      
      // Update local state if it is delete for me (doesn't trigger socket event for sender)
      if (!deleteForEveryone) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const clearChatHistory = async (conversationId: string) => {
    try {
      await api.delete(`/messages/conversations/${conversationId}`);
      if (activeChatRef.current && activeChatRef.current.id === conversationId) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  const reactToMessage = async (messageId: string, emoji: string | null) => {
    try {
      await api.post(`/messages/${messageId}/react`, { emoji });
    } catch (err) {
      console.error('Failed to react to message:', err);
    }
  };

  const togglePinChat = async (conversationId: string) => {
    try {
      const res = await api.post(`/messages/conversations/${conversationId}/pin`);
      
      setConversations((prev) =>
        prev
          .map((c) => (c.id === conversationId ? { ...c, isPinned: res.data.isPinned } : c))
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          })
      );

      if (activeChat && activeChat.id === conversationId) {
        setActiveChat((prev) => (prev ? { ...prev, isPinned: res.data.isPinned } : null));
      }
    } catch (err) {
      console.error('Failed to pin chat:', err);
    }
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if (socket && activeChat) {
      socket.emit('typing', { conversationId: activeChat.id, isTyping });
    }
  };

  // Connect socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Helper to handle incoming messages for both active and background chats
    const handleIncomingMessage = async (msg: Message) => {
      const active = activeChatRef.current;
      
      // If message belongs to active chat viewport
      if (active && msg.conversationId === active.id) {
        // Append message if not duplicate
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        
        // Inform server we read it immediately
        if (msg.senderId !== user?.id) {
          try {
            await api.post(`/messages/conversations/${active.id}/seen`);
          } catch (e) {}
        }
      } else {
        // Trigger alert tone for background chats
        if (msg.senderId !== user?.id) {
          playChime();
        }
      }

      // Update conversations sidebar list item
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === msg.conversationId);
        if (index === -1) {
          // If conversation is not listed yet (e.g. first incoming message), reload list
          loadConversations();
          return prev;
        }

        const list = [...prev];
        const target = list[index];
        
        list[index] = {
          ...target,
          lastMessage: msg,
          unreadCount:
            active && msg.conversationId === active.id
              ? 0
              : msg.senderId !== user?.id
              ? target.unreadCount + 1
              : target.unreadCount,
          updatedAt: msg.createdAt,
        };

        // Re-sort chats
        return list.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });
    };

    // 1. Receive incoming message (when active in the room)
    socket.on('receive_message', handleIncomingMessage);

    // 2. Receive background message notification (when not active in the room)
    socket.on('new_message_notification', (data: { conversationId: string; message: Message }) => {
      handleIncomingMessage(data.message);
    });

    // 3. Message status / edit / reaction changes
    socket.on('message_updated', (msg: Message) => {
      // Update viewport list
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));

      // Update conversations sidebar last message item if applicable
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId && c.lastMessage?.id === msg.id
            ? { ...c, lastMessage: msg }
            : c
        )
      );
    });

    // 3. Blue double-check mark receipts
    socket.on('messages_seen', ({ conversationId }: { conversationId: string }) => {
      const active = activeChatRef.current;
      if (active && conversationId === active.id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === user?.id ? { ...m, isSeen: true, isDelivered: true } : m))
        );
      }
      
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId && c.lastMessage?.senderId === user?.id
            ? { ...c, lastMessage: { ...(c.lastMessage as Message), isSeen: true, isDelivered: true } }
            : c
        )
      );
    });

    // 4. Companion typing indicators
    socket.on('typing', ({ conversationId, userId, isTyping }: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (userId !== user?.id) {
        setPartnerTyping((prev) => ({ ...prev, [conversationId]: isTyping }));
      }
    });

    // 5. User online/offline status updates
    socket.on('user_status', ({ userId, isOnline, status, lastSeen }: { userId: string; isOnline: boolean; status?: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'; lastSeen: string }) => {
      // Sync sidebar list
      setConversations((prev) =>
        prev.map((c) =>
          c.partner.id === userId
            ? { ...c, partner: { ...c.partner, isOnline, status, lastSeen } }
            : c
        )
      );

      // Sync active chat profile
      const active = activeChatRef.current;
      if (active && active.partner.id === userId) {
        setActiveChat((prev) =>
          prev
            ? { ...prev, partner: { ...prev.partner, isOnline, status, lastSeen } }
            : null
        );
      }
    });

    // 6. Admin Banishment trigger
    socket.on('banned', ({ message }: { message: string }) => {
      alert(message);
      // Clean credentials
      localStorage.removeItem('token');
      window.location.reload();
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_updated');
      socket.off('messages_seen');
      socket.off('typing');
      socket.off('user_status');
      socket.off('banned');
    };
  }, [socket, user]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeChat,
        messages,
        loadingChats,
        loadingMessages,
        hasMoreMessages,
        replyingTo,
        partnerTyping,
        loadConversations,
        selectChat,
        loadMoreMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        clearChatHistory,
        reactToMessage,
        togglePinChat,
        setReplyingTo,
        sendTypingStatus,
        playChime,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
