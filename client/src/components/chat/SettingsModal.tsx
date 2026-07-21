import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, AccentColor } from '../../context/ThemeContext';
import { X, Camera, Loader2, LogOut, ShieldAlert, Palette, Sun, Moon, Bell, Volume2 } from 'lucide-react';
import api from '../../services/api';
import Avatar from '../ui/Avatar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenAdmin }) => {
  const { user, updateUser, logout } = useAuth();
  const { theme, accentColor, toggleTheme, setAccentColor } = useTheme();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState<'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'>(user?.status || 'ONLINE');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profilePicture || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Avatar image must be under 10MB.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('bio', bio);
    formData.append('status', status);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  const accents: { id: AccentColor; bg: string; name: string }[] = [
    { id: 'indigo', bg: 'bg-indigo-600', name: 'Indigo' },
    { id: 'emerald', bg: 'bg-emerald-500', name: 'Emerald' },
    { id: 'sky', bg: 'bg-sky-500', name: 'Sky' },
    { id: 'rose', bg: 'bg-rose-500', name: 'Rose' },
    { id: 'amber', bg: 'bg-amber-500', name: 'Amber' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 md:bg-black/60 md:backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl glass-panel shadow-glass-dark overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-chat-border-light dark:border-chat-border-dark">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status feedback */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold text-center">
              {success}
            </div>
          )}

          {/* Admin link */}
          {user.role === 'ADMIN' && (
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-dashed border-rose-500/30 hover:border-rose-500/70 hover:bg-rose-500/5 text-rose-500 text-sm font-semibold transition-all duration-200"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Access Admin Dashboard</span>
            </button>
          )}

          {/* Edit Profile Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar
                  src={avatarPreview}
                  name={user.username}
                  size="xl"
                  className="ring-4 ring-brand-500/20 group-hover:opacity-95 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Click to change picture</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-brand-500 focus:outline-none text-sm transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Presence Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="block w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-brand-500 focus:outline-none text-sm transition-all"
              >
                <option value="ONLINE">🟢 Online</option>
                <option value="AWAY">🟡 Away</option>
                <option value="BUSY">🔴 Busy</option>
                <option value="OFFLINE">⚪ Offline</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                className="block w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-brand-500 focus:outline-none text-sm transition-all resize-none"
              />
              <div className="text-right text-xs text-slate-400">{bio.length}/160</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition-all duration-150"
              style={{ backgroundColor: 'rgb(var(--accent-color))' }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </form>

          <hr className="border-chat-border-light dark:border-chat-border-dark" />

          {/* UI Customizer Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Theme & Colors</span>
            </h3>

            {/* Dark/Light Mode */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Dark Mode</span>
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-chat-border-light dark:border-chat-border-dark hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              >
                {theme === 'dark' ? (
                  <>
                    <Moon className="w-4 h-4 text-brand-400" />
                    <span className="text-xs">Enabled</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-xs">Disabled</span>
                  </>
                )}
              </button>
            </div>

            {/* Accent selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Accent Color
              </label>
              <div className="flex space-x-3 pt-1">
                {accents.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.id)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full ${c.bg} transition-transform active:scale-90 relative ${
                      accentColor === c.id ? 'scale-115 ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <hr className="border-chat-border-light dark:border-chat-border-dark" />

          {/* Danger zone actions */}
          <div>
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-500 text-sm font-bold transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
