import React, { useState } from 'react';
import { Sparkles, X, Check, Languages, FileText, Wand2 } from 'lucide-react';
import api from '../../services/api';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputText: string;
  onApplyText: (newText: string) => void;
  conversationId?: string;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  inputText,
  onApplyText,
  conversationId,
}) => {
  const [selectedTone, setSelectedTone] = useState<string>('PROFESSIONAL');
  const [selectedLang, setSelectedLang] = useState<string>('es');
  const [loading, setLoading] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [summaryResult, setSummaryResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'TONE' | 'TRANSLATE' | 'SUMMARIZE'>('TONE');

  if (!isOpen) return null;

  const handleImproveTone = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/nextgen/ai/improve-text', {
        text: inputText,
        tone: selectedTone,
      });
      setPreviewText(res.data.result.improvedText);
    } catch (err) {
      alert('Error enhancing text tone.');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/nextgen/ai/translate', {
        text: inputText,
        targetLanguage: selectedLang,
      });
      setPreviewText(res.data.result.translatedText);
    } catch (err) {
      alert('Error translating message.');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await api.get(`/nextgen/ai/summarize/${conversationId}`);
      setSummaryResult(res.data.summaryResult);
    } catch (err) {
      alert('Error generating conversation summary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-white">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Writing Assistant</h3>
              <p className="text-[10px] text-slate-400">Powered by Enterprise LLM Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-6 pt-3 space-x-6">
          <button
            onClick={() => setActiveTab('TONE')}
            className={`pb-2.5 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'TONE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Improve Tone</span>
          </button>

          <button
            onClick={() => setActiveTab('TRANSLATE')}
            className={`pb-2.5 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'TRANSLATE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Translate</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('SUMMARIZE');
              handleSummarize();
            }}
            className={`pb-2.5 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'SUMMARIZE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Chat Summary</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {activeTab === 'TONE' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 block">Select Desired Tone:</label>
              <div className="grid grid-cols-2 gap-2">
                {['PROFESSIONAL', 'FRIENDLY', 'CASUAL', 'CONCISE'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      selectedTone === tone
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>

              <button
                onClick={handleImproveTone}
                disabled={loading || !inputText.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Processing...' : 'Enhance Text'}</span>
              </button>
            </div>
          )}

          {activeTab === 'TRANSLATE' && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 block">Target Language:</label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>

              <button
                onClick={handleTranslate}
                disabled={loading || !inputText.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2"
              >
                <Languages className="w-4 h-4" />
                <span>{loading ? 'Translating...' : 'Translate Message'}</span>
              </button>
            </div>
          )}

          {activeTab === 'SUMMARIZE' && (
            <div className="space-y-3">
              {loading ? (
                <p className="text-xs text-slate-400 animate-pulse">Generating AI summary of recent messages...</p>
              ) : summaryResult ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-200">
                    <span className="font-bold text-indigo-400 block mb-1">Executive Overview:</span>
                    {summaryResult.summary}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Key Action Items:</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                      {summaryResult.keyActionItems.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Click summarize to analyze discussion history.</p>
              )}
            </div>
          )}

          {/* AI Result Preview Window */}
          {previewText && (
            <div className="mt-4 p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-xs space-y-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">AI Output Result:</span>
              <p className="text-slate-100 font-medium">{previewText}</p>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  onClick={() => {
                    onApplyText(previewText);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to Input</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistantModal;
