import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Search, Settings, Pin, MessageSquare, Check, CheckCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedAvatar from '../ui/AnimatedAvatar';
import { SidebarSkeleton } from '../ui/Skeleton';
import api from '../../services/api';
import { Conversation, User } from '../../types';

interface SidebarProps {
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeChat,
    selectChat,
    loadingChats,
    partnerTyping,
    loadConversations,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState(false);
  const [globalResults, setGlobalResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Trigger search on query change
  useEffect(() => {
    if (!searchQuery.trim() || !globalSearch) {
      setGlobalResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await api.get(`/users/search?query=${searchQuery}`);
        setGlobalResults(res.data.users);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, globalSearch]);

  const handleStartChat = async (partnerId: string) => {
    setSearchingUsers(true);
    try {
      const res = await api.post('/messages/conversations', { partnerId });
      const conversationId = res.data.conversationId;

      // Reload conversations sidebar list
      await loadConversations();

      // Find the newly loaded conversation (or create a temporary one) and select it
      // Standard practice: search in updated conversations array
      const conversationsResponse = await api.get('/messages/conversations');
      const updatedList: Conversation[] = conversationsResponse.data.conversations;
      const target = updatedList.find((c) => c.id === conversationId) || null;

      selectChat(target);
      setSearchQuery('');
      setGlobalSearch(false);
    } catch (err) {
      console.error('Failed to initiate conversation:', err);
      alert('Could not start conversation.');
    } finally {
      setSearchingUsers(false);
    }
  };

  // Local conversations filter
  const filteredConversations = conversations.filter((c) =>
    c.partner.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastSeen = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col shrink-0 bg-white/40 dark:bg-slate-900/40">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-950/30 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <AnimatedAvatar src={user?.profilePicture} name={user?.username || ''} size="sm" isOnline={true} />
          <div className="leading-tight">
            <h1 className="font-bold font-outfit text-base truncate max-w-[120px]">{user?.username}</h1>
            <span className="text-[10px] text-brand-500 font-semibold capitalize">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input Area */}
      <div className="p-4 space-y-2 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={globalSearch ? "Find new users..." : "Search chat rooms..."}
              className="block w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-700/50 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-sm transition-all shadow-sm"
            />
        </div>

        {/* Global Search Switch */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs text-slate-400 font-semibold">
            {globalSearch ? 'Global User Search' : 'Recent Dialogs'}
          </span>
          <button
            onClick={() => {
              setGlobalSearch(!globalSearch);
              setSearchQuery('');
            }}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
              globalSearch
                ? 'border-brand-500/30 bg-brand-500/10 text-brand-500'
                : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
          >
            {globalSearch ? 'Switch to Dialogs' : 'Find Users'}
          </button>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto">
        {loadingChats ? (
          <SidebarSkeleton />
        ) : globalSearch ? (
          /* Global Users Results */
          <div className="p-2 space-y-1">
            {searchingUsers ? (
              <div className="flex items-center justify-center py-8 text-slate-400 space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Searching directory...</span>
              </div>
            ) : globalResults.length > 0 ? (
              globalResults.map((result) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={result.id}
                  onClick={() => handleStartChat(result.id)}
                  className="flex items-center space-x-3 p-3 rounded-2xl cursor-pointer hover:bg-white/60 dark:hover:bg-slate-800/50 transition-colors backdrop-blur-sm"
                >
                  <AnimatedAvatar
                    src={result.profilePicture}
                    name={result.username}
                    isOnline={result.isOnline}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{result.username}</h4>
                    <p className="text-xs text-slate-400 truncate">{result.bio}</p>
                  </div>
                </motion.div>
              ))
            ) : searchQuery.trim() !== '' ? (
              <div className="text-center py-8 text-xs text-slate-400">No users found.</div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center">
                <MessageSquare className="w-8 h-8 mb-2 opacity-35" />
                <span>Type in search box to find users</span>
              </div>
            )}
          </div>
        ) : filteredConversations.length > 0 ? (
          /* Recent conversations list */
          <div className="p-2 space-y-0.5">
            {filteredConversations.map((c) => {
              const isSelected = activeChat?.id === c.id;
              const isTyping = partnerTyping[c.id];
              const lastMsg = c.lastMessage;

              return (
                <motion.div
                  layoutId={`chat-item-${c.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  key={c.id}
                  onClick={() => selectChat(c)}
                  className={`flex items-center space-x-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-brand-500/20 to-indigo-500/10 dark:from-brand-500/30 dark:to-brand-500/5 shadow-glass-light dark:shadow-glass-dark border border-brand-500/30'
                      : 'hover:bg-white/60 dark:hover:bg-slate-800/50 hover:shadow-sm border border-transparent'
                  }`}
                >
                  {isSelected && (
                    <motion.div 
                      layoutId="active-chat-highlight"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-500 to-indigo-600 rounded-r-full"
                    />
                  )}
                  {/* Avatar wrapper */}
                  <AnimatedAvatar
                    src={c.partner.profilePicture}
                    name={c.partner.username}
                    isOnline={c.partner.isOnline}
                    size="sm"
                  />

                  {/* Message brief details */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <h4 className={`text-sm font-semibold font-outfit truncate ${isSelected ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                        {c.partner.username}
                      </h4>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatLastSeen(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs truncate flex-1 pr-2">
                        {isTyping ? (
                          <span className="text-emerald-500 dark:text-emerald-400 font-semibold animate-pulse">
                            typing...
                          </span>
                        ) : lastMsg ? (
                          <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                            {lastMsg.senderId === user?.id && (
                              <span className="shrink-0">
                                {lastMsg.isSeen ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-brand-500" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </span>
                            )}
                            <span className="truncate">
                              {lastMsg.isDeletedForEveryone
                                ? 'This message was deleted'
                                : lastMsg.type !== 'TEXT'
                                ? `[${lastMsg.type.toLowerCase()}] ${lastMsg.content || ''}`
                                : lastMsg.content}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No messages yet</span>
                        )}
                      </div>

                      {/* Right metadata badge status */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {c.isPinned && (
                          <Pin
                            className="w-3 h-3 text-slate-400 rotate-45"
                            style={{ color: isSelected ? 'rgb(var(--accent-color))' : '' }}
                          />
                        )}
                        {c.unreadCount > 0 && (
                          <span
                            className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full flex items-center justify-center leading-none min-w-[16px] h-[16px] bg-brand-500"
                            style={{ backgroundColor: 'rgb(var(--accent-color))' }}
                          >
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center">
            <MessageSquare className="w-10 h-10 mb-2 opacity-25" />
            <span>No active chats.</span>
            <button
              onClick={() => setGlobalSearch(true)}
              className="mt-3 text-brand-500 font-semibold hover:underline"
            >
              Start a new conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
