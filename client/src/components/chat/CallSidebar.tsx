import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { Call } from '../../types';
import AnimatedAvatar from '../ui/AnimatedAvatar';

export const CallSidebar: React.FC = () => {
  const { user } = useAuth();
  const { startCall } = useCall();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const res = await api.get('/calls/history');
        setCalls(res.data.calls);
      } catch (err) {
        console.error('Failed to fetch call history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalls();
  }, []);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const handleCall = (call: Call, type: 'VOICE' | 'VIDEO') => {
    const partner = call.callerId === user?.id ? call.receiver : call.caller;
    if (call.conversationId) {
      startCall(partner.id, type, call.conversationId);
    }
  };

  return (
    <div className="w-full h-full flex flex-col shrink-0 bg-white/40 dark:bg-slate-900/40">
      {/* Header */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-950/95 md:bg-white/30 md:dark:bg-slate-950/30 md:backdrop-blur-md">
        <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-white tracking-wide">Calls</h2>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading history...</span>
          </div>
        ) : calls.length > 0 ? (
          <div className="space-y-1">
            {calls.map((call) => {
              const isOutgoing = call.callerId === user?.id;
              const partner = isOutgoing ? call.receiver : call.caller;
              const isMissed = !isOutgoing && (call.status === 'MISSED' || call.status === 'REJECTED');
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={call.id}
                  className="flex items-center space-x-3 p-3 rounded-2xl transition-all hover:bg-white/60 dark:hover:bg-slate-800/50 md:backdrop-blur-sm group"
                >
                  <AnimatedAvatar
                    src={partner.profilePicture}
                    name={partner.username}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className={`text-sm font-semibold font-outfit truncate ${isMissed ? 'text-rose-500' : ''}`}>
                        {partner.username}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(call.startedAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {isMissed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />
                      ) : isOutgoing ? (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <PhoneIncoming className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span className="truncate">
                        {call.callType === 'VIDEO' ? 'Video call' : 'Voice call'}
                      </span>
                    </div>
                  </div>

                  {/* Quick actions (visible on hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                    <button
                      onClick={() => handleCall(call, 'VOICE')}
                      className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCall(call, 'VIDEO')}
                      className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors"
                      title="Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center">
            <Phone className="w-10 h-10 mb-2 opacity-25" />
            <span>No recent calls.</span>
          </div>
        )}
      </div>
    </div>
  );
};
