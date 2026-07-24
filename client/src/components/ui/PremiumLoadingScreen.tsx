import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Lock, Wifi } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';

interface PremiumLoadingScreenProps {
  customText?: string;
}

export const PremiumLoadingScreen: React.FC<PremiumLoadingScreenProps> = ({ customText }) => {
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    'Establishing 256-bit encrypted channel...',
    'Connecting to secure real-time server...',
    'Synchronizing user session & keys...',
    'Waking up live server instance...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const currentMessage = customText || statuses[statusIndex];

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-950 text-white select-none relative overflow-hidden font-sans">
      <AnimatedBackground />

      {/* Ambient background glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-violet-600/30 via-indigo-500/20 to-pink-500/30 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-cyan-500/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Glassmorphic Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(99,102,241,0.2)] max-w-sm w-[90%] text-center"
      >
        {/* Pulsating Glowing Logo Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Outer Rotating Glowing Aura Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-3 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-400 opacity-60 blur-md"
          />

          {/* Inner Badge */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-pink-500/20" />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MessageSquare className="w-9 h-9 text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
            </motion.div>

            {/* Sparkle badge */}
            <div className="absolute top-1.5 right-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-outfit font-extrabold tracking-[0.2em] bg-gradient-to-r from-violet-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          CHIME
        </h1>

        {/* Security Badge */}
        <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 tracking-wider uppercase">
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>256-Bit Encrypted Platform</span>
        </div>

        {/* Dynamic Glowing Progress Bar */}
        <div className="mt-8 w-full flex flex-col items-center space-y-3">
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
            <motion.div
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-violet-600 via-indigo-400 to-pink-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.9)]"
            />
          </div>

          {/* Animated Status Message */}
          <div className="h-6 flex items-center justify-center">
            <motion.span
              key={currentMessage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-slate-300 font-medium tracking-wide text-center truncate max-w-[260px]"
            >
              {currentMessage}
            </motion.span>
          </div>
        </div>

        {/* Connection Pulse Dots */}
        <div className="mt-4 flex items-center justify-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" style={{ animationDelay: '0s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" style={{ animationDelay: '0.4s' }} />
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="z-10 mt-6 flex items-center space-x-2 text-[11px] font-semibold text-slate-500 tracking-wider">
        <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
        <span>Real-Time Neural Engine</span>
      </div>
    </div>
  );
};

export default PremiumLoadingScreen;
