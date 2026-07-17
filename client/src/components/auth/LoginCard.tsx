import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import MotionInput from '../ui/MotionInput';
import MotionButton from '../ui/MotionButton';

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
    <GlassCard className="w-full max-w-md p-8" variant="auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-extrabold tracking-tight bg-gradient-to-r from-brand-400 to-indigo-500 bg-clip-text text-transparent">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <MotionInput
          label="Email or Username"
          type="text"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
          placeholder="e.g. alice or alice@chatapp.com"
          icon={<Mail className="w-5 h-5" />}
          disabled={loading}
          required
        />

        <MotionInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
          disabled={loading}
          required
        />

        <MotionButton
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={loading}
        >
          <span className="mr-2">Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </MotionButton>
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
    </GlassCard>
  );
};

export default LoginCard;
