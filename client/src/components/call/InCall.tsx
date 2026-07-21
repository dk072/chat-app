import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '../../context/CallContext';
import { useChat } from '../../context/ChatContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize, Minimize } from 'lucide-react';
import Avatar from '../ui/Avatar';

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const InCall: React.FC = () => {
  const { 
    localStream, remoteStream, callType, partnerId, duration,
    isMuted, isVideoPaused, toggleMute, toggleVideo, endCall 
  } = useCall();
  
  const { conversations } = useChat();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteMediaRef = useRef<any>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const partner = conversations.find(c => c.partner.id === partnerId)?.partner;

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteMediaRef.current && remoteStream) {
      remoteMediaRef.current.srcObject = remoteStream;
      remoteMediaRef.current.play().catch((e: any) => console.error('Failed to play remote stream:', e));
    }
  }, [remoteStream, callType]);

  // Auto-hide controls in full screen
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
      return;
    }
    let timeout = setTimeout(() => setShowControls(false), 3000);
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  if (!partner) return null;

  return (
    <div className={`transition-all duration-300 z-[90] ${
      isFullscreen 
        ? 'fixed inset-0 bg-black' 
        : 'absolute top-4 right-4 w-72 h-48 md:w-80 md:h-56 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 hover:scale-[1.02] cursor-move'
    }`}>
      
      {/* Remote Video or Avatar */}
      <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
        {callType === 'VIDEO' && remoteStream ? (
          <video 
            ref={remoteMediaRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Avatar src={partner.profilePicture} name={partner.username} size={isFullscreen ? 'lg' : 'md'} />
            {isFullscreen && <h2 className="text-white text-2xl font-semibold">{partner.username}</h2>}
            <div className="text-brand-400 font-mono text-xl">{formatDuration(duration)}</div>
            {/* Visually hidden audio element for voice calls (display: none can break playback on some browsers) */}
            {remoteStream && (
              <audio 
                ref={(el) => {
                  if (el && el.srcObject !== remoteStream) {
                    el.srcObject = remoteStream;
                    el.play().catch((e: any) => console.error('Audio play failed:', e));
                  }
                  remoteMediaRef.current = el as any;
                }} 
                autoPlay 
                playsInline 
                className="absolute opacity-0 w-0 h-0 pointer-events-none" 
              />
            )}
          </div>
        )}
      </div>

      {/* Local Video PIP */}
      {callType === 'VIDEO' && localStream && (
        <div className={`absolute bottom-20 right-4 rounded-xl overflow-hidden border-2 border-slate-700 bg-black shadow-lg ${
          isFullscreen ? 'w-32 h-48' : 'w-20 h-28 bottom-4 right-4'
        }`}>
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform -scale-x-100" 
          />
        </div>
      )}

      {/* Header Info (PIP Mode) */}
      {!isFullscreen && (
        <div className="absolute top-0 left-0 w-full p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white text-xs font-medium">{partner.username}</span>
          </div>
          <span className="text-white text-xs font-mono">{formatDuration(duration)}</span>
        </div>
      )}

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center space-x-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Toggle Mute */}
        <button 
          onClick={toggleMute}
          className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30' : 'bg-slate-700/50 text-white hover:bg-slate-600'}`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* End Call */}
        <button 
          onClick={endCall}
          className="p-4 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-transform active:scale-90"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        {/* Toggle Video */}
        {callType === 'VIDEO' && (
          <button 
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${isVideoPaused ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30' : 'bg-slate-700/50 text-white hover:bg-slate-600'}`}
          >
            {isVideoPaused ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-3 rounded-full bg-slate-700/50 text-white hover:bg-slate-600 transition-colors ml-4 hidden md:block"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

    </div>
  );
};

export default InCall;
