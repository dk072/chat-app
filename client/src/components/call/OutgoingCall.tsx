import React from 'react';
import { useCall } from '../../context/CallContext';
import { PhoneOff } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const OutgoingCall: React.FC = () => {
  const { callType, endCall, partnerId } = useCall();
  const { conversations } = useChat();

  const partner = conversations.find(c => c.partner.id === partnerId)?.partner;

  if (!partner) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center">
        
        {/* Pulsing Avatar */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-slate-500/20 animate-ping" />
          <div className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-4 border-slate-700 shadow-xl">
            {partner.profilePicture ? (
              <img src={partner.profilePicture} alt={partner.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-700 flex items-center justify-center text-4xl font-bold text-white">
                {partner.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Calling Info */}
        <h2 className="text-3xl font-bold text-white mb-2">{partner.username}</h2>
        <p className="text-slate-400 text-lg flex items-center space-x-2">
          Calling...
        </p>
        <p className="text-slate-500 text-sm mt-1">{callType === 'VIDEO' ? 'Video Call' : 'Voice Call'}</p>

        {/* Actions */}
        <div className="mt-16">
          <button
            onClick={endCall}
            className="group flex flex-col items-center space-y-2"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/40 hover:bg-rose-600 transition-colors hover:scale-105">
              <PhoneOff className="w-8 h-8" />
            </div>
            <span className="text-white text-sm font-medium">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutgoingCall;
