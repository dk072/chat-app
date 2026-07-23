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
  MessageSquareX,
  Eye,
  EyeOff,
  Key,
  Copy,
  Check,
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
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [adminSocket, setAdminSocket] = useState<any>(null);
  const [systemToast, setSystemToast] = useState<{ title: string; message: string } | null>(null);

  const realTimeOnlineCount = stats?.onlineUsers ?? users.filter((u) => u.isOnline).length;
  const displayedUsers = users.filter((u) => !filterOnlineOnly || u.isOnline);
  
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

    // Real-Time User Connection Status Listener
    socketInstance.on('user_status', ({ userId, isOnline, lastSeen }: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, isOnline, lastSeen: lastSeen || u.lastSeen } : u))
      );
      setStats((prevStats) => {
        if (!prevStats) return null;
        const currentOnline = prevStats.onlineUsers ?? 0;
        const updatedOnline = isOnline ? currentOnline + 1 : Math.max(currentOnline - 1, 0);
        return { ...prevStats, onlineUsers: updatedOnline };
      });
    });

    setAdminSocket(socketInstance);

    return () => {
      socketInstance.off('system_announcement');
      socketInstance.off('user_status');
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

  const handlePurgeUserMessages = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete ALL messages sent by @${username}? This action is permanent.`)) {
      return;
    }
    try {
      const res = await api.post(`/admin/advanced/users/${userId}/purge-messages`);
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert('Failed to purge user messages.');
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
      loadData();
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
    <div className="h-screen w-full bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Real-Time System Toast Banner */}
      {systemToast && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-brand-500 flex items-start space-x-3 max-w-sm animate-bounce">
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
      <div className="md:hidden bg-slate-900 p-4 flex justify-between items-center text-white shrink-0 z-40">
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
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex">
          <aside className="w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 p-4 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 shrink-0">
              <span className="font-bold text-white text-sm">Admin Navigation</span>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavItems()}
            <div className="pt-2 border-t border-slate-800 space-y-2 shrink-0">
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
          <div className="flex-1 touch-none" onClick={() => setIsMobileSidebarOpen(false)} />
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
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 md:p-8 flex flex-col space-y-4 sm:space-y-6 custom-admin-content-scroll">
        {/* Top Navbar */}
        <header className="flex flex-row items-center justify-between gap-2 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex-1 min-w-0 flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 hover:bg-slate-100 transition-all font-medium"
          >
            <div className="flex items-center space-x-2 min-w-0 truncate">
              <Command className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">Search commands...</span>
            </div>
            <kbd className="hidden sm:inline-flex px-2 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-bold text-slate-600 shrink-0 ml-2">
              Ctrl + K
            </kbd>
          </button>

          <button
            onClick={() => setIsCopilotOpen(true)}
            className="shrink-0 px-3 sm:px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="hidden xs:inline">Ask </span>
            <span>AI Copilot</span>
          </button>
        </header>

        {/* Stats Overview Bar */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100 flex items-center space-x-3 sm:space-x-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-500 shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Total Users</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-emerald-100 flex items-center space-x-3 sm:space-x-4 relative">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 shrink-0 relative">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Real-Time Online</p>
                <p className="text-lg sm:text-2xl font-extrabold text-emerald-600">
                  {realTimeOnlineCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100 flex items-center space-x-3 sm:space-x-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-500 shrink-0">
                <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Total Messages</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-800">{stats.totalMessages}</p>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100 flex items-center space-x-3 sm:space-x-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-500 shrink-0">
                <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Pending Reports</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-800">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Tab Content Box */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100 p-4 sm:p-6 min-h-[65vh]">
          {/* Core Tabs */}
          {activeTab === 'users' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-bold text-slate-800">User Management</h2>
                  <button
                    onClick={() => setFilterOnlineOnly(!filterOnlineOnly)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      filterOnlineOnly
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${filterOnlineOnly ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
                    <span>{filterOnlineOnly ? 'Showing Online Only' : `Online (${users.filter(u => u.isOnline).length})`}</span>
                  </button>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-sm text-slate-800"
                  />
                </div>
              </div>

              {/* Mobile Card Layout for Users */}
              <div className="md:hidden space-y-3">
                {displayedUsers.map((u) => (
                  <div key={u.id} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                          <span>{u.username}</span>
                          {u.isOnline && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {u.isOnline ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>ONLINE</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-medium">OFFLINE</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                          {u.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                      <span className="text-slate-400 text-[11px]">Password Hash:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] text-slate-700 max-w-[120px] truncate">
                          {visiblePasswords[u.id] ? u.passwordHash || u.password || '$2b$10$Encrypted' : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => setVisiblePasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                          className="p-1 text-slate-400 hover:text-slate-700 bg-white rounded border border-slate-200"
                        >
                          {visiblePasswords[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        {visiblePasswords[u.id] && u.passwordHash && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(u.passwordHash || '');
                              setCopiedUserId(u.id);
                              setTimeout(() => setCopiedUserId(null), 2000);
                            }}
                            className="p-1 text-slate-400 hover:text-brand-600 bg-white rounded border border-slate-200"
                          >
                            {copiedUserId === u.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {u.role !== 'ADMIN' && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50">
                        <button
                          onClick={() => setResetPasswordModal({ isOpen: true, user: u, newPassword: '', loading: false, error: null })}
                          className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Reset Pass</span>
                        </button>
                        <button
                          onClick={() => handleBanToggle(u.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 ${
                            u.isBanned ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {u.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          <span>{u.isBanned ? 'Unban' : 'Ban'}</span>
                        </button>
                        <button
                          onClick={() => handlePurgeUserMessages(u.id, u.username)}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <MessageSquareX className="w-3.5 h-3.5" />
                          <span>Purge Msgs</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm text-slate-500">
                      <th className="pb-4 font-medium pl-4">User</th>
                      <th className="pb-4 font-medium">Email</th>
                      <th className="pb-4 font-medium">Password / Hash</th>
                      <th className="pb-4 font-medium">Joined</th>
                      <th className="pb-4 font-medium">Role</th>
                      <th className="pb-4 font-medium">Status / Presence</th>
                      <th className="pb-4 font-medium text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUsers.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pl-4 font-medium text-slate-800 flex items-center space-x-2">
                          <span>{u.username}</span>
                          {u.isOnline && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-slate-500 text-sm">{u.email}</td>
                        <td className="py-4 text-slate-600 text-xs">
                          <div className="flex items-center space-x-2">
                            <span
                              className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] text-slate-700 max-w-[140px] truncate"
                              title={u.passwordHash || u.password || 'Password Hash Encrypted'}
                            >
                              {visiblePasswords[u.id]
                                ? u.passwordHash || u.password || '$2b$10$EncryptedPasswordHash'
                                : '••••••••••••'}
                            </span>
                            <button
                              onClick={() => setVisiblePasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                              className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
                                className="p-1.5 text-slate-400 hover:text-brand-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                title="Copy Password Hash"
                              >
                                {copiedUserId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
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
                          <div className="flex items-center space-x-2">
                            {u.isOnline ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Online</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium inline-flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>Offline</span>
                              </span>
                            )}
                            {u.isBanned && (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold">Banned</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right pr-4">
                          {u.role !== 'ADMIN' && (
                            <div className="flex items-center justify-end space-x-2">
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
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center space-x-1"
                                title="Reset user password"
                              >
                                <Key className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Password</span>
                              </button>
                              <button
                                onClick={() => handleBanToggle(u.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  u.isBanned
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                } flex items-center space-x-1`}
                              >
                                {u.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                <span>{u.isBanned ? 'Unban' : 'Ban'}</span>
                              </button>
                              <button
                                onClick={() => handlePurgeUserMessages(u.id, u.username)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center space-x-1"
                                title="One-click delete all messages sent by this user"
                              >
                                <MessageSquareX className="w-3.5 h-3.5 text-amber-600" />
                                <span>Purge Msgs</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-50 text-red-600 hover:bg-red-100 flex items-center space-x-1"
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

      {/* Admin User Reset Password Modal */}
      {resetPasswordModal.isOpen && resetPasswordModal.user && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Reset Password</h3>
                  <p className="text-xs text-slate-500">
                    Target User: <span className="font-bold text-slate-700">@{resetPasswordModal.user.username}</span>
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
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">
                {resetPasswordModal.error}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Updating password will immediately hash the credentials and update user access.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordModal({ isOpen: false, user: null, newPassword: '', loading: false, error: null })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
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
