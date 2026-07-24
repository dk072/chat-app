import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import LoginCard from './components/auth/LoginCard';
import RegisterCard from './components/auth/RegisterCard';
import Sidebar from './components/chat/Sidebar';
import NavigationSidebar from './components/chat/NavigationSidebar';
import ChatWindow from './components/chat/ChatWindow';
import CallOverlay from './components/call/CallOverlay';
import AnimatedBackground from './components/ui/AnimatedBackground';
import PageTransition from './components/ui/PageTransition';
import { CallSidebar } from './components/chat/CallSidebar';
import PanicButton from './components/chat/PanicButton';

import LoginPage from './pages/LoginPage';

import PremiumLoadingScreen from './components/ui/PremiumLoadingScreen';

// Lazy-loaded heavy components for code-splitting and faster initial page loads
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const SettingsModal = React.lazy(() => import('./components/chat/SettingsModal'));
const StarredMessagesDrawer = React.lazy(() =>
  import('./components/chat/StarredMessagesDrawer').then((m) => ({ default: m.StarredMessagesDrawer }))
);
const AppLockModal = React.lazy(() =>
  import('./components/chat/AppLockModal').then((m) => ({ default: m.AppLockModal }))
);

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeChat } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [activeNavView, setActiveNavView] = useState<'chats' | 'calls' | 'admin'>('chats');
  const [loadingText, setLoadingText] = useState('Connecting to secure server...');

  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingText('Waking up live server (this may take up to 50 seconds)...');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return <PremiumLoadingScreen customText={loadingText} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col-reverse md:flex-row overflow-hidden relative text-slate-800 dark:text-slate-100 selection:bg-brand-500/30">
      <AnimatedBackground />

      {/* Column 1: Navigation Sidebar (Hidden on mobile if chat is active) */}
      <div className={`w-full md:w-auto h-auto md:h-full shrink-0 z-50 ${activeChat ? 'hidden md:block' : 'block'}`}>
        <NavigationSidebar 
          onOpenSettings={() => setShowSettings(true)} 
          onOpenStarred={() => setShowStarred(true)}
          onLockApp={() => setIsAppLocked(true)}
          activeView={activeNavView}
          setActiveView={setActiveNavView}
        />
      </div>

      {/* Column 2: Chat List (Hidden on mobile if chat is active) */}
      <div className={`flex-1 md:flex-none md:h-full shrink-0 w-full md:w-64 lg:w-80 glass-panel border-r border-slate-200/20 dark:border-white/5 overflow-hidden ${activeChat ? 'hidden md:block' : 'block'}`}>
        {activeNavView === 'chats' ? (
          <Sidebar />
        ) : activeNavView === 'calls' ? (
          <CallSidebar />
        ) : (
          <div className="flex-1 h-full flex items-center justify-center text-slate-400">
            Coming soon...
          </div>
        )}
      </div>

      {/* Column 3: Main Chat Window */}
      <div className={`flex-1 min-h-0 md:h-full flex-col min-w-0 relative ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        <ChatWindow />
      </div>

      <React.Suspense fallback={null}>
        {showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onOpenAdmin={() => (window.location.href = '/admin')}
          />
        )}

        {showStarred && (
          <StarredMessagesDrawer
            isOpen={showStarred}
            onClose={() => setShowStarred(false)}
          />
        )}

        {isAppLocked && (
          <AppLockModal
            isLocked={isAppLocked}
            onUnlock={() => setIsAppLocked(false)}
          />
        )}
      </React.Suspense>

      <CallOverlay />
      <PanicButton />
    </div>
  );
};

const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold animate-pulse">Loading Admin Workspace...</div>;
  }
  
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold animate-pulse">Loading Dashboard Modules...</div>}>
      <AdminDashboard />
    </React.Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <ChatProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<LoginPage />} />
                  <Route path="/" element={<MainLayout />} />
                  <Route path="/admin" element={<AdminRoute />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </ChatProvider>
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
