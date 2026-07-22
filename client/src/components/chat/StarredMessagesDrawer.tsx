import React, { useEffect, useState } from 'react';
import { Star, X, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import AnimatedAvatar from '../ui/AnimatedAvatar';

interface StarredMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StarredMessagesDrawer: React.FC<StarredMessagesDrawerProps> = ({ isOpen, onClose }) => {
  const [starredMessages, setStarredMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .get('/nextgen/messages/starred')
        .then((res) => setStarredMessages(res.data.starredMessages || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full flex flex-col text-white shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="font-bold text-sm">Starred Messages</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-6 animate-pulse">Loading starred items...</p>
          ) : starredMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Star className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
              <p className="text-xs">No starred messages yet.</p>
              <p className="text-[10px] text-slate-600">Star important messages to keep track of them here.</p>
            </div>
          ) : (
            starredMessages.map((m) => (
              <div key={m.id} className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AnimatedAvatar src={m.sender.profilePicture} name={m.sender.username} size="xs" />
                    <span className="font-bold text-slate-200">{m.sender.username}</span>
                  </div>
                  <span className="text-[9px] text-slate-400">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 font-medium">{m.content || `[${m.type}]`}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
