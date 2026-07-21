import React, { useEffect, useState } from 'react';
import { Users, AlertOctagon, BarChart2, Shield, LogOut, Search, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { User, Report, AdminStats } from '../../types';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'analytics'>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/users?query=${searchQuery}`),
        api.get('/admin/reports')
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setReports(reportsRes.data.reports);
    } catch (err) {
      console.error(err);
      if ((err as any).response?.status === 401) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleBanToggle = async (userId: string) => {
    try {
      const res = await api.post(`/admin/users/${userId}/ban`);
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: res.data.isBanned } : u));
      loadData();
    } catch (err) {
      alert('Failed to toggle ban status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      loadData();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await api.post(`/admin/reports/${reportId}/resolve`);
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'RESOLVED' } : r));
      loadData();
    } catch (err) {
      alert('Failed to resolve report');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Shield className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-brand-500/10 text-brand-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Users className="w-5 h-5" />
            <span>Users</span>
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-brand-500/10 text-brand-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
            <AlertOctagon className="w-5 h-5" />
            <span>Reports</span>
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-brand-500/10 text-brand-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
            <BarChart2 className="w-5 h-5" />
            <span>Analytics</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden p-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-500"><Users className="w-6 h-6" /></div>
              <div><p className="text-sm text-slate-500 font-medium">Total Users</p><p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-500"><BarChart2 className="w-6 h-6" /></div>
              <div><p className="text-sm text-slate-500 font-medium">Total Messages</p><p className="text-2xl font-bold text-slate-800">{stats.totalMessages}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-500"><CheckCircle className="w-6 h-6" /></div>
              <div><p className="text-sm text-slate-500 font-medium">Active Today</p><p className="text-2xl font-bold text-slate-800">{stats.activeUsers}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-500"><AlertOctagon className="w-6 h-6" /></div>
              <div><p className="text-sm text-slate-500 font-medium">Pending Reports</p><p className="text-2xl font-bold text-slate-800">{stats.pendingReports}</p></div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 min-h-[60vh]">
          
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">User Management</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm w-64" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm text-slate-500">
                      <th className="pb-4 font-medium pl-4">User</th>
                      <th className="pb-4 font-medium">Email</th>
                      <th className="pb-4 font-medium">Joined</th>
                      <th className="pb-4 font-medium">Role</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pl-4 font-medium text-slate-800">{u.username}</td>
                        <td className="py-4 text-slate-500 text-sm">{u.email}</td>
                        <td className="py-4 text-slate-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span></td>
                        <td className="py-4">{u.isBanned ? <span className="text-rose-500 text-sm font-medium">Banned</span> : <span className="text-emerald-500 text-sm font-medium">Active</span>}</td>
                        <td className="py-4 text-right pr-4">
                          {u.role !== 'ADMIN' && (
                            <div className="flex items-center justify-end space-x-2">
                              <button onClick={() => handleBanToggle(u.id)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${u.isBanned ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'} flex items-center space-x-1`}>
                                {u.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                <span>{u.isBanned ? 'Unban' : 'Ban'}</span>
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-50 text-red-600 hover:bg-red-100 flex items-center space-x-1">
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-6">Abuse Reports</h2>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {reports.map(r => (
                  <div key={r.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Report ID: {r.id.substring(0,8)}</span>
                        <h3 className="font-bold text-slate-800">{r.reported.username} <span className="text-slate-400 font-normal text-sm">reported by</span> {r.reporter.username}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4 bg-white p-3 rounded-xl border border-slate-100">{r.reason}</p>
                    <div className="flex justify-end space-x-3">
                      <button onClick={() => handleBanToggle(r.reported.id)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${r.reported.isBanned ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
                        <Ban className="w-3.5 h-3.5" /><span>{r.reported.isBanned ? 'Unban User' : 'Ban User'}</span>
                      </button>
                      {r.status === 'PENDING' && (
                        <button onClick={() => handleResolveReport(r.id)} className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-semibold transition-all">
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && stats && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-6">System Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center space-x-2"><BarChart2 className="w-4 h-4 text-brand-500" /><span>Message Types Breakdown</span></h3>
                  <div className="space-y-4">
                    {stats.messageBreakdown.map((item) => {
                      const percentage = ((item.count / stats.totalMessages) * 100).toFixed(1);
                      return (
                        <div key={item.type}>
                          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                            <span className="capitalize">{item.type.toLowerCase()}</span>
                            <span>{item.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center space-x-2"><Users className="w-4 h-4 text-brand-500" /><span>Recent Registrations</span></h3>
                  <div className="space-y-3">
                    {stats.recentUsers.map((ru) => (
                      <div key={ru.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{ru.username}</p>
                          <p className="text-xs text-slate-500">{ru.email}</p>
                        </div>
                        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                          {new Date(ru.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
