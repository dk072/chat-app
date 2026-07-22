import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import {
  Paperclip, X, ChevronDown, AlertTriangle, Search, Info, MessageSquare
} from 'lucide-react';
import AnimatedAvatar from '../ui/AnimatedAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { MessagesSkeleton } from '../ui/Skeleton';
import api from '../../services/api';
import { Message, MessageType } from '../../types';
import AIAssistantModal from './AIAssistantModal';
import { InChatPollModal } from './InChatPollModal';
import ChatHeader from './ChatHeader';
import ChatMessageBubble from './ChatMessageBubble';
import ChatInputBar from './ChatInputBar';

const getFullUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${url}`;
};

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
    clearChatHistory,
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

  // Next-Gen Feature Modals
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);

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
  const handleSend = () => {
    if ((!inputText.trim() && !selectedFile) || !activeChat) return;

    // Capture current state values
    const currentText = inputText;
    const currentFileType = fileType;
    const currentFile = selectedFile;

    // Instantly clear the UI to make the app feel incredibly fast
    setInputText('');
    setSelectedFile(null);
    setShowEmojiPicker(false);
    sendTypingStatus(false);

    // Fire API request asynchronously in the background
    try {
      if (currentFile) {
        sendMessage(currentText, currentFileType, currentFile).catch(() => alert('Error sending message'));
      } else {
        sendMessage(currentText, 'TEXT').catch(() => alert('Error sending message'));
      }
    } catch (err) {
      console.error(err);
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

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        try {
          if (activeChat) {
            sendMessage(null, 'VOICE', audioFile).catch(() => alert('Could not upload voice note'));
          }
        } catch (e) {
          console.error(e);
        }

        // Clean track streams immediately
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
          className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 md:backdrop-blur-sm border-4 border-dashed border-brand-500 m-4 rounded-3xl transition-all duration-200"
        >
          <div className="p-6 rounded-full bg-brand-500/10 text-brand-500 mb-4 animate-bounce">
            <Paperclip className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-white">Drop File to Send</h3>
          <p className="text-sm text-slate-400 mt-1">Images, videos, voice recordings, and PDFs are supported.</p>
        </div>
      )}

      {/* Header Subcomponent */}
      <ChatHeader
        activeChat={activeChat}
        partnerTyping={partnerTyping}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        setSearchText={setSearchText}
        onBack={() => selectChat(null)}
        onStartCall={(type) => activeChat && startCall(activeChat.partner.id, type, activeChat.id)}
        onTogglePin={() => togglePinChat(activeChat.id)}
        onClearHistory={() => {
          if (
            window.confirm(
              'Are you sure you want to clear chat history? All messages in this conversation will be removed from your view.'
            )
          ) {
            clearChatHistory(activeChat.id);
          }
        }}
        onOpenReport={() => setShowReportModal(true)}
        getOfflineStatus={getOfflineStatus}
      />

      {/* Local search query input bar */}
      {showSearch && (
        <div className="px-6 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 z-20 animate-fade-in">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search within this chat conversation..."
            className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            autoFocus
          />
          {searchText && (
            <button onClick={() => setSearchText('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Messages viewport */}
      <div
        ref={chatViewportRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 glass-texture space-y-4"
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

              // Filter out messages that don't match local search query
              if (
                searchText.trim() !== '' &&
                m.content &&
                !m.content.toLowerCase().includes(searchText.toLowerCase())
              ) {
                return null;
              }

              return (
                <ChatMessageBubble
                  key={m.id}
                  message={m}
                  isSelf={isSelf}
                  activeChat={activeChat}
                  user={user}
                  searchText={searchText}
                  bubbleMenuId={bubbleMenuId}
                  setBubbleMenuId={setBubbleMenuId}
                  setReplyingTo={setReplyingTo}
                  editingMessageId={editingMessageId}
                  setEditingMessageId={setEditingMessageId}
                  editingText={editingText}
                  setEditingText={setEditingText}
                  editMessage={editMessage}
                  deleteMessage={deleteMessage}
                  reactToMessage={reactToMessage}
                />
              );
            })}
            
            {partnerTyping[activeChat.id] && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex w-full justify-start mt-4">
                <div className="flex items-end max-w-[85%] md:max-w-[70%] space-x-2 md:space-x-3">
                  <AnimatedAvatar
                    src={activeChat.partner.profilePicture}
                    name={activeChat.partner.username}
                    size="sm"
                    status={activeChat.partner.status}
                  />
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/95 dark:bg-slate-800/95 md:bg-white/80 md:dark:bg-slate-800/80 md:backdrop-blur-sm border border-white/20 dark:border-white/5 shadow-sm flex items-center space-x-1.5 h-[42px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
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

      {/* Input Subcomponent */}
      <ChatInputBar
        inputText={inputText}
        setInputText={setInputText}
        selectedFile={selectedFile}
        handleInputChange={handleInputChange}
        handleSend={handleSend}
        handleFileSelect={handleFileSelect}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        startRecording={startRecording}
        stopRecording={stopRecording}
        formatSeconds={formatSeconds}
        setShowAIModal={setShowAIModal}
        setShowPollModal={setShowPollModal}
        scrollToBottom={scrollToBottom}
      />

      {/* Abuse report modal overlay */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 md:backdrop-blur-sm select-none">
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

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        inputText={inputText}
        onApplyText={(newText) => setInputText(newText)}
        conversationId={activeChat.id}
      />

      {/* In-Chat Poll Modal */}
      <InChatPollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        conversationId={activeChat.id}
      />
    </div>
  );
};

export default ChatWindow;
