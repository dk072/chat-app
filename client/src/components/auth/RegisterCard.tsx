import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import MotionInput from '../ui/MotionInput';
import MotionButton from '../ui/MotionButton';

interface RegisterCardProps {
  onToggle: () => void;
}

const RegisterCard: React.FC<RegisterCardProps> = ({ onToggle }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all details.');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-md p-8" variant="auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-extrabold tracking-tight bg-gradient-to-r from-brand-400 to-indigo-500 bg-clip-text text-transparent">
          Get Started
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Create an account to start sharing rich media
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <MotionInput
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. alice"
          icon={<User className="w-5 h-5" />}
          disabled={loading}
          required
        />

        <MotionInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. alice@chatapp.com"
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

        <MotionInput
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          <span className="mr-2">Register</span>
          <ArrowRight className="w-4 h-4" />
        </MotionButton>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">Already have an account?</span>{' '}
        <button
          onClick={onToggle}
          className="font-semibold text-brand-500 hover:text-brand-400 hover:underline transition-all"
          disabled={loading}
        >
          Sign In
        </button>
      </div>
    </GlassCard>
  );
};

export default RegisterCard;
