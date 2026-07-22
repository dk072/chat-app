import React, { useState } from 'react';
import { Shield, AlertOctagon, CheckCircle2, Bot, Sliders, Zap, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';

const SmartModerationTab: React.FC = () => {
  const [testText, setTestText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRunAnalysis = async () => {
    if (!testText.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/admin/advanced/moderation/analyze-text', { text: testText });
      setAnalysisResult(res.data.result);
    } catch (err) {
      alert('Error analyzing content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <Bot className="w-5 h-5 text-indigo-500" />
          <span>AI Smart Moderation Engine</span>
        </h2>
        <p className="text-xs text-slate-500">Automated Content Inspection, Risk Scoring & Policy Controls</p>
      </div>

      {/* AI Inspector Console */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Live Content Inspection Console</h3>
        <div className="space-y-4">
          <textarea
            rows={3}
            placeholder="Type or paste sample chat message text to run real-time AI moderation checks..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-4 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-500 transition-all text-slate-800"
          />
          <button
            onClick={handleRunAnalysis}
            disabled={loading || !testText.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? 'Analyzing...' : 'Run AI Moderation Check'}</span>
          </button>
        </div>

        {/* Results Card */}
        {analysisResult && (
          <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Risk Score</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  analysisResult.riskScore >= 60
                    ? 'bg-rose-100 text-rose-700'
                    : analysisResult.riskScore >= 25
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {analysisResult.riskScore} / 100
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">Detected Threat Flags:</p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.flags.length === 0 ? (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" /> <span>No policy violations detected</span>
                  </span>
                ) : (
                  analysisResult.flags.map((flag: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg text-xs border border-rose-100">
                      {flag}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs">
              <span className="font-bold text-slate-800">Automated Recommendation: </span>
              <span className="text-slate-600">{analysisResult.recommendation}</span>
            </div>
          </div>
        )}
      </div>

      {/* Policy Rules Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-2">
          <div className="flex items-center space-x-2 text-amber-500 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Auto Warning Policy</span>
          </div>
          <p className="text-xs text-slate-500">Triggers on Risk Score &gt;= 20. Sends automated policy alert warning to target user.</p>
          <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold text-[11px] rounded-lg">ACTIVE</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-500 font-bold text-sm">
            <Sliders className="w-4 h-4" />
            <span>Auto Mute Policy</span>
          </div>
          <p className="text-xs text-slate-500">Triggers on Risk Score &gt;= 45. Mutes user sending privileges for 24 hours.</p>
          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold text-[11px] rounded-lg">ACTIVE</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-2">
          <div className="flex items-center space-x-2 text-rose-500 font-bold text-sm">
            <AlertOctagon className="w-4 h-4" />
            <span>Auto Temp Ban</span>
          </div>
          <p className="text-xs text-slate-500">Triggers on Risk Score &gt;= 75 or Hate Speech. Temporarily suspends account instantly.</p>
          <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 font-semibold text-[11px] rounded-lg">ACTIVE</span>
        </div>
      </div>
    </div>
  );
};

export default SmartModerationTab;
