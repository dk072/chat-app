import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, AlertOctagon, BarChart2, Shield, Activity, Lock, Cpu, FolderKey, Zap, Terminal, Sparkles, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onOpenCopilot: () => void;
}

const COMMAND_ITEMS = [
  { id: 'realtime', title: 'Real-Time Monitoring', category: 'Monitoring', icon: Activity, tab: 'realtime' },
  { id: 'moderation', title: 'AI Smart Moderation', category: 'Safety', icon: Shield, tab: 'moderation' },
  { id: 'intelligence', title: 'User Intelligence Profile', category: 'Users', icon: Users, tab: 'intelligence' },
  { id: 'investigation', title: 'Chat Investigation & Timeline', category: 'Audit', icon: Search, tab: 'investigation' },
  { id: 'security', title: 'Security & RBAC Controls', category: 'Security', icon: Lock, tab: 'security' },
  { id: 'analytics', title: 'Advanced Analytics & Retention', category: 'Data', icon: BarChart2, tab: 'analytics' },
  { id: 'fileprotection', title: 'File & Media Protection', category: 'Storage', icon: FolderKey, tab: 'fileprotection' },
  { id: 'performance', title: 'Performance & Telemetry', category: 'System', icon: Cpu, tab: 'performance' },
  { id: 'devtools', title: 'Developer Tools & Feature Flags', category: 'Dev', icon: Terminal, tab: 'devtools' },
  { id: 'copilot', title: 'Ask AI Copilot Assistant', category: 'AI', icon: Sparkles, tab: 'copilot' },
];

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectTab, onOpenCopilot }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        >
          {/* Header Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search modules... (Ctrl + K)"
              className="w-full text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none text-sm font-medium"
            />
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No matching admin modules found.</div>
            ) : (
              filteredItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.tab === 'copilot') {
                        onOpenCopilot();
                      } else {
                        onSelectTab(item.tab);
                      }
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-brand-500/10 text-slate-700 hover:text-brand-600 transition-all text-left text-sm group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">{item.title}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-700">
                      {item.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-400">
            <span>Navigation Shortcut</span>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-xs font-semibold text-slate-600">Esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPalette;
