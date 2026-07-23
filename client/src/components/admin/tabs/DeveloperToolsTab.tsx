import React, { useEffect, useState } from 'react';
import { Terminal, ToggleLeft, ToggleRight, Wrench, Shield, CheckCircle } from 'lucide-react';
import api from '../../../services/api';
import type { FeatureFlagItem } from '../../../types/admin';

const DeveloperToolsTab: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlagItem[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [testEndpoint, setTestEndpoint] = useState('/health');
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  const loadFlags = async () => {
    try {
      const res = await api.get('/admin/advanced/feature-flags');
      setFlags(res.data.flags);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggleFlag = async (key: string, currentVal: boolean) => {
    try {
      await api.post('/admin/advanced/feature-flags/toggle', {
        key,
        isEnabled: !currentVal,
      });
      loadFlags();
    } catch (err) {
      alert('Error toggling feature flag');
    }
  };

  const handleRunApiTest = async () => {
    try {
      const res = await api.get(testEndpoint.startsWith('/api') ? testEndpoint.replace('/api', '') : testEndpoint);
      setApiResponse(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      setApiResponse(JSON.stringify(err.response?.data || { error: err.message }, null, 2));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-indigo-500 shrink-0" />
            <span>Developer Tools & Feature Flags</span>
          </h2>
          <p className="text-xs text-slate-500">Live Feature Toggles, Maintenance Mode & API Console</p>
        </div>

        <div className="flex items-center justify-between sm:justify-start space-x-3 bg-slate-100 px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 w-full sm:w-auto">
          <span>System Maintenance</span>
          <button
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`px-3 py-1 rounded-xl text-xs font-bold text-white transition-all ${maintenanceMode ? 'bg-rose-600' : 'bg-slate-400'
              }`}
          >
            {maintenanceMode ? 'ACTIVE' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Feature Flags Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Dynamic Feature Flags</h3>
        <div className="space-y-3">
          {flags.length === 0 ? (
            <div className="space-y-2">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">webrtc_video_calling</p>
                  <p className="text-slate-500">Enable real-time WebRTC video calling</p>
                </div>
                <button
                  onClick={() => handleToggleFlag('webrtc_video_calling', true)}
                  className="px-3.5 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-xl"
                >
                  ENABLED
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">ai_copilot_assistant</p>
                  <p className="text-slate-500">Enable AI Copilot inside admin panel</p>
                </div>
                <button
                  onClick={() => handleToggleFlag('ai_copilot_assistant', true)}
                  className="px-3.5 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-xl"
                >
                  ENABLED
                </button>
              </div>
            </div>
          ) : (
            flags.map((flag) => (
              <div key={flag.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">{flag.name}</p>
                  <p className="text-slate-500">{flag.description || flag.key}</p>
                </div>
                <button
                  onClick={() => handleToggleFlag(flag.key, flag.isEnabled)}
                  className={`px-3.5 py-1.5 font-bold rounded-xl transition-all ${flag.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  {flag.isEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Testing Console */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">API Console & Health Probe</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={testEndpoint}
            onChange={(e) => setTestEndpoint(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
          />
          <button
            onClick={handleRunApiTest}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
          >
            Execute Probe
          </button>
        </div>

        {apiResponse && (
          <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-48">
            {apiResponse}
          </pre>
        )}
      </div>
    </div>
  );
};

export default DeveloperToolsTab;
