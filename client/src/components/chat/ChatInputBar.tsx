import React, { useRef } from 'react';
import { Paperclip, Sparkles, BarChart2, Smile, Mic, Send, Square, X } from 'lucide-react';

interface ChatInputBarProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  selectedFile: File | null;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSend: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  isRecording: boolean;
  recordingSeconds: number;
  startRecording: () => void;
  stopRecording: (shouldSend?: boolean) => void;
  formatSeconds: (seconds: number) => string;
  setShowAIModal: (show: boolean) => void;
  setShowPollModal: (show: boolean) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputText,
  setInputText,
  selectedFile,
  handleInputChange,
  handleSend,
  handleFileSelect,
  showEmojiPicker,
  setShowEmojiPicker,
  isRecording,
  recordingSeconds,
  startRecording,
  stopRecording,
  formatSeconds,
  setShowAIModal,
  setShowPollModal,
  scrollToBottom,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

  return (
    <div className="p-4 bg-white/95 dark:bg-slate-900/95 md:bg-white/30 md:dark:bg-slate-950/30 md:backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50 flex items-center space-x-3 z-20 shrink-0">
      {/* Attachment menu trigger */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 shrink-0"
        title="Upload attachments"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* AI Assistant button */}
      <button
        onClick={() => setShowAIModal(true)}
        className="p-2.5 rounded-full hover:bg-indigo-500/10 text-indigo-500 transition-colors shrink-0"
        title="AI Writing Assistant & Translator"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* In-Chat Poll button */}
      <button
        onClick={() => setShowPollModal(true)}
        className="p-2.5 rounded-full hover:bg-indigo-500/10 text-indigo-400 transition-colors shrink-0"
        title="Create In-Chat Poll"
      >
        <BarChart2 className="w-5 h-5" />
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
            onFocus={(e) => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'end' });
                scrollToBottom('smooth');
              }, 300);
            }}
            placeholder="Write a message..."
            rows={1}
            className="block w-full py-3 px-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/50 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 focus:outline-none text-xs transition-all resize-none max-h-32 shadow-inner"
          />

          {/* If input has text or file, show Send. Otherwise show Microphone for voice notes */}
          {inputText.trim() || selectedFile ? (
            <button
              onClick={handleSend}
              className="p-3 rounded-2xl text-white shadow-neon-brand bg-gradient-to-br from-brand-500 to-indigo-600 hover:opacity-90 transition-all shrink-0 active:scale-95 border border-brand-400/30"
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
  );
};

export default ChatInputBar;
