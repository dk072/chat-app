import React, { useEffect, useState } from 'react';
import { Cpu, Zap, Database, Server, HardDrive, RefreshCw } from 'lucide-react';
import api from '../../../services/api';
import type { TelemetryMetrics } from '../../../types/admin';

const PerformanceTab: React.FC = () => {
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/admin/advanced/metrics');
      setMetrics(res.data.metrics);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-brand-500" />
            <span>Performance & System Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500">Cache Hit Ratios, Database Latency & Background Job Queues</p>
        </div>

        <button
          onClick={fetchMetrics}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Snapshot</span>
        </button>
      </div>

      {metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">CACHE HIT RATIO</span>
              <div className="text-3xl font-extrabold text-emerald-600">{metrics.cacheHitRatioPct}%</div>
              <p className="text-[11px] text-slate-500 mt-1">Redis / Memory Adapter</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">QUEUED JOBS</span>
              <div className="text-3xl font-extrabold text-indigo-600">{metrics.queuedBackgroundJobs}</div>
              <p className="text-[11px] text-slate-500 mt-1">Background workers</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">AVG API LATENCY</span>
              <div className="text-3xl font-extrabold text-brand-600">{metrics.apiAvgLatencyMs} ms</div>
              <p className="text-[11px] text-slate-500 mt-1">Global HTTP response</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">UPTIME</span>
              <div className="text-3xl font-extrabold text-slate-800">{Math.round(metrics.uptimeSeconds / 3600)} hrs</div>
              <p className="text-[11px] text-slate-500 mt-1">Server continuity</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Slow Endpoint & Latency Monitor</h3>
            <div className="space-y-3">
              {metrics.slowEndpoints.map((ep, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-slate-700">{ep.endpoint}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400">{ep.hits} calls</span>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-extrabold rounded-lg">{ep.avgTimeMs} ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceTab;
