import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedAvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  status?: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  className?: string;
  onClick?: () => void;
}

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ 
  src, 
  name, 
  size = 'md', 
  isOnline, 
  status,
  className = '',
  onClick
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const getInitials = (n: string) => {
    return n.slice(0, 2).toUpperCase();
  };

  const getStatusColor = () => {
    if (!isOnline || status === 'OFFLINE') return 'bg-slate-400';
    switch (status) {
      case 'AWAY': return 'bg-amber-500';
      case 'BUSY': return 'bg-rose-500';
      case 'ONLINE':
      default: return 'bg-emerald-500';
    }
  };

  const isActuallyOnline = isOnline && status !== 'OFFLINE';
  const indicatorSizeClass = size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`relative inline-block ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      <motion.div 
        whileHover={onClick ? { scale: 1.05 } : {}}
        className={`relative rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-glass-light dark:shadow-glass-dark ${sizeClasses[size]} bg-gradient-to-br from-brand-500 to-indigo-600 border-2 border-white dark:border-slate-800 z-10`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-outfit">{getInitials(name)}</span>
        )}
      </motion.div>

      {/* Online indicator with pulse animation */}
      {isOnline !== undefined && (
        <div className="absolute bottom-0 right-0 z-20">
          <div className="relative">
            {isActuallyOnline ? (
              <>
                <div className={`rounded-full ${getStatusColor()} border-2 border-white dark:border-slate-900 ${indicatorSizeClass}`} />
                <div className={`absolute inset-0 rounded-full ${getStatusColor()} animate-ping opacity-75`} />
              </>
            ) : (
              <div className={`rounded-full ${getStatusColor()} border-2 border-white dark:border-slate-900 ${indicatorSizeClass}`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedAvatar;
