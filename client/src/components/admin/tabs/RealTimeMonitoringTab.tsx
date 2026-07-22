import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Database, PhoneCall, Users, Zap, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../../../services/api';
import type { TelemetryMetrics } from '../../../types/admin';

interface RealTimeMonitoringTabProps {
  socket: any;
}

const RealTimeMonitoringTab: React.FC<RealTimeMonitoringTabProps> = ({ socket }) => {
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [eventLogs, setEventLogs] = useState<{ id: string; time: string; type: string; msg: string }[]>([]);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/admin/advanced/metrics');
      setMetrics(res.data.metrics);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (socket) {
      socket.emit('join_admin_metrics');

      const handleUpdate = (updatedMetrics: TelemetryMetrics) => {
        setMetrics(updatedMetrics);
      };

      const handleSystemEvent = (evt: { id: string; time: string; type: string; message: string }) => {
        const newLog = {
          id: evt.id || Date.now().toString(),
          time: evt.time || new Date().toLocaleTimeString(),
          type: evt.type || 'SYSTEM_EVENT',
          msg: `[${evt.type}] ${evt.message}`,
        };
        setEventLogs((prev) => [newLog, ...prev.slice(0, 25)]);
      };

      socket.on('admin_metrics_update', handleUpdate);
      socket.on('admin_system_event', handleSystemEvent);

      return () => {
        socket.emit('leave_admin_metrics');
        socket.off('admin_metrics_update', handleUpdate);
        socket.off('admin_system_event', handleSystemEvent);
      };
    }
  }, [socket]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-brand-500 animate-pulse" />
            <span>Real-Time System Monitoring</span>
          </h2>
          <p className="text-xs text-slate-500">Live WebSockets Telemetry Feed</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Snapshot</span>
        </button>
      </div>

      {/* Live Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl text-white shadow-md">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400">CPU LOAD</span>
            <Cpu className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold">{metrics ? `${metrics.cpuUsage}%` : '--'}</div>
          <div className="mt-3 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (metrics?.cpuUsage || 0) > 80 ? 'bg-rose-500' : 'bg-brand-500'
              }`}
              style={{ width: `${metrics?.cpuUsage || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl text-white shadow-md">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400">MEMORY (RAM)</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold">{metrics ? `${metrics.memoryUsagePct}%` : '--'}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics ? `${metrics.totalMemoryMB - metrics.freeMemoryMB}MB / ${metrics.totalMemoryMB}MB` : 'Calculating...'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl text-white shadow-md">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400">DB QUERY LATENCY</span>
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold">{metrics ? `${metrics.dbLatencyMs} ms` : '--'}</div>
          <p className="text-[11px] text-emerald-400 mt-1 font-semibold">PostgreSQL Healthy</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl text-white shadow-md">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400">LIVE ACTIVE CALLS</span>
            <PhoneCall className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold">{metrics ? metrics.activeCalls : 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Voice & Video Sessions</p>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slow Endpoints */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">API Response Latency & Slow Endpoints</h3>
          <div className="space-y-3">
            {metrics?.slowEndpoints.map((ep, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-mono font-semibold text-slate-700">{ep.endpoint}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400">{ep.hits} hits</span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 font-bold">{ep.avgTimeMs} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Timeline Stream */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center justify-between">
            <span>Live Event Stream</span>
            <span className="text-xs text-emerald-500 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>WebSocket Active</span>
            </span>
          </h3>
          <div className="flex-1 max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
            {eventLogs.length === 0 ? (
              <p className="text-slate-400 italic">Listening for live system telemetry events...</p>
            ) : (
              eventLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">{log.msg}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitoringTab;
