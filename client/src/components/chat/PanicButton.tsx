import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Flame } from 'lucide-react';
import PanicModal from './PanicModal';
import { executePanicMode } from '../../utils/panicHandler';

const PanicButton: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(() => localStorage.getItem('panic_enabled') !== 'false');
  const [holdDurationSeconds, setHoldDurationSeconds] = useState<number>(() => parseInt(localStorage.getItem('panic_hold_duration') || '3', 10));
  const [requirePassword, setRequirePassword] = useState<boolean>(() => localStorage.getItem('panic_require_password') === 'true');
  const [deleteMode, setDeleteMode] = useState<'LOCAL_AND_CLOUD' | 'LOCAL_ONLY'>(() => (localStorage.getItem('panic_delete_mode') as any) || 'LOCAL_AND_CLOUD');

  useEffect(() => {
    const syncSettings = () => {
      setEnabled(localStorage.getItem('panic_enabled') !== 'false');
      setHoldDurationSeconds(parseInt(localStorage.getItem('panic_hold_duration') || '3', 10));
      setRequirePassword(localStorage.getItem('panic_require_password') === 'true');
      setDeleteMode((localStorage.getItem('panic_delete_mode') as any) || 'LOCAL_AND_CLOUD');
    };

    window.addEventListener('storage', syncSettings);
    return () => window.removeEventListener('storage', syncSettings);
  }, []);
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const durationMs = holdDurationSeconds * 1000;

  const startHolding = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPressing(true);
    startTimeRef.current = Date.now();

    const animateProgress = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        cancelHolding();
        handleHoldComplete();
      } else {
        animationFrameRef.current = requestAnimationFrame(animateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateProgress);
  };

  const cancelHolding = () => {
    setIsPressing(false);
    setProgress(0);
    startTimeRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const handleHoldComplete = () => {
    if (requirePassword) {
      setShowConfirmModal(true);
    } else {
      executePanicMode({ deleteMode });
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!enabled) return null;

  // Circular progress math for SVG stroke-dashoffset
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      <div
        className="fixed bottom-20 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center justify-center group"
        title={`Press and hold for ${holdDurationSeconds}s to trigger Emergency Delete`}
      >
        {/* Warning Pulse Aura when pressing */}
        {isPressing && (
          <div className="absolute inset-0 rounded-full bg-rose-600/40 animate-ping" />
        )}

        <div
          onMouseDown={startHolding}
          onMouseUp={cancelHolding}
          onMouseLeave={cancelHolding}
          onTouchStart={startHolding}
          onTouchEnd={cancelHolding}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 via-red-600 to-rose-500 shadow-xl shadow-rose-600/30 flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 border-2 border-white/20"
        >
          {/* SVG Circular Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r={radius}
              className="text-white/20"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="26"
              cy="26"
              r={radius}
              className="text-white transition-all duration-75"
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Panic Icon */}
          <div className="relative z-10 text-white flex flex-col items-center justify-center">
            {isPressing ? (
              <Flame className="w-6 h-6 animate-pulse text-amber-300" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* Hover / Press Tooltip */}
        <div className="absolute bottom-16 right-0 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-800">
          {isPressing
            ? `Hold... ${Math.ceil(holdDurationSeconds - (progress / 100) * holdDurationSeconds)}s`
            : `Emergency Delete (Hold ${holdDurationSeconds}s)`}
        </div>
      </div>

      {/* Confirmation Modal if password is required */}
      <PanicModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        requirePassword={requirePassword}
        deleteMode={deleteMode}
      />
    </>
  );
};

export default PanicButton;
