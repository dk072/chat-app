import React from 'react';
import { ArrowLeft, Phone, Video, Search, Pin, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import AnimatedAvatar from '../ui/AnimatedAvatar';
import { Conversation } from '../../types';

interface ChatHeaderProps {
  activeChat: Conversation;
  partnerTyping: Record<string, boolean>;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  setSearchText: (text: string) => void;
  onBack: () => void;
  onStartCall: (type: 'VOICE' | 'VIDEO') => void;
  onTogglePin: () => void;
  onClearHistory: () => void;
  onOpenReport: () => void;
  getOfflineStatus: (lastSeen: string) => string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeChat,
  partnerTyping,
  showSearch,
  setShowSearch,
  setSearchText,
  onBack,
  onStartCall,
  onTogglePin,
  onClearHistory,
  onOpenReport,
  getOfflineStatus,
}) => {
  const isAdminPartner = activeChat.partner.role === 'ADMIN' || activeChat.partner.username.toLowerCase() === 'admin';

  return (
    <div className="px-4 md:px-6 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 md:bg-white/30 md:dark:bg-slate-950/30 md:backdrop-blur-md flex items-center justify-between z-20 shrink-0 shadow-sm">
      <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <AnimatedAvatar
          src={activeChat.partner.profilePicture}
          name={activeChat.partner.username}
          isOnline={activeChat.partner.isOnline}
          status={activeChat.partner.status}
          size="sm"
        />
        <div className="leading-tight min-w-0">
          <div className="flex items-center space-x-1.5 min-w-0">
            <h3 className="font-bold text-sm font-outfit truncate">{activeChat.partner.username}</h3>
            {isAdminPartner && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xs shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI ACTIVE</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
            {partnerTyping[activeChat.id] ? (
              <span className="text-emerald-500 font-semibold animate-pulse">typing...</span>
            ) : activeChat.partner.isOnline ? (
              <span className="text-emerald-500 font-semibold">online</span>
            ) : (
              getOfflineStatus(activeChat.partner.lastSeen)
            )}
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={() => onStartCall('VOICE')}
          className="p-2 rounded-full hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title="Voice Call"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          onClick={() => onStartCall('VIDEO')}
          className="p-2 rounded-full hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors mr-1"
          title="Video Call"
        >
          <Video className="w-4 h-4" />
        </button>

        {/* Local message search toggle */}
        <button
          onClick={() => {
            setShowSearch(!showSearch);
            setSearchText('');
          }}
          className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
            showSearch ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400'
          }`}
          title="Search messages"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Pin action */}
        <button
          onClick={onTogglePin}
          className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
            activeChat.isPinned ? 'text-brand-500 rotate-45' : 'text-slate-500 dark:text-slate-400'
          }`}
          title={activeChat.isPinned ? 'Unpin chat' : 'Pin chat'}
        >
          <Pin className="w-4 h-4" />
        </button>

        {/* Clear Chat History Trigger */}
        <button
          onClick={onClearHistory}
          className="p-2 rounded-full hover:bg-rose-500/10 text-rose-500 transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Abuse Report Trigger */}
        <button
          onClick={onOpenReport}
          className="p-2 rounded-full hover:bg-rose-500/10 text-rose-500 transition-colors"
          title="Report User"
        >
          <AlertTriangle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
