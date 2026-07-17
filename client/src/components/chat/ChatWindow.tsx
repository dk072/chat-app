import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import {
  Send, Paperclip, Smile, Mic, X, MoreVertical, CornerUpLeft, Edit3, Trash2, 
  ChevronDown, Download, AlertTriangle, Search, Info, Pin, Play, Pause, Square, ArrowLeft,
  Check, CheckCheck, MessageSquare, Phone, Video
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { MessagesSkeleton } from '../ui/Skeleton';
import api from '../../services/api';
import { Message, MessageType } from '../../types';

const ChatWindow: React.FC = () => {
  const { user } = useAuth();
  const {
    activeChat,
    messages,
    loadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,
    selectChat,
    editMessage,
    deleteMessage,
    reactToMessage,
    togglePinChat,
    replyingTo,
    setReplyingTo,
    sendTypingStatus,
    partnerTyping,
  } = useChat();

  const { startCall } = useCall();

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<MessageType>('TEXT');

  // Voice Note State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Editing Message State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Active bubble menu tracking
  const [bubbleMenuId, setBubbleMenuId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom on initial chat load or incoming message
  useEffect(() => {
    if (messages.length > 0 && !loadingMessages) {
      scrollToBottom('auto');
    }
  }, [activeChat?.id, loadingMessages]);

  useEffect(() => {
    // Scroll down on new message if user is already near the bottom
    const viewport = chatViewportRef.current;
    if (viewport) {
      const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 200;
      if (isNearBottom) {
        scrollToBottom('smooth');
      }
    }
  }, [messages.length]);

  // Handle scrolling up to fetch older history (Intersection Observer style or scroll listener)
  const handleScroll = () => {
    const viewport = chatViewportRef.current;
    if (viewport && viewport.scrollTop === 0 && hasMoreMessages && !loadingMessages) {
      // Store current scroll height
      const previousScrollHeight = viewport.scrollHeight;
      
      loadMoreMessages().then(() => {
        // Restore scroll position after prepending older messages
        setTimeout(() => {
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight - previousScrollHeight;
          }
        }, 50);
      });
    }
  };

  // Input typing indicators trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    sendTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  // Dispatch message
  const handleSend = async () => {
    if ((!inputText.trim() && !selectedFile) || !activeChat) return;

    try {
      if (selectedFile) {
        await sendMessage(inputText, fileType, selectedFile);
        setSelectedFile(null);
      } else {
        await sendMessage(inputText, 'TEXT');
      }
      setInputText('');
      setShowEmojiPicker(false);
      sendTypingStatus(false);
    } catch (err) {
      alert('Error sending message');
    }
  };

  // Drag and Drop files handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    const mime = file.type;
    let type: MessageType = 'FILE';

    if (mime.startsWith('image/')) {
      type = 'IMAGE';
    } else if (mime.startsWith('video/')) {
      type = 'VIDEO';
    } else if (mime === 'application/pdf') {
      type = 'FILE'; // Handled under generic document
    }

    setSelectedFile(file);
    setFileType(type);
  };

  // Voice recording engine
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        try {
          if (activeChat) {
            await sendMessage(null, 'VOICE', audioFile);
          }
        } catch (e) {
          alert('Could not upload voice note');
        }

        // Clean track streams
        stream.getTracks().forEach((track) => track.stop());
        setAudioChunks([]);
      };

      setAudioChunks([]);
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (!mediaRecorder) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    
    if (shouldSend) {
      mediaRecorder.stop();
    } else {
      // Cancel and clean up without saving
      mediaRecorder.ondataavailable = null;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }

    setIsRecording(false);
    setMediaRecorder(null);
  };

  // Abuse Report handler
  const submitReport = async () => {
    if (!reportReason.trim() || !activeChat) return;
    setReporting(true);
    try {
      await api.post('/users/report', {
        reportedId: activeChat.partner.id,
        reason: reportReason,
      });
      alert('Thank you, report submitted successfully.');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      alert('Failed to log report.');
    } finally {
      setReporting(false);
    }
  };

  // Standard custom emojis
  const defaultEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Highlight matches locally inside message bubbles
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

  // Render format last seen strings
  const getOfflineStatus = (lastSeenString: string) => {
    try {
      const date = new Date(lastSeenString);
      const now = new Date();
      
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'offline';
      if (diffMins < 60) return `active ${diffMins}m ago`;
      
      return `last seen today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return 'offline';
    }
  };

  // Audio Playback Node for voice notes
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
          {/* Custom progress slider representation */}
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] opacity-75">
            <span>{formatSeconds(Math.floor(progress))}</span>
            <span>{duration ? formatSeconds(Math.floor(duration)) : '0:00'}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!activeChat) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-chat-bg-dark text-slate-400 p-8 select-none">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center text-brand-500 mx-auto text-4xl shadow-sm animate-pulse">
            💬
          </div>
          <h3 className="text-2xl font-bold dark:text-slate-200">No Chat Selected</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Open a conversation from the sidebar dialogs list, or search the directory to start a new real-time room.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      className="flex-1 h-full flex flex-col bg-slate-100 dark:bg-chat-bg-dark relative overflow-hidden"
    >
      {/* File Drag Overlay */}
      {dragActive && (
        <div
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm border-4 border-dashed border-brand-500 m-4 rounded-3xl transition-all duration-200"
        >
          <div className="p-6 rounded-full bg-brand-500/10 text-brand-500 mb-4 animate-bounce">
            <Paperclip className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-white">Drop File to Send</h3>
          <p className="text-sm text-slate-400 mt-1">Images, videos, voice recordings, and PDFs are supported.</p>
        </div>
      )}

      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-chat-border-light dark:border-chat-border-dark bg-chat-panel-light dark:bg-chat-panel-dark flex items-center justify-between z-20">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
          <button 
            onClick={() => selectChat(null)}
            className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
          <Avatar
            src={activeChat.partner.profilePicture}
            name={activeChat.partner.username}
            isOnline={activeChat.partner.isOnline}
            size="sm"
          />
          <div className="leading-tight min-w-0">
            <h3 className="font-bold text-sm truncate">{activeChat.partner.username}</h3>
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
            onClick={() => activeChat && startCall(activeChat.partner.id, 'VOICE', activeChat.id)}
            className="p-2 rounded-full hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hidden sm:block"
            title="Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => activeChat && startCall(activeChat.partner.id, 'VIDEO', activeChat.id)}
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
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Pin action */}
          <button
            onClick={() => togglePinChat(activeChat.id)}
            className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
              activeChat.isPinned ? 'text-brand-500 rotate-45' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Abuse Report Trigger */}
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 rounded-full hover:bg-rose-500/10 text-rose-500 transition-colors"
            title="Report abuse"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Local message Search Bar */}
      {showSearch && (
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-950/40 border-b border-chat-border-light dark:border-chat-border-dark flex items-center space-x-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search matching messages..."
            className="flex-1 bg-transparent border-none text-xs focus:outline-none focus:ring-0"
            autoFocus
          />
          {searchText && (
            <button onClick={() => setSearchText('')}>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
            </button>
          )}
        </div>
      )}

      {/* Messages viewport */}
      <div
        ref={chatViewportRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 chat-pattern space-y-4"
      >
        {loadingMessages && messages.length === 0 ? (
          <MessagesSkeleton />
        ) : messages.length > 0 ? (
          <>
            {hasMoreMessages && (
              <div className="text-center py-2">
                <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse">
                  Scroll up to load history
                </span>
              </div>
            )}

            {messages.map((m) => {
              const isSelf = m.senderId === user?.id;
              const hasParent = !!m.parentMessage;
              const isEdited = m.isEdited;
              const showMenu = bubbleMenuId === m.id;

              // Filter out messages that don't match the search query locally if query exists
              if (
                searchText.trim() !== '' &&
                m.content &&
                !m.content.toLowerCase().includes(searchText.toLowerCase())
              ) {
                return null;
              }

              return (
                <div
                  key={m.id}
                  id={`msg-${m.id}`}
                  className={`flex items-end space-x-2 group ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for partner */}
                  {!isSelf && (
                    <Avatar
                      src={m.sender.profilePicture}
                      name={m.sender.username}
                      size="xs"
                      className="mb-1"
                    />
                  )}

                  {/* Message Bubble wrapper */}
                  <div className="relative max-w-[70%] space-y-1">
                    {/* Hover menu button */}
                    <div
                      className={`absolute top-1 z-10 hidden group-hover:block transition-all duration-100 ${
                        isSelf ? '-left-8' : '-right-8'
                      }`}
                    >
                      <button
                        onClick={() => setBubbleMenuId(showMenu ? null : m.id)}
                        className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu actions */}
                      {showMenu && (
                        <div
                          className={`absolute w-36 rounded-xl glass-panel shadow-glass-dark border border-slate-700 z-30 p-1.5 space-y-1 mt-1 ${
                            isSelf ? 'left-0' : 'right-0'
                          }`}
                        >
                          {/* Emoji reactions */}
                          <div className="flex space-x-1 justify-between p-1 bg-slate-800 rounded-lg mb-1">
                            {defaultEmojis.slice(0, 5).map((e) => (
                              <button
                                key={e}
                                onClick={() => {
                                  reactToMessage(m.id, e);
                                  setBubbleMenuId(null);
                                }}
                                className="hover:scale-125 transition-transform text-xs"
                              >
                                {e}
                              </button>
                            ))}
                          </div>

                          {/* Reply */}
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
                                deleteMessage(m.id, true);
                                setBubbleMenuId(null);
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
                      className={`p-3.5 rounded-2xl relative select-text shadow-sm ${
                        isSelf
                          ? 'bg-brand-500 dark:bg-brand-600 text-white rounded-br-none bubble-tail-self'
                          : 'bg-white dark:bg-chat-panel-dark text-slate-800 dark:text-slate-100 rounded-bl-none bubble-tail-other'
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
                          {/* 1. Image Render */}
                          {m.type === 'IMAGE' && m.fileUrl && (
                            <div className="rounded-xl overflow-hidden max-w-sm border border-black/10">
                              <a href={m.fileUrl} target="_blank" rel="noreferrer">
                                <img
                                  src={m.fileUrl}
                                  alt="attachment"
                                  className="object-cover w-full max-h-72 hover:scale-[1.01] transition-transform duration-200"
                                />
                              </a>
                            </div>
                          )}

                          {/* 2. Video Render */}
                          {m.type === 'VIDEO' && m.fileUrl && (
                            <div className="rounded-xl overflow-hidden max-w-sm border border-black/10">
                              <video src={m.fileUrl} controls className="w-full max-h-72" />
                            </div>
                          )}

                          {/* 3. Voice Player */}
                          {m.type === 'VOICE' && m.fileUrl && <VoicePlayer url={m.fileUrl} />}

                          {/* 4. PDF / Generic Document download bar */}
                          {m.type === 'FILE' && m.fileUrl && (
                            <a
                              href={m.fileUrl}
                              download={m.fileName || 'attachment'}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center space-x-3 p-3.5 rounded-xl bg-black/10 dark:bg-slate-800/40 border border-white/10 text-white hover:bg-black/15 transition-all text-xs"
                            >
                              <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                                <Download className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0 leading-tight">
                                <p className="font-bold truncate text-[11px] text-inherit">
                                  {m.fileName}
                                </p>
                                <span className="text-[10px] opacity-75">
                                  {m.fileSize
                                    ? `${(m.fileSize / 1024).toFixed(0)} KB`
                                    : 'Document'}
                                </span>
                              </div>
                            </a>
                          )}

                          {/* Main Text Content */}
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
                              <CheckCheck className="w-3.5 h-3.5 text-white dark:text-brand-400" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-white/70" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reactions Float elements list */}
                    {m.reactions && Object.keys(m.reactions).length > 0 && (
                      <div className="absolute -bottom-2 right-3 flex space-x-1 z-15 select-none">
                        {Object.entries(m.reactions).map(([reactUserId, emoji]) => (
                          <span
                            key={reactUserId}
                            title={`Reaction from ${reactUserId === user?.id ? 'You' : 'Friend'}`}
                            className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm transition-transform active:scale-90"
                          >
                            {emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {partnerTyping[activeChat.id] && (
              <div className="flex w-full justify-start animate-fade-in mt-4">
                <div className="flex items-end max-w-[85%] md:max-w-[70%] space-x-2 md:space-x-3">
                  <Avatar
                    src={activeChat.partner.profilePicture}
                    name={activeChat.partner.username}
                    size="sm"
                  />
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-chat-bubble-otherLight dark:bg-chat-bubble-otherDark border border-chat-border-light dark:border-chat-border-dark shadow-sm flex items-center space-x-1.5 h-[42px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 select-none space-y-2">
            <MessageSquare className="w-12 h-12 opacity-25 animate-bounce" />
            <h4 className="font-bold text-sm">No Messages Yet</h4>
            <p className="text-xs">Say hello to establish your secure room channel connection!</p>
          </div>
        )}
      </div>

      {/* Selected upload file banner */}
      {selectedFile && (
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-chat-border-light dark:border-chat-border-dark flex items-center justify-between z-20">
          <div className="flex items-center space-x-3 text-xs">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <Paperclip className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {fileType}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Replying banner */}
      {replyingTo && (
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-chat-border-light dark:border-chat-border-dark flex items-center justify-between z-20 select-none">
          <div className="flex-1 min-w-0 border-l-4 border-brand-500 pl-3">
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">
              Replying to {replyingTo.senderId === user?.id ? 'yourself' : activeChat.partner.username}
            </span>
            <span className="text-xs text-slate-400 truncate block">
              {replyingTo.type !== 'TEXT' ? `[${replyingTo.type.toLowerCase()}]` : replyingTo.content}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input controls section */}
      <div className="p-4 bg-chat-panel-light dark:bg-chat-panel-dark border-t border-chat-border-light dark:border-chat-border-dark flex items-center space-x-3 z-20">
        {/* Attachment menu trigger */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 shrink-0"
          title="Upload attachments"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,application/pdf"
        />

        {/* Custom inline Emoji drawer trigger */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            title="Emoji drawer"
          >
            <Smile className="w-5 h-5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 p-2 rounded-2xl glass-panel shadow-glass-dark border border-slate-700 z-30 flex space-x-1.5 bg-slate-900 animate-slide-up">
              {defaultEmojis.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setInputText((prev) => prev + e);
                    setShowEmojiPicker(false);
                  }}
                  className="hover:scale-125 transition-transform text-lg"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice Note Recording controls banner */}
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-rose-500/10 dark:bg-rose-500/5 px-4 py-1.5 rounded-2xl border border-rose-500/20 text-rose-500 animate-pulse text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Recording note
              </span>
              <span className="font-bold">{formatSeconds(recordingSeconds)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => stopRecording(false)}
                className="p-1 rounded-full hover:bg-rose-500/20 text-rose-400"
                title="Cancel recording"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => stopRecording(true)}
                className="p-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md active:scale-95"
                title="Stop and send"
              >
                <Square className="w-4.5 h-4.5 fill-white" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Text typing area */
          <div className="flex-1 flex items-center space-x-2">
            <textarea
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write a message..."
              rows={1}
              className="block w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-brand-500/30 focus:outline-none text-xs transition-all resize-none max-h-32 focus:bg-white dark:focus:bg-black"
            />

            {/* If input has text or file, show Send. Otherwise show Microphone for voice notes */}
            {inputText.trim() || selectedFile ? (
              <button
                onClick={handleSend}
                className="p-3 rounded-2xl text-white shadow-md bg-brand-500 hover:bg-brand-600 hover:shadow-brand-500/10 transition-all shrink-0 active:scale-95"
                style={{ backgroundColor: 'rgb(var(--accent-color))' }}
              >
                <Send className="w-4 h-4 fill-white text-white" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Record voice note"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Abuse report modal overlay */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="w-full max-w-md rounded-2xl bg-chat-panel-light dark:bg-chat-panel-dark border border-slate-700 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Report User {activeChat.partner.username}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Please explain the reason for reporting this user. Administrators will review the chat logs and take appropriate actions.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Offensive behavior or spamming..."
              rows={3}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-brand-500 focus:outline-none text-xs"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white hover:opacity-90"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={reporting || !reportReason.trim()}
                className="px-4 py-2 rounded-xl text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
