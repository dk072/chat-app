import React from 'react';
import { useCall } from '../../context/CallContext';
import { Phone, Video, PhoneOff, PhoneCall } from 'lucide-react';
import Avatar from '../ui/Avatar';

const IncomingCall: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const { caller, callType } = incomingCall;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center">
        
        {/* Pulsing Avatar */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-brand-500/30 animate-ping" />
          <div className="absolute -inset-4 rounded-full bg-brand-500/20 animate-pulse delay-75" />
          <div className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-4 border-brand-500 shadow-2xl">
            {caller.profilePicture ? (
              <img src={caller.profilePicture} alt={caller.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-600 flex items-center justify-center text-4xl font-bold text-white">
                {caller.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Caller Info */}
        <h2 className="text-3xl font-bold text-white mb-2">{caller.username}</h2>
        <p className="text-slate-300 flex items-center space-x-2 text-lg">
          {callType === 'VIDEO' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
          <span>Incoming {callType === 'VIDEO' ? 'Video' : 'Voice'} Call...</span>
        </p>

        {/* Actions */}
        <div className="flex items-center space-x-12 mt-12">
          {/* Reject */}
          <button
            onClick={rejectCall}
            className="group flex flex-col items-center space-y-2"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/40 group-hover:bg-rose-600 transition-colors group-hover:scale-105">
              <PhoneOff className="w-8 h-8" />
            </div>
            <span className="text-white text-sm font-medium">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={acceptCall}
            className="group flex flex-col items-center space-y-2"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 group-hover:bg-emerald-600 transition-colors group-hover:scale-105 animate-bounce">
              <PhoneCall className="w-8 h-8" />
            </div>
            <span className="text-white text-sm font-medium">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
