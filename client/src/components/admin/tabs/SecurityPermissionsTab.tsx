import React, { useEffect, useState } from 'react';
import { Shield, Lock, UserX, CheckCircle, Clock, AlertTriangle, Plus, Trash2, Key } from 'lucide-react';
import api from '../../../services/api';
import type { AuditLogItem, IpRuleItem, ApprovalRequestItem } from '../../../types/admin';

const SecurityPermissionsTab: React.FC = () => {
  const [activeSecTab, setActiveSecTab] = useState<'audit' | 'sessions' | 'iprules' | 'approvals'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [ipRules, setIpRules] = useState<IpRuleItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequestItem[]>([]);
  
  const [newIp, setNewIp] = useState('');
  const [newIpType, setNewIpType] = useState<'BLACKLIST' | 'WHITELIST'>('BLACKLIST');
  const [newIpReason, setNewIpReason] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const loadData = async () => {
    try {
      const [auditRes, ipRes, approvalRes] = await Promise.all([
        api.get('/admin/advanced/audit-logs'),
        api.get('/admin/advanced/security/ip-rules'),
        api.get('/admin/advanced/security/approval-requests'),
      ]);
      setAuditLogs(auditRes.data.logs);
      setIpRules(ipRes.data.rules);
      setApprovals(approvalRes.data.requests);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddIpRule = async () => {
    if (!newIp.trim()) return;
    try {
      await api.post('/admin/advanced/security/ip-rules', {
        ip: newIp,
        type: newIpType,
        reason: newIpReason,
      });
      setNewIp('');
      setNewIpReason('');
      loadData();
    } catch (err) {
      alert('Error adding IP rule');
    }
  };

  const handleRemoveIpRule = async (ip: string) => {
    try {
      await api.delete(`/admin/advanced/security/ip-rules/${ip}`);
      loadData();
    } catch (err) {
      alert('Error removing IP rule');
    }
  };

  const handleForceLogout = async () => {
    if (!targetUserId.trim()) return;
    try {
      await api.post('/admin/advanced/security/force-logout', { userId: targetUserId });
      alert(`Force logout issued for User ID: ${targetUserId}`);
      setTargetUserId('');
    } catch (err) {
      alert('Failed to execute force logout');
    }
  };

  const handleProcessApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.post(`/admin/advanced/security/approval-requests/${id}/process`, { status });
      loadData();
    } catch (err) {
      alert('Error processing approval request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-indigo-500" />
            <span>Security Controls & Admin Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-500">Audit Logs, Active Session Killswitch, IP Rules & 2-Person Approval Queue</p>
        </div>

        <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSecTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSecTab === 'audit' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveSecTab('sessions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSecTab === 'sessions' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Session Killswitch
          </button>
          <button
            onClick={() => setActiveSecTab('iprules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSecTab === 'iprules' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            IP Rules
          </button>
          <button
            onClick={() => setActiveSecTab('approvals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSecTab === 'approvals' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2-Person Approvals
          </button>
        </div>
      </div>

      {/* Audit Logs Subtab */}
      {activeSecTab === 'audit' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Admin Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-semibold pl-4">Admin ID</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Target</th>
                  <th className="pb-3 font-semibold">IP Address</th>
                  <th className="pb-3 font-semibold text-right pr-4">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      No admin audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pl-4 font-mono font-bold text-slate-700">{log.adminId.substring(0, 8)}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">
                        {log.targetType}: {log.targetId || 'N/A'}
                      </td>
                      <td className="py-3 font-mono text-slate-500">{log.ipAddress}</td>
                      <td className="py-3 text-right pr-4 text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Session Killswitch Subtab */}
      {activeSecTab === 'sessions' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <UserX className="w-4 h-4 text-rose-500" />
            <span>Force Session Termination</span>
          </h3>
          <p className="text-xs text-slate-500">
            Immediately invalidate active user JWT sessions and force disconnect active WebSockets across all devices.
          </p>

          <div className="flex space-x-3 items-center max-w-md">
            <input
              type="text"
              placeholder="Target User UUID..."
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleForceLogout}
              disabled={!targetUserId.trim()}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all"
            >
              Force Logout
            </button>
          </div>
        </div>
      )}

      {/* IP Rules Subtab */}
      {activeSecTab === 'iprules' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-800">IP Blacklist & Whitelist Management</h3>

          {/* Add Rule Form */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              placeholder="IP Address (e.g., 192.168.1.50)"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
            />
            <select
              value={newIpType}
              onChange={(e) => setNewIpType(e.target.value as any)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
            >
              <option value="BLACKLIST">BLACKLIST</option>
              <option value="WHITELIST">WHITELIST</option>
            </select>
            <input
              type="text"
              placeholder="Reason for rule..."
              value={newIpReason}
              onChange={(e) => setNewIpReason(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
            />
            <button
              onClick={handleAddIpRule}
              disabled={!newIp.trim()}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
            >
              Add Rule
            </button>
          </div>

          {/* IP Rules Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-semibold pl-4">IP Address</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {ipRules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                      No active IP restriction rules.
                    </td>
                  </tr>
                ) : (
                  ipRules.map((rule) => (
                    <tr key={rule.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pl-4 font-mono font-bold text-slate-800">{rule.ip}</td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${
                            rule.type === 'BLACKLIST' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {rule.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{rule.reason || 'N/A'}</td>
                      <td className="py-3 text-right pr-4">
                        <button
                          onClick={() => handleRemoveIpRule(rule.ip)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-bold transition-all"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2-Person Approvals Subtab */}
      {activeSecTab === 'approvals' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Two-Person Approval Request Queue</h3>
          <p className="text-xs text-slate-500">High-risk actions (e.g. permanent user deletion) require secondary administrator review.</p>

          <div className="space-y-3">
            {approvals.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No pending approval requests.</p>
            ) : (
              approvals.map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{req.actionType}</span>
                    <p className="text-slate-500">Requested by: {req.requestedBy}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {req.status}
                    </span>

                    {req.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <button onClick={() => handleProcessApproval(req.id, 'APPROVED')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold">
                          Approve
                        </button>
                        <button onClick={() => handleProcessApproval(req.id, 'REJECTED')} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPermissionsTab;
