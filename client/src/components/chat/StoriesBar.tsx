import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, X, Eye, Sparkles } from 'lucide-react';
import api from '../../services/api';
import AnimatedAvatar from '../ui/AnimatedAvatar';
import { useAuth } from '../../context/AuthContext';

interface Story {
  id: string;
  userId: string;
  username: string;
  profilePicture: string;
  text?: string;
  mediaUrl?: string;
  bgGradient: string;
  views: string[];
  createdAt: string;
}

export const StoriesBar: React.FC = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [storyText, setStoryText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('from-indigo-600 to-purple-600');

  const gradients = [
    'from-indigo-600 to-purple-600',
    'from-pink-500 to-rose-500',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-blue-600 to-cyan-500',
  ];

  const fetchStories = async () => {
    try {
      const res = await api.get('/nextgen/stories');
      setStories(res.data.stories || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handlePostStory = async () => {
    if (!storyText.trim()) return;
    try {
      await api.post('/nextgen/stories', {
        text: storyText.trim(),
        bgGradient: selectedGradient,
      });
      setShowCreateModal(false);
      setStoryText('');
      fetchStories();
    } catch (e) {
      alert('Error posting story');
    }
  };

  return (
    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs">
      <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-1">
        {/* Post Story Trigger */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="flex flex-col items-center space-y-1 cursor-pointer shrink-0 group"
        >
          <div className="relative">
            <AnimatedAvatar
              src={user?.profilePicture}
              name={user?.username || 'You'}
              size="sm"
              className="ring-2 ring-indigo-500/50 group-hover:scale-105 transition-transform"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-900">
              <Plus className="w-3 h-3" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Your Story</span>
        </div>

        {/* Active Stories Carousel */}
        {stories.map((story) => (
          <div
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center space-y-1 cursor-pointer shrink-0 group"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 group-hover:scale-105 transition-transform">
              <div className="p-0.5 rounded-full bg-white dark:bg-slate-900">
                <AnimatedAvatar src={story.profilePicture} name={story.username} size="sm" />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 max-w-[56px] truncate">
              {story.username}
            </span>
          </div>
        ))}
      </div>

      {/* Post Story Modal (Portaled to document.body) */}
      {showCreateModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden text-white p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Create 24h Status Update</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas Preview */}
            <div
              className={`w-full h-56 rounded-2xl bg-gradient-to-br ${selectedGradient} p-6 flex items-center justify-center text-center shadow-lg relative overflow-hidden`}
            >
              <textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Type your status message..."
                className="w-full bg-transparent border-none text-white text-base font-bold placeholder-white/60 focus:outline-none text-center resize-none"
                rows={3}
                maxLength={140}
                autoFocus
              />
            </div>

            {/* Gradient Selector */}
            <div className="flex justify-center space-x-2">
              {gradients.map((grad, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedGradient(grad)}
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${grad} border-2 ${
                    selectedGradient === grad ? 'border-white scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handlePostStory}
              disabled={!storyText.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
            >
              Share Status Update
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Story Viewer Drawer (Portaled to document.body) */}
      {activeStory && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div
            className={`w-full max-w-sm h-[520px] rounded-3xl bg-gradient-to-br ${activeStory.bgGradient} p-6 flex flex-col justify-between text-white relative shadow-2xl overflow-hidden`}
          >
            {/* Top Bar */}
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center space-x-2">
                <AnimatedAvatar src={activeStory.profilePicture} name={activeStory.username} size="xs" />
                <span className="font-bold text-xs">{activeStory.username}</span>
              </div>
              <button onClick={() => setActiveStory(null)} className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Story Text */}
            <div className="text-center font-extrabold text-xl leading-relaxed my-auto drop-shadow-md">
              {activeStory.text}
            </div>

            {/* Footer View Count */}
            <div className="flex items-center justify-center space-x-1 text-xs opacity-80 z-10">
              <Eye className="w-4 h-4" />
              <span>{activeStory.views.length} views</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
