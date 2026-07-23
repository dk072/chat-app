import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, MessageSquare, AlertOctagon, X, Ban, RefreshCw, CheckCircle, BarChart2, Trash2, Eye, EyeOff, Key, Copy, Check } from 'lucide-react';
import api from '../../services/api';
import { User, Report, AdminStats } from '../../types';
import Avatar from '../ui/Avatar';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'users' | 'reports' | 'analytics';

const Dashboard: React.FC<DashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Visibility & Reset Modal State
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    user: User | null;
    newPassword: string;
    loading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    user: null,
    newPassword: '',
    loading: false,
    error: null,
  });

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?query=${userQuery}`);
      setUsersList(res.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/admin/reports');
      setReportsList(res.data.reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchUsers(), fetchReports()]);
    } catch (err) {
      setError('Failed to fetch administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Debounced user query search
  useEffect(() => {
    if (isOpen) {
      const delayDebounce = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [userQuery]);

  const handleBanToggle = async (userId: string) => {
    try {
      const res = await api.post(`/admin/users/${userId}/ban`);
      // Update local lists
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBanned: res.data.isBanned } : u))
      );
      setReportsList((prev) =>
        prev.map((r) =>
          r.reported.id === userId
            ? { ...r, reported: { ...r.reported, isBanned: res.data.isBanned } }
            : r
        )
      );
      fetchStats();
    } catch (err) {
      alert('Could not toggle ban status.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? All their messages and data will be removed.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      setReportsList((prev) => prev.filter((r) => r.reported.id !== userId && r.reporter.id !== userId));
      fetchStats();
    } catch (err) {
      alert('Could not delete user.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModal.user) return;
    if (!resetPasswordModal.newPassword || resetPasswordModal.newPassword.length < 4) {
      setResetPasswordModal((prev) => ({ ...prev, error: 'Password must be at least 4 characters long.' }));
      return;
    }

    setResetPasswordModal((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await api.post(`/admin/users/${resetPasswordModal.user.id}/password`, {
        newPassword: resetPasswordModal.newPassword,
      });
      alert(res.data.message || 'Password updated successfully!');
      setResetPasswordModal({ isOpen: false, user: null, newPassword: '', loading: false, error: null });
      fetchUsers();
    } catch (err: any) {
      setResetPasswordModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Failed to update password.',
      }));
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await api.post(`/admin/reports/${reportId}/resolve`);
      setReportsList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'RESOLVED' as const } : r))
      );
      fetchStats();
    } catch (err) {
      alert('Could not resolve report.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-chat-bg-light dark:bg-chat-bg-dark flex flex-col h-full w-full select-none overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-chat-border-light dark:border-chat-border-dark bg-chat-panel-light dark:bg-chat-panel-dark flex items-center justify-between">
        <div className="flex items-center space-x-3 text-brand-500 dark:text-brand-400">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="text-xl font-bold">Admin Control Center</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* 1. Statistics Cards Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl glass-panel flex items-center space-x-4 shadow-sm border border-slate-700/10 dark:border-white/5">
              <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Total Registered</span>
                <span className="text-2xl font-bold">{stats.totalUsers}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-panel flex items-center space-x-4 shadow-sm border border-slate-700/10 dark:border-white/5">
              <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-500">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Messages Exchanged</span>
                <span className="text-2xl font-bold">{stats.totalMessages}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-panel flex items-center space-x-4 shadow-sm border border-slate-700/10 dark:border-white/5">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Active Today</span>
                <span className="text-2xl font-bold">{stats.activeUsers}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-panel flex items-center space-x-4 shadow-sm border border-slate-700/10 dark:border-white/5">
              <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-500">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Pending Reports</span>
                <span className="text-2xl font-bold">{stats.pendingReports}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Navigation Tabs */}
        <div className="flex border-b border-chat-border-light dark:border-chat-border-dark space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 font-semibold transition-colors ${
              activeTab === 'users' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            User Management ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 font-semibold transition-colors ${
              activeTab === 'reports' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Abuse Reports ({reportsList.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 font-semibold transition-colors ${
              activeTab === 'analytics' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System Analytics
          </button>
        </div>

        {/* 3. Render Tabs details */}
        <div className="mt-4">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="max-w-md">
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Filter users by username or email..."
                  className="block w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-brand-500/50 focus:outline-none text-xs"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-2xl border border-chat-border-light dark:border-chat-border-dark bg-chat-panel-light dark:bg-chat-panel-dark">
                <table className="min-w-full divide-y divide-slate-700/20 text-left text-xs">
                  <thead className="bg-slate-100/50 dark:bg-slate-950/20 font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Password / Hash</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/25">
                    {usersList.length > 0 ? (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                          <td className="px-6 py-4 flex items-center space-x-3">
                            <Avatar src={u.profilePicture} name={u.username} size="xs" />
                            <span className="font-bold">{u.username}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{u.email}</td>
                          <td className="px-6 py-4 text-slate-400">
                            <div className="flex items-center space-x-2">
                              <span
                                className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 max-w-[120px] truncate"
                                title={u.passwordHash || u.password || 'Encrypted Hash'}
                              >
                                {visiblePasswords[u.id]
                                  ? u.passwordHash || u.password || '$2b$10$EncryptedPasswordHash'
                                  : '••••••••••••'}
                              </span>
                              <button
                                onClick={() => setVisiblePasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                                title={visiblePasswords[u.id] ? 'Hide Password Hash' : 'Show Password Hash'}
                              >
                                {visiblePasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              {visiblePasswords[u.id] && u.passwordHash && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(u.passwordHash || '');
                                    setCopiedUserId(u.id);
                                    setTimeout(() => setCopiedUserId(null), 2000);
                                  }}
                                  className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                                  title="Copy Password Hash"
                                >
                                  {copiedUserId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-500/15 text-slate-400'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.isBanned ? (
                              <span className="text-rose-500 font-bold">Suspended</span>
                            ) : (
                              <span className="text-emerald-500">Active</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {u.role !== 'ADMIN' && (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() =>
                                    setResetPasswordModal({
                                      isOpen: true,
                                      user: u,
                                      newPassword: '',
                                      loading: false,
                                      error: null,
                                    })
                                  }
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all hover:shadow-sm bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/10"
                                  title="Reset Password"
                                >
                                  <Key className="w-3 h-3" />
                                  <span>Password</span>
                                </button>
                                <button
                                  onClick={() => handleBanToggle(u.id)}
                                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all hover:shadow-sm ${
                                    u.isBanned
                                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/10'
                                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/10'
                                  }`}
                                >
                                  {u.isBanned ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Unban</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3 h-3" />
                                      <span>Suspend</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all hover:shadow-sm bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-600/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">No users found matching query.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="overflow-x-auto rounded-2xl border border-chat-border-light dark:border-chat-border-dark bg-chat-panel-light dark:bg-chat-panel-dark">
              <table className="min-w-full divide-y divide-slate-700/20 text-left text-xs">
                <thead className="bg-slate-100/50 dark:bg-slate-950/20 font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Reporter</th>
                    <th className="px-6 py-4">Reported User</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Resolve</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/25">
                  {reportsList.length > 0 ? (
                    reportsList.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="px-6 py-4 font-bold">{r.reporter.username}</td>
                        <td className="px-6 py-4 flex items-center space-x-2">
                          <span className="font-bold">{r.reported.username}</span>
                          {r.reported.isBanned && (
                            <span className="text-[9px] bg-rose-500/10 text-rose-500 px-1 rounded">Banned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs text-slate-400 truncate" title={r.reason}>
                          {r.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                            r.status === 'RESOLVED' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500 animate-pulse'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {r.status === 'PENDING' ? (
                            <button
                              onClick={() => handleResolveReport(r.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/10 font-bold text-[9px]"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-slate-500 italic">Resolved</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleBanToggle(r.reported.id)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all hover:shadow-sm ${
                              r.reported.isBanned
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{r.reported.isBanned ? 'Unban' : 'Ban'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">No reports logged in the database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'analytics' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Message Types breakdown chart */}
              <div className="p-6 rounded-2xl glass-panel space-y-4">
                <h3 className="text-sm font-bold flex items-center space-x-2">
                  <BarChart2 className="w-4.5 h-4.5 text-brand-500" />
                  <span>Message Breakdown by Type</span>
                </h3>
                <div className="space-y-3">
                  {stats.messageBreakdown.length > 0 ? (
                    stats.messageBreakdown.map((item) => {
                      const percentage = ((item.count / stats.totalMessages) * 100).toFixed(1);
                      return (
                        <div key={item.type} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="capitalize">{item.type.toLowerCase()}</span>
                            <span>{item.count} ({percentage}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-8">No messages recorded.</p>
                  )}
                </div>
              </div>

              {/* Recent user signups */}
              <div className="p-6 rounded-2xl glass-panel space-y-4">
                <h3 className="text-sm font-bold flex items-center space-x-2">
                  <Users className="w-4.5 h-4.5 text-brand-500" />
                  <span>Recent System Registrations</span>
                </h3>
                <div className="space-y-3">
                  {stats.recentUsers.map((ru) => (
                    <div
                      key={ru.id}
                      className="flex justify-between items-center p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/20 text-xs border border-slate-700/5 dark:border-white/5"
                    >
                      <div>
                        <span className="font-bold block">{ru.username}</span>
                        <span className="text-[10px] text-slate-500 block">{ru.email}</span>
                      </div>
                      <span className="text-slate-400">
                        {new Date(ru.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Reset Password Modal */}
      {resetPasswordModal.isOpen && resetPasswordModal.user && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">Reset Password</h3>
                  <p className="text-xs text-slate-500">
                    Target User: <span className="font-bold text-slate-700 dark:text-slate-300">@{resetPasswordModal.user.username}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetPasswordModal({ isOpen: false, user: null, newPassword: '', loading: false, error: null })}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetPasswordModal.error && (
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-semibold">
                {resetPasswordModal.error}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={resetPasswordModal.newPassword}
                  onChange={(e) =>
                    setResetPasswordModal((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter new password..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Updating password will immediately hash credentials and update user access.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordModal({ isOpen: false, user: null, newPassword: '', loading: false, error: null })}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordModal.loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {resetPasswordModal.loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
