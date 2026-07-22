import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, User, X, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import api from '../../services/api';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  suggestions?: string[];
}

const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello Admin! I am your AI Copilot. How can I help you analyze system performance, summarize abuse reports, or investigate security threats today?',
      suggestions: ['Summarize pending reports', 'Explain traffic spikes', 'Recommend security improvements'],
    },
  ]);

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/admin/advanced/copilot', { prompt: queryText });
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data.reply,
        suggestions: res.data.suggestions,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue analyzing real-time data.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100"
        >
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Admin AI Copilot</h3>
                <p className="text-xs text-slate-400">Real-Time Intelligence Assistant</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-start space-x-2 max-w-[85%]">
                  {m.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-brand-500 text-white font-medium rounded-tr-none'
                        : 'bg-white border border-slate-100 text-slate-800 shadow-xs rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pl-9">
                    {m.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-brand-200 text-brand-600 hover:bg-brand-50 text-[11px] font-semibold transition-all shadow-2xs"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 pl-9">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <span>AI Copilot is analyzing application metrics...</span>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-brand-500 transition-colors">
              <input
                type="text"
                placeholder="Ask AI Copilot anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none px-2"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AICopilotDrawer;
