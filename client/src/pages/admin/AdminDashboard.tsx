import React, { useEffect, useState } from 'react';
import {
  Users,
  AlertOctagon,
  BarChart2,
  Shield,
  LogOut,
  Search,
  Ban,
  CheckCircle,
  Trash2,
  Activity,
  Bot,
  Lock,
  FolderKey,
  Cpu,
  Terminal,
  Bell,
  Sparkles,
  Command,
  Menu,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import type { User, Report, AdminStats } from '../../types';

// Import Advanced Enterprise Tab Components
import CommandPalette from '../../components/admin/CommandPalette';
import AICopilotDrawer from '../../components/admin/AICopilotDrawer';
import RealTimeMonitoringTab from '../../components/admin/tabs/RealTimeMonitoringTab';
import SmartModerationTab from '../../components/admin/tabs/SmartModerationTab';
import UserIntelligenceTab from '../../components/admin/tabs/UserIntelligenceTab';
import InvestigationToolsTab from '../../components/admin/tabs/InvestigationToolsTab';
import SecurityPermissionsTab from '../../components/admin/tabs/SecurityPermissionsTab';
import AdvancedAnalyticsTab from '../../components/admin/tabs/AdvancedAnalyticsTab';
import FileProtectionTab from '../../components/admin/tabs/FileProtectionTab';
import PerformanceTab from '../../components/admin/tabs/PerformanceTab';
import DeveloperToolsTab from '../../components/admin/tabs/DeveloperToolsTab';
import NotificationsTab from '../../components/admin/tabs/NotificationsTab';

type AdminTab =
  | 'users'
  | 'reports'
  | 'analytics'
  | 'realtime'
  | 'moderation'
  | 'intelligence'
  | 'investigation'
  | 'security'
  | 'fileprotection'
  | 'performance'
  | 'devtools'
  | 'notifications';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [adminSocket, setAdminSocket] = useState<any>(null);
  const [systemToast, setSystemToast] = useState<{ title: string; message: string } | null>(null);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/users?query=${searchQuery}`),
        api.get('/admin/reports'),
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

  // Setup Socket connection for real-time telemetry and announcements
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('system_announcement', (announcement: { title: string; message: string }) => {
      setSystemToast(announcement);
      setTimeout(() => setSystemToast(null), 8000);
    });

    setAdminSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleBanToggle = async (userId: string) => {
    try {
      const res = await api.post(`/admin/users/${userId}/ban`);
      setUsers(users.map((u) => (u.id === userId ? { ...u, isBanned: res.data.isBanned } : u)));
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
      setUsers(users.filter((u) => u.id !== userId));
      loadData();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await api.post(`/admin/reports/${reportId}/resolve`);
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: 'RESOLVED' } : r)));
      loadData();
    } catch (err) {
      alert('Failed to resolve report');
    }
  };

  const renderNavItems = () => (
    <div className="flex-1 px-3 space-y-1 overflow-y-auto min-h-0 text-xs font-medium custom-admin-sidebar-scroll pr-2">
      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Core Management</div>
      <button
        onClick={() => { setActiveTab('users'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'users' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Users className="w-4 h-4" />
        <span>Users</span>
      </button>
      <button
        onClick={() => { setActiveTab('reports'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'reports' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <AlertOctagon className="w-4 h-4" />
        <span>Reports</span>
      </button>
      <button
        onClick={() => { setActiveTab('analytics'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'analytics' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <BarChart2 className="w-4 h-4" />
        <span>Analytics</span>
      </button>

      <div className="px-3 pt-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Advanced Enterprise</div>

      <button
        onClick={() => { setActiveTab('realtime'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'realtime' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Activity className="w-4 h-4 text-emerald-400" />
        <span>Real-Time Monitor</span>
      </button>

      <button
        onClick={() => { setActiveTab('moderation'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'moderation' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Bot className="w-4 h-4 text-indigo-400" />
        <span>AI Moderation</span>
      </button>

      <button
        onClick={() => { setActiveTab('intelligence'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'intelligence' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Users className="w-4 h-4 text-brand-400" />
        <span>User Intelligence</span>
      </button>

      <button
        onClick={() => { setActiveTab('investigation'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'investigation' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Search className="w-4 h-4 text-amber-400" />
        <span>Chat Investigation</span>
      </button>

      <button
        onClick={() => { setActiveTab('security'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'security' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Lock className="w-4 h-4 text-rose-400" />
        <span>Security & Audit</span>
      </button>

      <button
        onClick={() => { setActiveTab('fileprotection'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'fileprotection' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <FolderKey className="w-4 h-4 text-sky-400" />
        <span>File Protection</span>
      </button>

      <button
        onClick={() => { setActiveTab('performance'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'performance' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Cpu className="w-4 h-4 text-purple-400" />
        <span>Performance</span>
      </button>

      <button
        onClick={() => { setActiveTab('devtools'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'devtools' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Terminal className="w-4 h-4 text-cyan-400" />
        <span>Developer Tools</span>
      </button>

      <button
        onClick={() => { setActiveTab('notifications'); setIsMobileSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all ${
          activeTab === 'notifications' ? 'bg-brand-500/10 text-brand-400 font-bold' : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Bell className="w-4 h-4 text-amber-400" />
        <span>Alert Dispatcher</span>
      </button>
    </div>
  );


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Real-Time System Toast Banner */}
      {systemToast && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-brand-500 flex items-start space-x-3 max-w-sm animate-bounce">
          <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-white mb-0.5">{systemToast.title}</h4>
            <p className="text-slate-300">{systemToast.message}</p>
          </div>
          <button onClick={() => setSystemToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-slate-900 p-4 flex justify-between items-center text-white sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-brand-400" />
          <span className="font-bold text-sm">Enterprise Admin</span>
        </div>
        <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="p-2 rounded-xl bg-slate-800">
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Slide-Out Drawer */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex">
          <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 p-4 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">Admin Navigation</span>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavItems()}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                onClick={() => { setIsCopilotOpen(true); setIsMobileSidebarOpen(false); }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Copilot</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex h-screen sticky top-0 shrink-0 border-r border-slate-800">
        <div className="p-6 flex items-center space-x-3 mb-2 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight leading-tight">Enterprise</h1>
            <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">Admin Control Suite</p>
          </div>
        </div>

        {renderNavItems()}

        <div className="p-4 border-t border-slate-800 space-y-2 shrink-0">
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Copilot</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>


      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden p-8 flex flex-col space-y-6 custom-admin-content-scroll">
        {/* Top Navbar */}
        <header className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center space-x-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 hover:bg-slate-100 transition-all font-medium"
          >
            <Command className="w-4 h-4 text-slate-500" />
            <span>Search or run commands...</span>
            <kbd className="px-2 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-bold text-slate-600">
              Ctrl + K
            </kbd>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Copilot</span>
            </button>
          </div>
        </header>

        {/* Stats Overview Bar */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-100 flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-100 flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-500">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Messages</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalMessages}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-100 flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-500">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Active Today</p>
                <p className="text-2xl font-bold text-slate-800">{stats.activeUsers}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-100 flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-500">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Pending Reports</p>
                <p className="text-2xl font-bold text-slate-800">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Tab Content Box */}
        <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 min-h-[65vh]">
          {/* Core Tabs */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">User Management</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-sm w-64 text-slate-800"
                  />
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
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pl-4 font-medium text-slate-800">{u.username}</td>
                        <td className="py-4 text-slate-500 text-sm">{u.email}</td>
                        <td className="py-4 text-slate-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4">
                          {u.isBanned ? (
                            <span className="text-rose-500 text-sm font-medium">Banned</span>
                          ) : (
                            <span className="text-emerald-500 text-sm font-medium">Active</span>
                          )}
                        </td>
                        <td className="py-4 text-right pr-4">
                          {u.role !== 'ADMIN' && (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleBanToggle(u.id)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  u.isBanned
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                } flex items-center space-x-1`}
                              >
                                {u.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                <span>{u.isBanned ? 'Unban' : 'Ban'}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-50 text-red-600 hover:bg-red-100 flex items-center space-x-1"
                              >
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
                {reports.map((r) => (
                  <div key={r.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Report ID: {r.id.substring(0, 8)}
                        </span>
                        <h3 className="font-bold text-slate-800">
                          {r.reported.username}{' '}
                          <span className="text-slate-400 font-normal text-sm">reported by</span> {r.reporter.username}
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          r.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4 bg-white p-3 rounded-xl border border-slate-100">{r.reason}</p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleBanToggle(r.reported.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
                          r.reported.isBanned
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{r.reported.isBanned ? 'Unban User' : 'Ban User'}</span>
                      </button>
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => handleResolveReport(r.id)}
                          className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-semibold transition-all"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && <AdvancedAnalyticsTab />}

          {/* Advanced Enterprise Tabs */}
          {activeTab === 'realtime' && <RealTimeMonitoringTab socket={adminSocket} />}
          {activeTab === 'moderation' && <SmartModerationTab />}
          {activeTab === 'intelligence' && <UserIntelligenceTab users={users} />}
          {activeTab === 'investigation' && <InvestigationToolsTab />}
          {activeTab === 'security' && <SecurityPermissionsTab />}
          {activeTab === 'fileprotection' && <FileProtectionTab />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'devtools' && <DeveloperToolsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
        </div>
      </main>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab as AdminTab)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Embedded AI Copilot Assistant Drawer */}
      <AICopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </div>
  );
};

export default Dashboard;
