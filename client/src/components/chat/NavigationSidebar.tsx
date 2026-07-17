import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Phone, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedAvatar from '../ui/AnimatedAvatar';

interface NavigationSidebarProps {
  onOpenSettings: () => void;
  activeView: 'chats' | 'calls' | 'admin';
  setActiveView: (view: 'chats' | 'calls' | 'admin') => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ 
  onOpenSettings, 
  activeView, 
  setActiveView 
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const NavItem = ({ 
    id, 
    icon: Icon, 
    label, 
    onClick, 
    isActive 
  }: { 
    id: string; 
    icon: any; 
    label: string; 
    onClick: () => void; 
    isActive?: boolean;
  }) => (
    <div className="relative group flex items-center justify-center">
      {isActive && (
        <motion.div
          layoutId="active-nav-indicator"
          className="absolute left-0 w-1 h-8 bg-brand-500 rounded-r-full shadow-neon-brand"
        />
      )}
      <button
        onClick={onClick}
        className={`p-3 rounded-2xl transition-all duration-300 relative ${
          isActive 
            ? 'bg-brand-500/10 text-brand-500' 
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Icon className="w-6 h-6" />
      </button>

      {/* Tooltip */}
      <div className="absolute left-14 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </div>
    </div>
  );

  return (
    <div className="w-[72px] h-full flex flex-col items-center py-6 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-r border-slate-200/50 dark:border-white/5 shadow-glass-light dark:shadow-glass-dark z-20">
      
      {/* Top section: Avatar */}
      <div className="mb-8">
        <AnimatedAvatar 
          src={user?.profilePicture} 
          name={user?.username || ''} 
          size="md" 
          isOnline={true} 
          className="shadow-sm"
        />
      </div>

      {/* Middle section: Navigation Icons */}
      <div className="flex-1 flex flex-col space-y-4 w-full">
        <NavItem 
          id="chats" 
          icon={MessageSquare} 
          label="All Chats" 
          isActive={activeView === 'chats'} 
          onClick={() => setActiveView('chats')} 
        />
        <NavItem 
          id="calls" 
          icon={Phone} 
          label="Calls" 
          isActive={activeView === 'calls'} 
          onClick={() => setActiveView('calls')} 
        />
        {user?.role === 'ADMIN' && (
          <NavItem 
            id="admin" 
            icon={LayoutDashboard} 
            label="Admin Dashboard" 
            isActive={activeView === 'admin'} 
            onClick={() => window.location.href = '/admin'} 
          />
        )}
      </div>

      {/* Bottom section: Settings & Logout */}
      <div className="flex flex-col space-y-4 w-full mt-auto">
        <NavItem 
          id="settings" 
          icon={Settings} 
          label="Settings" 
          onClick={onOpenSettings} 
        />
        <NavItem 
          id="logout" 
          icon={LogOut} 
          label="Log Out" 
          onClick={handleLogout} 
        />
      </div>
      
    </div>
  );
};

export default NavigationSidebar;
