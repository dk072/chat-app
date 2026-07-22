import React, { useState } from 'react';
import { Bell, Send, AlertTriangle, ShieldCheck, Megaphone } from 'lucide-react';
import api from '../../../services/api';

const NotificationsTab: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sentAlerts, setSentAlerts] = useState<any[]>([]);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) return;
    try {
      await api.post('/admin/advanced/announcements/broadcast', { title, message });
      const newAlert = {
        id: Date.now().toString(),
        title,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setSentAlerts([newAlert, ...sentAlerts]);
      setTitle('');
      setMessage('');
      alert('System announcement broadcasted to all connected clients!');
    } catch (err) {
      alert('Failed to broadcast announcement.');
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <Bell className="w-5 h-5 text-amber-500" />
          <span>Smart Alerts & System Broadcast Dispatcher</span>
        </h2>
        <p className="text-xs text-slate-500">Critical Incident Alerts, Downtime Warnings & Push Announcements</p>
      </div>

      {/* Broadcast Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Megaphone className="w-4 h-4 text-brand-500" />
          <span>Broadcast Global System Announcement</span>
        </h3>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Announcement Title (e.g. Scheduled System Maintenance)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-500"
          />

          <textarea
            rows={3}
            placeholder="Notification message body..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
          />

          <button
            onClick={handleBroadcast}
            disabled={!title.trim() || !message.trim()}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Dispatch Global Announcement</span>
          </button>
        </div>
      </div>

      {/* History of broadcasts */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Recent Admin Alerts & Broadcast History</h3>
        <div className="space-y-3">
          {sentAlerts.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No broadcast announcements sent in this session.</p>
          ) : (
            sentAlerts.map((a) => (
              <div key={a.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-start text-xs">
                <div>
                  <h4 className="font-bold text-slate-800">{a.title}</h4>
                  <p className="text-slate-600 mt-1">{a.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{a.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
