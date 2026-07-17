import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

interface LoginCardProps {
  onToggle: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onToggle }) => {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrUsername || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    try {
      await login(emailOrUsername, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl glass-panel shadow-glass-dark transition-all duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-400 to-indigo-500 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Log in to continue chatting with your friends
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium text-center animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Email or Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="e.g. alice or alice@chatapp.com"
              className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-black focus:outline-none text-sm transition-all duration-200"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-black focus:outline-none text-sm transition-all duration-200"
              disabled={loading}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          style={{ backgroundColor: 'rgb(var(--accent-color))' }}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">New to Chime?</span>{' '}
        <button
          onClick={onToggle}
          className="font-semibold text-brand-500 hover:text-brand-400 hover:underline transition-all"
          disabled={loading}
        >
          Create an Account
        </button>
      </div>
    </div>
  );
};

export default LoginCard;
