import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface MotionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

const MotionInput: React.FC<MotionInputProps> = ({
  label,
  icon,
  error,
  className = '',
  id,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col space-y-1 w-full">
      {label && (
        <motion.label
          htmlFor={inputId}
          animate={{ color: isFocused ? 'rgb(139, 92, 246)' : 'inherit' }}
          className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1"
        >
          {label}
        </motion.label>
      )}
      <div className="relative group">
        {icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isFocused ? 'text-brand-500' : 'text-slate-400'}`}>
            {icon}
          </div>
        )}
        <input
          id={inputId}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full px-4 py-3 rounded-2xl transition-all duration-300 outline-none
            bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm
            border-2 border-transparent
            focus:border-brand-500/50 focus:bg-white dark:focus:bg-black
            shadow-inner text-sm
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-rose-500/50 focus:border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20' : ''}
            ${className}
          `}
          {...props}
        />
        {/* Glow effect */}
        {isFocused && !error && (
          <motion.div
            layoutId={`glow-${inputId}`}
            className="absolute inset-0 rounded-2xl pointer-events-none shadow-neon-brand opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          />
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold text-rose-500 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default MotionInput;
