import React, { useState } from 'react';
import { Users, Shield, Laptop, Globe, AlertTriangle, CheckCircle, Search, Cpu } from 'lucide-react';
import api from '../../../services/api';
import type { UserIntelligence } from '../../../types/admin';

interface UserIntelligenceTabProps {
  users: any[];
}

const UserIntelligenceTab: React.FC<UserIntelligenceTabProps> = ({ users }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [profile, setProfile] = useState<UserIntelligence | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/advanced/user-intelligence/${id}`);
      setProfile(res.data.profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (selectedUserId) fetchProfile(selectedUserId);
  }, [selectedUserId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="w-5 h-5 text-brand-500" />
            <span>Advanced User Intelligence & Risk Graph</span>
          </h2>
          <p className="text-xs text-slate-500">Multi-Account Detection, Device Signatures & IP Lineage</p>
        </div>

        {/* User Selector Dropdown */}
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username} ({u.email})
            </option>
          ))}
        </select>
      </div>

      {profile && (
        <div className="space-y-6">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">TRUST SCORE</span>
              <div className="text-3xl font-extrabold text-emerald-600">{profile.trustScore} / 100</div>
              <p className="text-[11px] text-slate-500 mt-1">Based on activity & account age</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">RISK SCORE</span>
              <div className={`text-3xl font-extrabold ${profile.riskScore > 30 ? 'text-rose-600' : 'text-slate-800'}`}>
                {profile.riskScore} / 100
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Automated threat level</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">DISPOSABLE EMAIL</span>
              <div className="mt-2">
                {profile.isDisposableEmail ? (
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg">FLAGGED</span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">VERIFIED</span>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">ALT ACCOUNT DETECTION</span>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {profile.sharedIpAccounts.length} candidates
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device History */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <Laptop className="w-4 h-4 text-brand-500" />
                <span>Device & Session History</span>
              </h3>
              <div className="space-y-3">
                {profile.devices.map((d, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{d.device}</p>
                      <p className="text-slate-500">{d.browser} • {d.os}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(d.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* IP History & Linked Accounts */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>IP Lineage & Shared Network Graph</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-bold text-slate-700 mb-2">Registered & Active IPs:</p>
                  <div className="space-y-2">
                    {profile.ipHistory.map((ipObj, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl flex justify-between font-mono">
                        <span className="font-bold text-slate-800">{ipObj.ip}</span>
                        <span className="text-slate-500">{ipObj.country}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-bold text-slate-700 mb-2">Linked Accounts Sharing Network Signatures:</p>
                  {profile.sharedIpAccounts.length === 0 ? (
                    <p className="text-slate-400 italic">No alternative accounts detected sharing IPs.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.sharedIpAccounts.map((alt, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-amber-50 text-amber-700 font-bold rounded-xl border border-amber-200">
                          @{alt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserIntelligenceTab;
