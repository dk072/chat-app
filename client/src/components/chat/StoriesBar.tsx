import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Plus, X, Eye, Sparkles, Image, Trash2, Music, Search, Loader2 } from 'lucide-react';
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
  musicUrl?: string;
  musicName?: string;
  musicStartTime?: number;
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
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgMusic, setBgMusic] = useState<string | null>(null);
  const [musicName, setMusicName] = useState<string | null>(null);
  const [musicStartTime, setMusicStartTime] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Music Search States
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);

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

  const handleOpenStory = async (story: Story) => {
    setActiveStory(story);
    try {
      const res = await api.post(`/nextgen/stories/${story.id}/view`);
      if (res.data.views) {
        setActiveStory((prev) => (prev && prev.id === story.id ? { ...prev, views: res.data.views } : prev));
      }
    } catch (e) {}
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.75);
            setBgImage(compressedUrl);
          } else {
            setBgImage(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMusicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Audio file is too large. Please select a file under 5MB.");
        return;
      }
      setMusicName(file.name);
      setMusicStartTime(0);
      setMusicDuration(0);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const audioSrc = event.target?.result as string;
        setBgMusic(audioSrc);
        
        // Calculate duration
        const audio = new window.Audio();
        audio.src = audioSrc;
        audio.onloadedmetadata = () => {
          setMusicDuration(audio.duration);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchMusic = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingMusic(true);
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=10`);
      const data = await response.json();
      // Filter out results that don't have a previewUrl
      setSearchResults(data.results?.filter((r: any) => r.previewUrl) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const handleSelectTrack = (track: any) => {
    const audioSrc = track.previewUrl;
    setBgMusic(audioSrc);
    setMusicName(`${track.trackName} - ${track.artistName}`);
    setMusicStartTime(0);
    setMusicDuration(0);
    
    // Calculate duration for the online track so the trimmer appears
    const audio = new window.Audio();
    audio.src = audioSrc;
    audio.onloadedmetadata = () => {
      setMusicDuration(audio.duration);
    };
    
    setShowMusicSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handlePostStory = async () => {
    if (!storyText.trim() && !bgImage && !bgMusic) return;
    try {
      await api.post('/nextgen/stories', {
        text: storyText.trim(),
        bgGradient: selectedGradient,
        mediaUrl: bgImage || undefined,
        musicUrl: bgMusic || undefined,
        musicName: musicName || undefined,
        musicStartTime,
      });
      setShowCreateModal(false);
      setStoryText('');
      setBgImage(null);
      setBgMusic(null);
      setMusicName(null);
      setMusicStartTime(0);
      setMusicDuration(0);
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
            onClick={() => handleOpenStory(story)}
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
              {bgImage && (
                <>
                  <img src={bgImage} alt="background photo" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                </>
              )}
              <textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Type your status message..."
                className="w-full bg-transparent border-none text-white text-base font-bold placeholder-white/70 focus:outline-none text-center resize-none z-10 drop-shadow-md"
                rows={3}
                maxLength={140}
                autoFocus
              />
            </div>

            {/* Background Photo & Gradient Selector Controls */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  type="button"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-700 transition-colors"
                >
                  <Image className="w-4 h-4 text-indigo-400" />
                  <span>{bgImage ? 'Change Photo' : 'Background Photo'}</span>
                </button>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {bgImage && (
                  <button
                    onClick={() => setBgImage(null)}
                    type="button"
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Music Selector Controls */}
              <div className="flex flex-col space-y-2 mt-2">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowMusicSearch(true)}
                      type="button"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-700 transition-colors"
                    >
                      <Search className="w-4 h-4 text-pink-400 shrink-0" />
                      <span className="truncate max-w-[120px]">{musicName ? musicName : 'Search Music'}</span>
                    </button>
                    
                    <button
                      onClick={() => musicInputRef.current?.click()}
                      type="button"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-pink-400 shrink-0" />
                      <span>Upload</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={musicInputRef}
                    onChange={handleMusicSelect}
                    accept="audio/*"
                    className="hidden"
                  />

                  {bgMusic && (
                    <button
                      onClick={() => { setBgMusic(null); setMusicName(null); setMusicDuration(0); setMusicStartTime(0); }}
                      type="button"
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Music</span>
                    </button>
                  )}
                </div>

                {/* Music Trimmer Slider */}
                {bgMusic && musicDuration > 0 && (
                  <div className="bg-slate-800/50 p-2 rounded-xl flex flex-col space-y-1 mt-1 border border-slate-700">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                      <span>Start Time</span>
                      <span>{Math.floor(musicStartTime / 60)}:{(Math.floor(musicStartTime % 60)).toString().padStart(2, '0')} / {Math.floor(musicDuration / 60)}:{(Math.floor(musicDuration % 60)).toString().padStart(2, '0')}</span>
                    </div>
                    <input 
                      type="range"
                      min={0}
                      max={Math.floor(musicDuration)}
                      value={musicStartTime}
                      onChange={(e) => setMusicStartTime(Number(e.target.value))}
                      className="w-full accent-pink-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Color Gradient Presets */}
              <div className="flex justify-center space-x-2 pt-1">
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
            </div>

            <button
              onClick={handlePostStory}
              disabled={!storyText.trim() && !bgImage && !bgMusic}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
            >
              Share Status Update
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Music Search Modal */}
      {showMusicSearch && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden text-white p-6 space-y-4 shadow-2xl flex flex-col h-[500px]">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center space-x-1.5">
                <Music className="w-4 h-4 text-pink-400" />
                <span>Search Music</span>
              </h3>
              <button onClick={() => setShowMusicSearch(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchMusic()}
                placeholder="Search song or artist..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
              <button 
                onClick={handleSearchMusic}
                disabled={isSearchingMusic || !searchQuery.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-colors"
              >
                {isSearchingMusic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              {searchResults.length === 0 && !isSearchingMusic && searchQuery.length > 0 && (
                <p className="text-center text-slate-500 text-sm mt-8">No results found.</p>
              )}
              {searchResults.map((track) => (
                <div 
                  key={track.trackId}
                  onClick={() => handleSelectTrack(track)}
                  className="flex items-center space-x-3 p-2 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  <img src={track.artworkUrl100} alt={track.trackName} className="w-10 h-10 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{track.trackName}</p>
                    <p className="text-xs text-slate-400 truncate">{track.artistName}</p>
                  </div>
                </div>
              ))}
            </div>
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
            {/* Background Photo if attached */}
            {activeStory.mediaUrl && (
              <>
                <img
                  src={activeStory.mediaUrl}
                  alt="Story background"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
              </>
            )}

            {/* Audio Player if attached */}
            {activeStory.musicUrl && (
              <audio 
                ref={audioRef}
                src={activeStory.musicUrl} 
                autoPlay 
                loop 
                className="hidden"
                onLoadedMetadata={(e) => {
                  if (activeStory.musicStartTime) {
                    (e.target as HTMLAudioElement).currentTime = activeStory.musicStartTime;
                  }
                }}
              />
            )}

            {/* Top Bar */}
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center space-x-2">
                <AnimatedAvatar src={activeStory.profilePicture} name={activeStory.username} size="xs" />
                <span className="font-bold text-xs">{activeStory.username}</span>
              </div>
              <div className="flex items-center space-x-2">
                {activeStory.userId === user?.id && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this status update?')) {
                        try {
                          await api.delete(`/nextgen/stories/${activeStory.id}`);
                          setActiveStory(null);
                          fetchStories();
                        } catch (e) {
                          alert('Error deleting status');
                        }
                      }
                    }}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-rose-500/80 text-white transition-colors"
                    title="Delete Status"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setActiveStory(null)} className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Story Text */}
            <div className="text-center font-extrabold text-xl leading-relaxed my-auto drop-shadow-md z-10">
              {activeStory.text}
            </div>

            {/* Footer View Count and Music */}
            <div className="z-10 flex flex-col items-center space-y-2 mt-auto">
              {activeStory.musicName && (
                <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm py-1 px-3 rounded-full overflow-hidden max-w-[200px]">
                  <Music className="w-3 h-3 text-pink-400 shrink-0" />
                  <div className="w-full overflow-hidden">
                    <p className="text-[10px] font-medium text-white/90 truncate animate-pulse">
                      {activeStory.musicName}
                    </p>
                  </div>
                </div>
              )}
              
              {activeStory.userId === user?.id ? (
                <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold bg-black/30 backdrop-blur-sm py-1.5 px-3.5 rounded-full mx-auto text-white/90">
                  <Eye className="w-4 h-4 text-indigo-300" />
                  <span>{activeStory.views.length} {activeStory.views.length === 1 ? 'view' : 'views'}</span>
                </div>
              ) : (
                <div className="h-6" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
