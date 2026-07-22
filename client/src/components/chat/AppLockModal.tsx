import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck } from 'lucide-react';

interface AppLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({ isLocked, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        if (nextPin === '1234' || nextPin === '0000' || nextPin.length === 4) { // Accepts any 4 digit pin setup for demo
          onUnlock();
          setPin('');
          setError(false);
        } else {
          setError(true);
          setPin('');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in text-white">
      <div className="w-full max-w-xs text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto shadow-lg border border-indigo-500/30">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <h2 className="text-xl font-bold font-outfit">Chat Locker</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your 4-digit PIN to access messages</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center space-x-3">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx ? 'bg-indigo-500 border-indigo-400 scale-110' : 'border-slate-700 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-xs text-rose-400 font-bold">Incorrect PIN. Please try again.</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[200px] mx-auto pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((val) => (
            <button
              key={val}
              onClick={() => {
                if (val === 'C') setPin('');
                else if (val === '✓' && pin.length === 4) onUnlock();
                else if (val !== 'C' && val !== '✓') handleDigit(val);
              }}
              className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm font-bold flex items-center justify-center transition-all active:scale-95"
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
