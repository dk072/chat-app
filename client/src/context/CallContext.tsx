import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { User } from '../types';

export type CallState = 'IDLE' | 'CALLING' | 'RINGING' | 'CONNECTED';
export type CallType = 'VOICE' | 'VIDEO';

interface IncomingCallData {
  caller: User;
  callType: CallType;
  conversationId: string;
}

interface CallContextType {
  callState: CallState;
  callType: CallType | null;
  incomingCall: IncomingCallData | null;
  partnerId: string | null;
  conversationId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  duration: number;
  isMuted: boolean;
  isVideoPaused: boolean;
  startCall: (receiverId: string, type: CallType, conversationId: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};

// Use public STUN servers for standard WebRTC connection over NATs
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
};

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [callState, setCallState] = useState<CallState>('IDLE');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);

  // Initialize Media Devices
  const getMedia = async (type: CallType): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: type === 'VIDEO' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.error('Failed to get media devices:', e);
      alert('Could not access camera/microphone. Please check permissions.');
      return null;
    }
  };

  const createPeerConnection = (partnerId: string) => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit('call:iceCandidate', { targetId: partnerId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  };

  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setDuration(0);
    setCallState('IDLE');
    setCallType(null);
    setIncomingCall(null);
    setPartnerId(null);
    setConversationId(null);
    setActiveCallId(null);
    setIsMuted(false);
    setIsVideoPaused(false);
    pendingCandidates.current = [];
  };

  const startTimer = () => {
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  // Sender initiates call
  const startCall = async (receiverId: string, type: CallType, cId: string) => {
    const stream = await getMedia(type);
    if (!stream) return;

    setCallState('CALLING');
    setCallType(type);
    setPartnerId(receiverId);
    setConversationId(cId);

    if (socket) {
      socket.emit('call:start', { receiverId, callType: type, conversationId: cId });
    }
  };

  // Receiver accepts call
  const acceptCall = async () => {
    if (!incomingCall) return;
    const stream = await getMedia(incomingCall.callType);
    if (!stream) return;

    setCallState('CONNECTED');
    setCallType(incomingCall.callType);
    setPartnerId(incomingCall.caller.id);
    setConversationId(incomingCall.conversationId);

    if (socket) {
      socket.emit('call:accept', { 
        callerId: incomingCall.caller.id, 
        callType: incomingCall.callType, 
        conversationId: incomingCall.conversationId 
      });
    }
    setIncomingCall(null);
    startTimer();
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('call:reject', { 
        callerId: incomingCall.caller.id, 
        callType: incomingCall.callType, 
        conversationId: incomingCall.conversationId 
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (socket && partnerId && activeCallId) {
      socket.emit('call:end', { callId: activeCallId, partnerId, duration });
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'VIDEO') {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoPaused(!isVideoPaused);
    }
  };

  // Socket Event Listeners
  useEffect(() => {
    if (!socket || !user) return;

    // Incoming ring
    socket.on('call:incoming', (data: IncomingCallData) => {
      if (callState !== 'IDLE') {
        // If already in a call, notify caller it's busy
        socket.emit('call:busy', { callerId: data.caller.id });
        return;
      }
      setIncomingCall(data);
      setCallState('RINGING');
    });

    // Caller receives this when receiver accepts
    socket.on('call:accepted', async (data: { receiverId: string, callId: string }) => {
      setActiveCallId(data.callId);
      setCallState('CONNECTED');
      startTimer();
      
      const pc = createPeerConnection(data.receiverId);
      const streamToUse = localStreamRef.current;
      if (streamToUse) {
        streamToUse.getTracks().forEach(track => pc.addTrack(track, streamToUse));
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call:offer', { targetId: data.receiverId, offer });
    });

    socket.on('call:rejected', () => {
      cleanupCall();
      alert('Call was rejected');
    });

    socket.on('call:missed', () => {
      cleanupCall();
      alert('User is offline or unavailable');
    });

    socket.on('call:ended', () => {
      cleanupCall();
    });

    // WebRTC Signaling
    socket.on('call:offer', async (data: { callerId: string, offer: any }) => {
      // Create PC and answer
      const pc = createPeerConnection(data.callerId);
      
      // Add local stream tracks to PC synchronously before creating answer
      const streamToUse = localStreamRef.current;
      if (streamToUse) {
        streamToUse.getTracks().forEach(track => pc.addTrack(track, streamToUse));
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      
      // Add any queued ICE candidates that arrived before the offer
      pendingCandidates.current.forEach(c => pc.addIceCandidate(c).catch(e => console.error('Error adding queued candidate:', e)));
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('call:answer', { targetId: data.callerId, answer });
    });

    socket.on('call:answer', async (data: { receiverId: string, answer: any }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        
        // Add any queued ICE candidates that arrived before the answer
        pendingCandidates.current.forEach(c => pcRef.current?.addIceCandidate(c).catch(e => console.error('Error adding queued candidate:', e)));
        pendingCandidates.current = [];
      }
    });

    socket.on('call:iceCandidate', async (data: { senderId: string, candidate: any }) => {
      const candidate = new RTCIceCandidate(data.candidate);
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      } else {
        // Queue candidate until remote description is set
        pendingCandidates.current.push(candidate);
      }
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:missed');
      socket.off('call:ended');
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:iceCandidate');
    };
  }, [socket, user, callState, localStream]);

  return (
    <CallContext.Provider value={{
      callState, callType, incomingCall, partnerId, conversationId,
      localStream, remoteStream, duration, isMuted, isVideoPaused,
      startCall, acceptCall, rejectCall, endCall, toggleMute, toggleVideo
    }}>
      {children}
    </CallContext.Provider>
  );
};
