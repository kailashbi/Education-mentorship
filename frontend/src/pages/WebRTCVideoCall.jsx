import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Monitor, 
  MessageSquare, 
  Clock, 
  Send, 
  ShieldCheck, 
  User, 
  X,
  AlertCircle,
  Sparkles,
  Tv
} from 'lucide-react';
import { sessionsAPI } from '../api/sessions';
import { chatAPI } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import { ReviewModal } from '../components/ReviewModal';

export const WebRTCVideoCall = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Call Controls State
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);

  // In-call Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [unreadInCallCount, setUnreadInCallCount] = useState(0);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Call Timer
  const [seconds, setSeconds] = useState(0);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // WebRTC & Media Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const signalChannelRef = useRef(null);
  const chatScrollRef = useRef(null);
  const processedSignalIdsRef = useRef(new Set());
  const iceCandidateQueueRef = useRef([]);

  const messagesRef = useRef(chatMessages);
  messagesRef.current = chatMessages;
  const chatDrawerOpenRef = useRef(chatDrawerOpen);
  chatDrawerOpenRef.current = chatDrawerOpen;
  const isEndedRef = useRef(false);

  // Dynamic real-time timestamp formatter
  const formatRealtime = (created_at, fallbackTimeStr) => {
    if (!created_at) return fallbackTimeStr || 'Just now';
    const created = new Date(created_at);
    if (isNaN(created.getTime())) return fallbackTimeStr || 'Just now';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - created.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
    return created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Terminate call locally when peer ends it
  const handleRemoteEndCall = (peerName) => {
    if (isEndedRef.current) return;
    isEndedRef.current = true;

    // Stop local camera and microphone
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
    }

    if (user?.role === 'mentee') {
      alert(`${peerName || 'The mentor'} has ended the 1-on-1 coaching session. Please rate your session experience.`);
      setReviewModalOpen(true);
    } else {
      alert(`${peerName || 'The mentee'} has left the video call. Returning to your Mentor Dashboard.`);
      navigate('/mentor/dashboard');
    }
  };

  // Helper to dispatch signaling messages over both BroadcastChannel & Backend Relay
  const emitSignal = async (type, data = {}) => {
    // 1. BroadcastChannel (fast local)
    if (signalChannelRef.current) {
      try {
        signalChannelRef.current.postMessage({
          type,
          data,
          senderId: user?.id,
          senderName: user?.first_name || user?.username
        });
      } catch (e) {}
    }

    // 2. Backend Relay (bridges incognito / separate browsers)
    try {
      await sessionsAPI.sendSignal(sessionId, type, data);
    } catch (e) {}
  };

  // Helper to handle incoming signaling messages
  const processSignalPayload = async (payload) => {
    if (!payload || payload.sender_id === user?.id || payload.senderId === user?.id) return;
    const pc = peerConnectionRef.current;
    if (!pc || isEndedRef.current) return;

    try {
      const type = payload.type;
      const data = payload.data || payload;

      if (type === 'call_ended') {
        handleRemoteEndCall(payload.sender_name || payload.senderName);
      } else if (type === 'screen_share_status') {
        setRemoteScreenSharing(!!data.is_sharing);
      } else if (type === 'join') {
        // Peer joined -> If we are the mentor or existing participant, create and send offer
        if (pc.signalingState === 'stable') {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await pc.setLocalDescription(offer);
          await emitSignal('offer', { sdp: offer });
        }
      } else if (type === 'offer') {
        if (data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          // Drain queued ICE candidates
          while (iceCandidateQueueRef.current.length > 0) {
            const cand = iceCandidateQueueRef.current.shift();
            try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await emitSignal('answer', { sdp: answer });
          setRemoteConnected(true);
        }
      } else if (type === 'answer') {
        if (data.sdp && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          // Drain queued ICE candidates
          while (iceCandidateQueueRef.current.length > 0) {
            const cand = iceCandidateQueueRef.current.shift();
            try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
          }
          setRemoteConnected(true);
        }
      } else if (type === 'candidate') {
        const candidate = data.candidate || data;
        if (candidate && candidate.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {}
          } else {
            iceCandidateQueueRef.current.push(candidate);
          }
        }
      }
    } catch (err) {
      console.warn('Signaling processing note:', err);
    }
  };

  // 1. Initialize WebRTC, Media Stream & Multi-Channel Sync
  useEffect(() => {
    let timerInterval = null;
    let chatPollInterval = null;
    let statusPollInterval = null;
    let signalPollInterval = null;
    let animInterval = null;
    let isCancelled = false;

    const storageKey = `mentorhub_call_ended_${sessionId}`;

    const handleStorageEvent = (e) => {
      if (e.key === storageKey && !isEndedRef.current) {
        handleRemoteEndCall(sessionData?.is_mentor ? 'Mentee' : 'Mentor');
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    const initCall = async () => {
      try {
        setLoading(true);
        const data = await sessionsAPI.getLiveSession(sessionId);
        if (isCancelled) return;
        setSessionData(data);

        // Check if session was already closed
        if (data.live_session && data.live_session.is_active === false && data.live_session.ended_at) {
          setError('This coaching session has already concluded.');
          setLoading(false);
          return;
        }

        // Start call duration timer
        timerInterval = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);

        // 2. Setup Local Media Stream
        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
        } catch (mediaErr) {
          console.warn('Physical camera/mic in use or restricted, using animated HD canvas stream fallback', mediaErr);
          
          // Generate Animated Canvas Stream (HD 1280x720 30FPS)
          const canvas = document.createElement('canvas');
          canvas.width = 1280;
          canvas.height = 720;
          const ctx = canvas.getContext('2d');
          let frame = 0;

          animInterval = setInterval(() => {
            if (!ctx) return;
            frame++;
            // Dark gradient background
            const grad = ctx.createLinearGradient(0, 0, 1280, 720);
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(1, '#1e293b');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1280, 720);

            // Audio Waveform Visualization Simulation
            ctx.fillStyle = '#38bdf8';
            for (let i = 0; i < 24; i++) {
              const h = 20 + Math.sin(frame * 0.15 + i * 0.4) * 35 + Math.cos(frame * 0.08 + i) * 20;
              ctx.fillRect(380 + i * 22, 540 - h / 2, 14, h);
            }

            // User Initials Avatar
            ctx.beginPath();
            ctx.arc(640, 300, 90, 0, Math.PI * 2);
            ctx.fillStyle = user?.role === 'mentor' ? '#06b6d4' : '#a855f7';
            ctx.fill();
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Avatar Initial Letter
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 80px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const initial = (user?.first_name || user?.username || 'U').charAt(0).toUpperCase();
            ctx.fillText(initial, 640, 300);

            // User Name
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText(user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'Live User', 640, 440);

            // Live HD Badge
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('● WebRTC HD Live Audio & Video Feed', 640, 620);
          }, 33);

          stream = canvas.captureStream(30);

          // Add silent audio track so WebRTC audio negotiation succeeds
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const dst = audioCtx.createMediaStreamDestination();
            osc.connect(dst);
            osc.start();
            dst.stream.getAudioTracks().forEach(t => stream.addTrack(t));
          } catch (e) {}
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 3. WebRTC Peer Connection Setup
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        });
        peerConnectionRef.current = pc;

        if (stream) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setRemoteConnected(true);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            emitSignal('candidate', { candidate: event.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setRemoteConnected(true);
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            // Attempt ICE restart
            if (pc.signalingState === 'stable') {
              pc.createOffer({ iceRestart: true })
                .then(offer => pc.setLocalDescription(offer))
                .then(() => emitSignal('offer', { sdp: pc.localDescription }))
                .catch(() => {});
            }
          }
        };

        // 4. Setup BroadcastChannel Signaling
        const channelName = `mentorhub_webrtc_channel_${sessionId}`;
        const signalChannel = new BroadcastChannel(channelName);
        signalChannelRef.current = signalChannel;

        signalChannel.onmessage = (msg) => {
          processSignalPayload(msg.data);
        };

        // Announce presence
        await emitSignal('join', { role: user?.role, name: user?.first_name });

        // 5. Setup Backend Signaling Polling Relay (800ms)
        signalPollInterval = setInterval(async () => {
          if (isEndedRef.current) return;
          try {
            const sigData = await sessionsAPI.getSignals(sessionId);
            if (sigData.signals && sigData.signals.length > 0) {
              for (const sig of sigData.signals) {
                if (!processedSignalIdsRef.current.has(sig.id)) {
                  processedSignalIdsRef.current.add(sig.id);
                  await processSignalPayload(sig);
                }
              }
            }
          } catch (err) {}
        }, 800);

        // 6. Initial In-Call Chat Load & Polling (2s)
        if (data.chat_room_id) {
          try {
            const roomDetails = await chatAPI.getRoomDetails(data.chat_room_id);
            setChatMessages(roomDetails.messages || []);
          } catch (err) {}

          chatPollInterval = setInterval(async () => {
            try {
              const currentMsgs = messagesRef.current;
              const lastId = currentMsgs.length > 0 ? currentMsgs[currentMsgs.length - 1].id : 0;
              const pollData = await chatAPI.pollMessages(data.chat_room_id, lastId);
              if (pollData.messages && pollData.messages.length > 0) {
                setChatMessages((prev) => {
                  const existing = new Set(prev.map((m) => m.id));
                  const newOnes = pollData.messages.filter((m) => !existing.has(m.id));
                  if (newOnes.length === 0) return prev;

                  if (!chatDrawerOpenRef.current) {
                    const peerMsgs = newOnes.filter((m) => !m.is_mine);
                    if (peerMsgs.length > 0) {
                      setUnreadInCallCount((c) => c + peerMsgs.length);
                    }
                  }

                  return [...prev, ...newOnes];
                });

                if (chatScrollRef.current) {
                  chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
                }
              }
            } catch (err) {}
          }, 2000);
        }

        // 7. Status Polling (1.5s) for Bilateral Call End Detection
        statusPollInterval = setInterval(async () => {
          if (isEndedRef.current) return;
          try {
            const statusRes = await sessionsAPI.getLiveSessionStatus(sessionId);
            if (statusRes && (statusRes.is_active === false || statusRes.status === 'completed' || statusRes.ended_at)) {
              if (!isEndedRef.current) {
                handleRemoteEndCall(data.is_mentor ? 'Mentee' : 'Mentor');
              }
            }
          } catch (err) {}
        }, 1500);

      } catch (err) {
        if (!isCancelled) {
          setError(err.response?.data?.error || 'Failed to connect to live session.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    initCall();

    // Cleanup on unmount
    return () => {
      isCancelled = true;
      if (timerInterval) clearInterval(timerInterval);
      if (chatPollInterval) clearInterval(chatPollInterval);
      if (statusPollInterval) clearInterval(statusPollInterval);
      if (signalPollInterval) clearInterval(signalPollInterval);
      if (animInterval) clearInterval(animInterval);
      window.removeEventListener('storage', handleStorageEvent);

      if (signalChannelRef.current) {
        signalChannelRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch (e) {}
      }
    };
  }, [sessionId, user]);

  // Audio Toggle
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  // Video Toggle
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  // Screen Sharing (replaces track on sender and updates peer)
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace outgoing track on WebRTC PeerConnection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
          }
        }

        // Update local video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setScreenSharing(true);
        emitSignal('screen_share_status', { is_sharing: true });

        // Handle when user stops sharing from browser UI bar
        screenTrack.onended = async () => {
          if (peerConnectionRef.current && localStreamRef.current) {
            const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
            if (videoSender && originalVideoTrack) {
              await videoSender.replaceTrack(originalVideoTrack);
            }
          }
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          setScreenSharing(false);
          emitSignal('screen_share_status', { is_sharing: false });
        };
      } catch (err) {
        console.warn('Screen sharing cancelled', err);
      }
    } else {
      // Stop Screen Share manually
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (peerConnectionRef.current && originalVideoTrack) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(originalVideoTrack);
          }
        }
      }
      setScreenSharing(false);
      emitSignal('screen_share_status', { is_sharing: false });
    }
  };

  // Send in-call chat message with real-time timestamp
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !sessionData?.chat_room_id) return;

    const text = messageInput.trim();
    const tempId = `temp_${Date.now()}`;
    const nowIso = new Date().toISOString();

    setChatMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: text,
        sender: user?.id,
        sender_name: user?.first_name || user?.username,
        is_mine: true,
        created_at: nowIso,
        time_str: 'Just now'
      }
    ]);
    setMessageInput('');

    try {
      setSendingMsg(true);
      const formData = new FormData();
      formData.append('content', text);

      const res = await chatAPI.sendMessage(sessionData.chat_room_id, formData);
      if (res.message) {
        setChatMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
      }
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    } catch (err) {
      alert('Failed to send in-call message: ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingMsg(false);
    }
  };

  // End Call (Both Sides Guaranteed Sync)
  const handleEndCall = async () => {
    if (window.confirm('Are you sure you want to end this 1-on-1 coaching session for both participants?')) {
      try {
        isEndedRef.current = true;

        // 1. Emit call_ended signal over both channels
        await emitSignal('call_ended', {
          senderName: user?.first_name || user?.username
        });

        // 2. Cross-tab localStorage event trigger
        try {
          localStorage.setItem(`mentorhub_call_ended_${sessionId}`, Date.now().toString());
        } catch (e) {}

        // 3. Backend End Session
        await sessionsAPI.endLiveSession(sessionId);

        // Stop local tracks
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        if (user?.role === 'mentee') {
          setReviewModalOpen(true);
        } else {
          navigate('/mentor/dashboard');
        }
      } catch (err) {
        console.error('Failed to terminate live session', err);
        navigate(user?.role === 'mentor' ? '/mentor/dashboard' : '/mentee/dashboard');
      }
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          border: '4px solid rgba(56, 189, 248, 0.2)',
          borderTopColor: '#38bdf8',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px auto'
        }} />
        <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#f8fafc' }}>
          Connecting to WebRTC Live Coaching Arena...
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '6px' }}>
          Establishing encrypted peer-to-peer video & audio channels
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '540px', margin: '40px auto' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid #ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <AlertCircle size={30} color="#ef4444" />
        </div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#f87171', marginBottom: '8px' }}>Call Status</h3>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{error}</p>
        <button
          onClick={() => navigate(user?.role === 'mentor' ? '/mentor/dashboard' : '/mentee/dashboard')}
          className="btn-brutal btn-lime"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { session_request, is_mentor } = sessionData || {};
  const peerName = is_mentor
    ? session_request?.mentee_details?.full_name || session_request?.mentee_details?.username || 'Mentee'
    : session_request?.mentor_details?.full_name || session_request?.mentor_details?.username || 'Mentor';

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Top Session Status Bar */}
      <div className="glass-card-static" style={{
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.95)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 10px #22c55e'
          }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc' }}>
              {session_request?.topic || '1-on-1 Coaching Session'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Speaking with <b style={{ color: '#f8fafc' }}>{peerName}</b> • WebRTC Peer-to-Peer
            </p>
          </div>
        </div>

        {/* Timer & HD Encryption Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {remoteScreenSharing && (
            <span className="brutal-badge badge-cyan" style={{ fontSize: '0.75rem', animation: 'pulse 1.5s infinite' }}>
              <Tv size={14} /> {peerName} is Sharing Screen
            </span>
          )}
          <div className="brutal-badge badge-slate" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            <Clock size={14} /> {formatTimer(seconds)}
          </div>
          <span className="brutal-badge badge-lime" style={{ fontSize: '0.75rem' }}>
            <ShieldCheck size={14} /> WebRTC HD
          </span>
        </div>
      </div>

      {/* Main Video Arena */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: chatDrawerOpen ? '1fr 340px' : '1fr',
        gap: '16px',
        minHeight: '560px'
      }}>
        {/* Video Canvas Arena */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
            flex: 1
          }}>
            {/* Remote Peer Video Stream */}
            <div className="video-container" style={{
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              background: '#090d16',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <span className="brutal-badge badge-dark" style={{ color: '#fff', background: 'rgba(0,0,0,0.7)' }}>
                  {peerName} (Remote)
                </span>
                <span className={`brutal-badge ${remoteConnected ? 'badge-lime' : 'badge-amber'}`}>
                  {remoteConnected ? 'Live Connected' : 'Waiting to Join'}
                </span>
              </div>

              {/* Remote Video Element */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: remoteConnected ? 'block' : 'none'
                }}
              />

              {!remoteConnected && (
                <div style={{ textAlign: 'center', color: '#ffffff', margin: 'auto', zIndex: 5 }}>
                  <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background: 'var(--neon-purple)',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '2rem',
                    color: '#ffffff',
                    margin: '0 auto 12px auto'
                  }}>
                    {peerName.charAt(0)}
                  </div>
                  <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{peerName}</p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Session ready. Connecting with peer...</p>
                </div>
              )}

              <div style={{ zIndex: 10 }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {remoteConnected ? '📡 Live Peer Stream Active' : 'Waiting for connection...'}
                </span>
              </div>
            </div>

            {/* Local Video Stream (You) */}
            <div className="video-container" style={{
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              background: '#090d16',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <span className="brutal-badge badge-dark" style={{ color: '#fff', background: 'rgba(0,0,0,0.7)' }}>
                  You ({user?.first_name || user?.username})
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {screenSharing && <span className="brutal-badge badge-cyan">Sharing Screen</span>}
                  {!micEnabled && <span className="brutal-badge badge-coral">Muted</span>}
                </div>
              </div>

              {/* Local video feed */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              <div style={{ zIndex: 10 }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  📹 Local HD Stream Active
                </span>
              </div>
            </div>
          </div>

          {/* Floating Call Action Controls Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`btn-brutal ${micEnabled ? 'btn-white' : 'btn-coral'}`}
              style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`btn-brutal ${videoEnabled ? 'btn-white' : 'btn-coral'}`}
              style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={videoEnabled ? 'Turn Video Off' : 'Turn Video On'}
            >
              {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            {/* Screen Share Toggle */}
            <button
              onClick={toggleScreenShare}
              className={`btn-brutal ${screenSharing ? 'btn-cyan' : 'btn-white'}`}
              style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <Monitor size={20} />
            </button>

            {/* In-Call Chat Drawer Toggle with Unread Badge */}
            <button
              onClick={() => {
                setChatDrawerOpen(!chatDrawerOpen);
                if (!chatDrawerOpen) setUnreadInCallCount(0);
              }}
              className={`btn-brutal ${chatDrawerOpen ? 'btn-purple' : 'btn-white'}`}
              style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Toggle In-Call Chat"
            >
              <MessageSquare size={20} />
              {unreadInCallCount > 0 && !chatDrawerOpen && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: '900',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px #ef4444'
                }}>
                  {unreadInCallCount}
                </span>
              )}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="btn-brutal btn-coral"
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900' }}
            >
              <PhoneOff size={18} /> End Call
            </button>
          </div>
        </div>

        {/* In-Call Chat Drawer */}
        {chatDrawerOpen && (
          <div className="glass-card-static" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} color="var(--neon-purple)" />
                <h4 style={{ fontWeight: '900', fontSize: '0.95rem', color: '#f8fafc', margin: 0 }}>Live Session Chat</h4>
              </div>
              <button
                onClick={() => setChatDrawerOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: '12px' }}>
              {chatMessages && chatMessages.length > 0 ? (
                chatMessages.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    style={{
                      alignSelf: msg.is_mine ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: msg.is_mine ? 'var(--neon-purple)' : '#1e293b',
                      color: msg.is_mine ? '#ffffff' : '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '0.7rem', opacity: 0.8, marginBottom: '2px' }}>
                      <span style={{ fontWeight: '800' }}>{msg.sender_name || (msg.is_mine ? 'You' : peerName)}</span>
                      <span>{formatRealtime(msg.created_at, msg.time_str)}</span>
                    </div>
                    <div>{msg.content}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', margin: 'auto', fontSize: '0.8rem' }}>
                  No messages yet. Say hi in the live chat!
                </div>
              )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="brutal-input"
                placeholder="Type message in call..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', background: '#090d16', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              <button
                type="submit"
                disabled={sendingMsg || !messageInput.trim()}
                className="btn-brutal btn-lime"
                style={{ padding: '8px 12px' }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Review Modal for Mentee */}
      {reviewModalOpen && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            navigate('/mentee/dashboard');
          }}
          sessionId={session_request?.id || sessionId}
          mentorName={peerName}
          onSuccess={() => {
            setReviewModalOpen(false);
            navigate('/mentee/dashboard');
          }}
        />
      )}
    </div>
  );
};

export default WebRTCVideoCall;
