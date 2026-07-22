import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical, CornerUpLeft, Edit3, Trash2, Download, Check, CheckCheck, Play, Pause, Star
} from 'lucide-react';
import AnimatedAvatar from '../ui/AnimatedAvatar';
import { motion } from 'framer-motion';
import { Message, Conversation } from '../../types';
import api from '../../services/api';

const getFullUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${url}`;
};

interface ChatMessageBubbleProps {
  message: Message;
  isSelf: boolean;
  activeChat: Conversation;
  user: any;
  searchText: string;
  bubbleMenuId: string | null;
  setBubbleMenuId: (id: string | null) => void;
  setReplyingTo: (msg: Message) => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editingText: string;
  setEditingText: (text: string) => void;
  editMessage: (id: string, text: string) => void;
  deleteMessage: (id: string, forEveryone: boolean) => void;
  reactToMessage: (id: string, emoji: string) => void;
}

const VoicePlayer: React.FC<{ url: string }> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioUpdate = () => setProgress(audio.currentTime);
    const setAudioEnded = () => setIsPlaying(false);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioUpdate);
    audio.addEventListener('ended', setAudioEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioUpdate);
      audio.removeEventListener('ended', setAudioEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center space-x-3 py-1 min-w-[200px]">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
      </button>
      <div className="flex-1 space-y-1">
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] opacity-75">
          <span>{isPlaying ? `${Math.floor(progress)}s` : 'Voice Note'}</span>
          <span>{duration ? `${Math.floor(duration)}s` : ''}</span>
        </div>
      </div>
    </div>
  );
};

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message: m,
  isSelf,
  activeChat,
  user,
  searchText,
  bubbleMenuId,
  setBubbleMenuId,
  setReplyingTo,
  editingMessageId,
  setEditingMessageId,
  editingText,
  setEditingText,
  editMessage,
  deleteMessage,
  reactToMessage,
}) => {
  const [isStarred, setIsStarred] = useState(false);
  const isEdited = new Date(m.updatedAt).getTime() - new Date(m.createdAt).getTime() > 1000;
  const hasParent = Boolean(m.parentId);
  const defaultEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

  const toggleStar = async () => {
    try {
      const res = await api.post(`/nextgen/messages/${m.id}/star`);
      setIsStarred(res.data.isStarred);
    } catch (e) {}
  };

  const highlightSearchText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={index} className="bg-yellow-500/35 text-inherit rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      id={`msg-${m.id}`}
      className={`flex w-full ${isSelf ? 'justify-end' : 'justify-start'} group transition-all`}
    >
      <div className={`flex items-end max-w-[85%] md:max-w-[70%] space-x-2 md:space-x-3 ${isSelf ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {!isSelf && (
          <AnimatedAvatar
            src={activeChat.partner.profilePicture}
            name={activeChat.partner.username}
            size="sm"
            status={activeChat.partner.status}
          />
        )}

        <div className="relative group/bubble">
          {/* Action Menu button trigger on hover */}
          <div className={`absolute top-2 z-20 ${isSelf ? '-left-8' : '-right-8'} opacity-0 group-hover/bubble:opacity-100 transition-opacity`}>
            <button
              onClick={() => setBubbleMenuId(bubbleMenuId === m.id ? null : m.id)}
              className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-md transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Context Action Menu Dropdown */}
            {bubbleMenuId === m.id && (
              <div className={`absolute top-6 ${isSelf ? 'right-0' : 'left-0'} z-30 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 space-y-1 animate-fade-in`}>
                {/* Emoji Quick Bar */}
                {!m.isDeletedForEveryone && (
                  <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto no-scrollbar">
                    {defaultEmojis.slice(0, 5).map((e) => (
                      <button
                        key={e}
                        onClick={() => {
                          reactToMessage(m.id, e);
                          setBubbleMenuId(null);
                        }}
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                {/* Star Message */}
                {!m.isDeletedForEveryone && (
                  <button
                    onClick={() => {
                      toggleStar();
                      setBubbleMenuId(null);
                    }}
                    className="w-full flex items-center space-x-2 p-1.5 rounded-lg text-[10px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                    <span>{isStarred ? 'Unstar' : 'Star Message'}</span>
                  </button>
                )}

                {/* Reply */}
                {!m.isDeletedForEveryone && (
                  <button
                    onClick={() => {
                      setReplyingTo(m);
                      setBubbleMenuId(null);
                    }}
                    className="w-full flex items-center space-x-2 p-1.5 rounded-lg text-[10px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                )}

                {/* Edit (Text only, self only) */}
                {isSelf && m.type === 'TEXT' && !m.isDeletedForEveryone && (
                  <button
                    onClick={() => {
                      setEditingMessageId(m.id);
                      setEditingText(m.content || '');
                      setBubbleMenuId(null);
                    }}
                    className="w-full flex items-center space-x-2 p-1.5 rounded-lg text-[10px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}

                {/* Delete For Me */}
                <button
                  onClick={() => {
                    deleteMessage(m.id, false);
                    setBubbleMenuId(null);
                  }}
                  className="w-full flex items-center space-x-2 p-1.5 rounded-lg text-[10px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete For Me</span>
                </button>

                {/* Delete For Everyone (Self only) */}
                {isSelf && !m.isDeletedForEveryone && (
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this message for everyone?')) {
                        deleteMessage(m.id, true);
                        setBubbleMenuId(null);
                      }
                    }}
                    className="w-full flex items-center space-x-2 p-1.5 rounded-lg text-[10px] font-semibold text-rose-500 hover:bg-rose-500/15 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete for All</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Actual Bubble card */}
          <div
            className={`p-3.5 rounded-2xl relative select-text shadow-sm transition-all hover:shadow-md ${
              isSelf
                ? 'bg-gradient-to-br from-brand-500 to-indigo-600 text-white rounded-tr-none bubble-tail-self shadow-brand-500/30'
                : 'bg-white/95 dark:bg-slate-800/95 md:bg-white/80 md:dark:bg-slate-800/80 md:backdrop-blur-sm text-slate-800 dark:text-slate-100 rounded-tl-none bubble-tail-other border border-white/20 dark:border-white/5'
            }`}
          >
            {/* Reply preview Quote inside bubble */}
            {hasParent && m.parentMessage && (
              <div
                onClick={() => {
                  const elem = document.getElementById(`msg-${m.parentMessage?.id}`);
                  elem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  elem?.classList.add('accent-border-active');
                  setTimeout(() => elem?.classList.remove('accent-border-active'), 1500);
                }}
                className={`mb-2 p-2 rounded-xl text-[10px] border-l-4 cursor-pointer truncate max-w-full select-none ${
                  isSelf
                    ? 'bg-black/15 border-white/60 text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-800 border-brand-500 text-slate-400'
                }`}
              >
                <div className="font-bold text-[9px] uppercase tracking-wider mb-0.5">
                  {m.parentMessage.senderId === user?.id ? 'You' : activeChat.partner.username}
                </div>
                <span>
                  {m.parentMessage.type !== 'TEXT'
                    ? `[${m.parentMessage.type.toLowerCase()}]`
                    : m.parentMessage.content}
                </span>
              </div>
            )}

            {/* Display content depending on Media Type */}
            {m.isDeletedForEveryone ? (
              <span className="italic text-xs opacity-60">This message was deleted.</span>
            ) : (
              <div className="space-y-2">
                {/* Image Render */}
                {m.type === 'IMAGE' && m.fileUrl && (
                  <div className="rounded-xl overflow-hidden max-w-sm border border-black/10">
                    <a href={getFullUrl(m.fileUrl)} target="_blank" rel="noreferrer">
                      <img
                        src={getFullUrl(m.fileUrl)}
                        alt="attachment"
                        className="object-cover w-full max-h-72 hover:scale-[1.01] transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/400x300/1e293b/94a3b8?text=Media+Expired+(Ephemeral+Storage)';
                        }}
                      />
                    </a>
                  </div>
                )}

                {/* Video Render */}
                {m.type === 'VIDEO' && m.fileUrl && (
                  <div className="rounded-xl overflow-hidden max-w-sm border border-black/10">
                    <video src={getFullUrl(m.fileUrl)} controls className="w-full max-h-72" />
                  </div>
                )}

                {/* Voice Player */}
                {m.type === 'VOICE' && m.fileUrl && <VoicePlayer url={getFullUrl(m.fileUrl)} />}

                {/* PDF / Document Download Bar */}
                {m.type === 'FILE' && m.fileUrl && (
                  <a
                    href={getFullUrl(m.fileUrl)}
                    download={m.fileName || 'attachment'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-3 p-3.5 rounded-xl bg-black/10 dark:bg-slate-800/40 border border-white/10 text-white hover:bg-black/15 transition-all text-xs"
                  >
                    <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 leading-tight">
                      <p className="font-bold truncate text-[11px] text-inherit">{m.fileName}</p>
                      <span className="text-[10px] opacity-75">
                        {m.fileSize ? `${(m.fileSize / 1024).toFixed(0)} KB` : 'Document'}
                      </span>
                    </div>
                  </a>
                )}

                {/* Text Content / Edit Box */}
                {editingMessageId === m.id ? (
                  <div className="space-y-1.5 min-w-[220px] pt-1">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-brand-500 text-white focus:outline-none resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          editMessage(m.id, editingText);
                          setEditingMessageId(null);
                        }}
                        className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-white text-brand-600 hover:bg-slate-100"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  m.content && (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap select-text break-words">
                      {highlightSearchText(m.content, searchText)}
                    </p>
                  )
                )}
              </div>
            )}

            {/* Bubble Footer Metadata (Checks & Timestamps) */}
            <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] opacity-65 select-none">
              <span>
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {isEdited && !m.isDeletedForEveryone && <span>• edited</span>}

              {isSelf && !m.isDeletedForEveryone && (
                <span className="shrink-0">
                  {m.isSeen ? (
                    <CheckCheck className="w-4 h-4 text-cyan-300 drop-shadow-sm" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-white/70" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Reactions Float badge list */}
          {(() => {
            let parsedReactions: Record<string, string> = {};
            try {
              parsedReactions =
                typeof m.reactions === 'string' ? JSON.parse(m.reactions) : m.reactions || {};
            } catch (e) {}

            if (!parsedReactions || Object.keys(parsedReactions).length === 0) return null;

            return (
              <div className="absolute -bottom-2 right-3 flex space-x-1 z-15 select-none">
                {Object.entries(parsedReactions).map(([reactUserId, emoji]) => (
                  <span
                    key={reactUserId}
                    title={`Reaction from ${reactUserId === user?.id ? 'You' : 'Friend'}`}
                    className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm transition-transform active:scale-90"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessageBubble;
