import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: 'light' | 'dark' | 'auto';
  hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'auto',
  hoverEffect = false,
  ...props
}) => {
  const baseStyles = 'rounded-3xl backdrop-blur-md border shadow-glass-light dark:shadow-glass-dark transition-all duration-300';
  
  const variants = {
    light: 'bg-white/40 border-white/50',
    dark: 'bg-slate-900/40 border-white/5',
    auto: 'bg-white/40 dark:bg-slate-900/40 border-white/50 dark:border-white/5'
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, scale: 1.01 } : {}}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
