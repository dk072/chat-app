import React, { useState } from 'react';
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
import Dashboard from './components/admin/Dashboard';
import CallOverlay from './components/call/CallOverlay';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeChat } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  // 1. Loading Splash Screen
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

  // 2. Unauthenticated Login/Signup Screen
  if (!user) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-slate-900 overflow-hidden relative">
        {/* Animated background color blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" />

        <div className="z-10 w-full px-4 flex justify-center">
          {isLoginView ? (
            <LoginCard onToggle={() => setIsLoginView(false)} />
          ) : (
            <RegisterCard onToggle={() => setIsLoginView(true)} />
          )}
        </div>
      </div>
    );
  }

  // 3. Authenticated Interface
  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-chat-bg-light dark:bg-chat-bg-dark">
      {/* Sidebar List */}
      <div className={`h-full shrink-0 w-full md:w-80 ${activeChat ? 'hidden md:block' : 'block'}`}>
        <Sidebar onOpenSettings={() => setShowSettings(true)} />
      </div>

      {/* Main Content Area (Chat Window or Admin Dashboard) */}
      <div className={`flex-1 h-full flex-col min-w-0 relative ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        <ChatWindow />

        {/* Admin Dashboard Overlay */}
        <Dashboard isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
      </div>

      {/* Settings Modal Dialog */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenAdmin={() => setShowAdmin(true)}
      />

      {/* Global Call Overlay */}
      <CallOverlay />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <ChatProvider>
              <MainLayout />
            </ChatProvider>
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
