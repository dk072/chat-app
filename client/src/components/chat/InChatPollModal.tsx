import React, { useState } from 'react';
import { BarChart2, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

interface InChatPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

export const InChatPollModal: React.FC<InChatPollModalProps> = ({
  isOpen,
  onClose,
  conversationId,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleCreatePoll = async () => {
    const validOptions = options.filter((o) => o.trim() !== '');
    if (!question.trim() || validOptions.length < 2) {
      alert('Please provide a poll question and at least 2 options.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/nextgen/polls/create', {
        conversationId,
        question: question.trim(),
        options: validOptions,
        isAnonymous,
      });
      onClose();
      setQuestion('');
      setOptions(['', '']);
    } catch (err) {
      alert('Failed to launch poll.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-white">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm">Create In-Chat Poll</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">Poll Question:</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What time should we meet tomorrow?"
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 block">Poll Options:</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(i)}
                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 6 && (
              <button
                onClick={handleAddOption}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Choice</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="anonymous-poll"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="anonymous-poll" className="text-xs text-slate-300 cursor-pointer">
              Anonymous voting (hide voter names)
            </label>
          </div>

          <button
            onClick={handleCreatePoll}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all mt-4"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Creating Poll...' : 'Launch Poll'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
