import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  status?: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  onClick?: () => void;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline = false,
  status,
  onClick,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (userName: string) => {
    if (!userName) return '?';
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName[0].toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const indicatorSizes = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-6 h-6 border-4',
  };

  const getStatusColor = () => {
    if (!isOnline || status === 'OFFLINE') return 'hidden';
    switch (status) {
      case 'AWAY': return 'bg-amber-500';
      case 'BUSY': return 'bg-rose-500';
      case 'ONLINE':
      default: return 'bg-emerald-500';
    }
  };

  const showIndicator = isOnline && status !== 'OFFLINE';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none ${
        onClick ? 'cursor-pointer active:scale-95 transition-transform duration-100' : ''
      } ${className}`}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className={`rounded-full object-cover border border-slate-200 dark:border-slate-800 ${
            sizeClasses[size].split(' ')[0]
          } ${sizeClasses[size].split(' ')[1]}`}
        />
      ) : (
        <div
          className={`rounded-full flex items-center justify-center font-bold text-white uppercase bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md ${sizeClasses[size]}`}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Online indicator dot */}
      {showIndicator && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ${getStatusColor()} border-2 border-chat-panel-light dark:border-chat-panel-dark animate-pulse shadow-md ${indicatorSizes[size]}`}
        />
      )}
    </div>
  );
};

export default Avatar;
