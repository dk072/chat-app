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
import ChatWindow from './components/chat/ChatWindow';
import SettingsModal from './components/chat/SettingsModal';
import CallOverlay from './components/call/CallOverlay';
import AdminDashboard from './pages/admin/AdminDashboard';
import AnimatedBackground from './components/ui/AnimatedBackground';
import PageTransition from './components/ui/PageTransition';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeChat } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-chat-bg-dark text-white select-none">
        <div className="text-5xl animate-bounce mb-4">💬</div>
        <h2 className="text-xl font-bold tracking-widest bg-gradient-to-r from-brand-400 to-indigo-500 bg-clip-text text-transparent animate-pulse">
          CHIME
        </h2>
        <span className="text-xs text-slate-500 mt-2">Connecting to secure server...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-slate-900 overflow-hidden relative">
        <AnimatedBackground />

        <div className="z-10 w-full px-4 flex justify-center">
          <PageTransition>
            {isLoginView ? (
              <LoginCard onToggle={() => setIsLoginView(false)} />
            ) : (
              <RegisterCard onToggle={() => setIsLoginView(true)} />
            )}
          </PageTransition>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden relative text-slate-800 dark:text-slate-100 selection:bg-brand-500/30">
      <AnimatedBackground />
      <div className={`h-full shrink-0 w-full md:w-80 glass-panel border-r border-slate-200/20 dark:border-white/5 ${activeChat ? 'hidden md:block' : 'block'}`}>
        <Sidebar onOpenSettings={() => setShowSettings(true)} />
      </div>

      <div className={`flex-1 h-full flex-col min-w-0 relative ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        <ChatWindow />
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenAdmin={() => window.location.href = '/admin'}
      />

      <CallOverlay />
    </div>
  );
};

const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  return <AdminDashboard />;
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
                  <Route path="/" element={<MainLayout />} />
                  <Route path="/admin" element={<AdminRoute />} />
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
