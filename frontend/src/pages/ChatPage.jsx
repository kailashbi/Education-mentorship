import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, 
  Paperclip, 
  FileText, 
  Download, 
  Bookmark, 
  User, 
  ShieldAlert
} from 'lucide-react';
import { chatAPI } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import { ReportUserModal } from '../components/ReportUserModal';

export const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const initialRoomId = searchParams.get('room');

  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(initialRoomId ? Number(initialRoomId) : null);
  const [roomData, setRoomData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Send input state
  const [content, setContent] = useState('');
  const [isNote, setIsNote] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);

  // Ref to chat scroll container (prevents window scrolling / footer jumping)
  const chatScrollContainerRef = useRef(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const pollingTimerRef = useRef(null);

  const formatRealtime = (created_at, fallbackTimeStr) => {
    if (!created_at) return fallbackTimeStr || 'Just now';
    const created = new Date(created_at);
    const now = new Date();
    const diffSec = Math.floor((now - created) / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return fallbackTimeStr || created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to scroll only the inner chat messages box

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollContainerRef.current) {
        chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
      }
    }, 60);
  };

  // Fetch Rooms
  const fetchRooms = async () => {
    try {
      const data = await chatAPI.getRooms();
      setRooms(data.rooms || []);
      if (!activeRoomId && data.rooms?.length > 0) {
        setActiveRoomId(data.rooms[0].id);
      }
    } catch (err) {
      console.error('Failed to load chat rooms', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Room Messages
  const fetchRoomDetails = async (roomId) => {
    try {
      const data = await chatAPI.getRoomDetails(roomId);
      setRoomData(data.room);
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load room details', err);
    }
  };

  // Poll for new messages with exact deduplication
  const pollNewMessages = async () => {
    if (!activeRoomId) return;
    try {
      const currentMsgs = messagesRef.current;
      const lastMsgId = currentMsgs.length > 0 ? currentMsgs[currentMsgs.length - 1].id : 0;
      const data = await chatAPI.pollMessages(activeRoomId, lastMsgId);
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newUnique = data.messages.filter((m) => !existingIds.has(m.id));
          if (newUnique.length === 0) return prev;
          return [...prev, ...newUnique];
        });
        scrollToBottom();
      }
    } catch (err) {
      // ignore transient polling error
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (activeRoomId) {
      fetchRoomDetails(activeRoomId);

      // Start polling every 3 seconds
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = setInterval(pollNewMessages, 3000);
    }

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [activeRoomId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim() && !attachment) return;

    try {
      setSending(true);
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (isNote) formData.append('is_note', 'true');
      if (attachment) formData.append('attachment', attachment);

      const response = await chatAPI.sendMessage(activeRoomId, formData);
      if (response.message) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          if (existingIds.has(response.message.id)) return prev;
          return [...prev, response.message];
        });
      }
      setContent('');
      setIsNote(false);
      setAttachment(null);
      scrollToBottom();
      fetchRooms(); // update last message preview
    } catch (err) {
      alert('Failed to send message: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  const activeOtherUser = roomData?.other_user;

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '20px',
        height: '680px',
      }}>
        {/* Left: Chat Rooms Sidebar */}
        <div className="glass-card-static" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#f8fafc' }}>Conversations</h3>
            <span className="brutal-badge badge-lime" style={{ fontSize: '0.7rem' }}>
              {rooms.length} Active
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rooms.length > 0 ? (
              rooms.map((room) => {
                const other = room.other_user;
                const isSelected = room.id === activeRoomId;
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '14px',
                      border: isSelected ? '1.5px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%'
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--neon-cyan)' : '#334155',
                      border: '1.5px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      color: isSelected ? '#0f172a' : '#ffffff',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {other?.profile_picture_url ? (
                        <img src={other.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        other?.username?.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontWeight: '800', fontSize: '0.9rem', color: isSelected ? 'var(--neon-cyan)' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {other?.full_name || other?.username}
                        </h4>
                        {room.unread_count > 0 && (
                          <span className="brutal-badge badge-coral" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                        {room.last_message ? (room.last_message.is_note ? `📌 ${room.last_message.content}` : room.last_message.content || 'File attachment') : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>No conversations yet</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Start a chat from any mentor profile page.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        <div className="glass-card-static" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {activeRoomId && activeOtherUser ? (
            <>
              {/* Chat Top Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.95)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--neon-cyan)',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    color: '#0f172a'
                  }}>
                    {activeOtherUser.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc' }}>
                      {activeOtherUser.full_name || activeOtherUser.username}
                    </h3>
                    <span className="brutal-badge badge-slate" style={{ fontSize: '0.65rem' }}>
                      {activeOtherUser.role}
                    </span>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a
                    href={chatAPI.getExportPDFUrl(activeRoomId)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-brutal btn-white"
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    <Download size={14} /> Export PDF
                  </a>

                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="btn-brutal btn-coral"
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    title="Report user or abusive chat to Admin"
                  >
                    <ShieldAlert size={14} /> Report
                  </button>
                </div>
              </div>

              {/* Chat Messages Feed (Scrollable inner box) */}
              <div 
                ref={chatScrollContainerRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'rgba(9, 13, 22, 0.85)'
                }}
              >
                {messages.map((msg) => {
                  const isMine = msg.is_mine;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {/* Message Bubble */}
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '16px',
                          border: isMine ? '1px solid rgba(0,0,0,0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: msg.is_note
                            ? '#fbbf24'
                            : isMine
                            ? 'var(--neon-lime)'
                            : '#1e293b',
                          color: msg.is_note || isMine ? '#0f172a' : '#f8fafc',
                          fontWeight: msg.is_note ? '700' : '500',
                          fontSize: '0.92rem',
                          wordBreak: 'break-word',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {msg.is_note && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px', color: '#713f12' }}>
                            <Bookmark size={12} fill="#713f12" /> Highlighted Note
                          </div>
                        )}
                        <p>{msg.content}</p>

                        {/* File Attachment */}
                        {msg.attachment_url && (
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '8px',
                              padding: '6px 12px',
                              background: 'rgba(0,0,0,0.12)',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              color: isMine ? '#0f172a' : '#38bdf8'
                            }}
                          >
                            <FileText size={14} /> Download Attachment
                          </a>
                        )}
                      </div>

                      {/* Time & Sender */}
                      <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', padding: '0 4px' }}>
                        {formatRealtime(msg.created_at, msg.time_str)} • {isMine ? 'You' : msg.sender_name}
                      </span>
                    </div>

                  );
                })}
              </div>

              {/* Send Message Form or Suspension Banner */}
              {user?.is_suspended ? (
                <div style={{
                  padding: '16px 20px',

                  background: 'rgba(239, 68, 68, 0.15)',
                  borderTop: '2px solid #ef4444',
                  textAlign: 'center',
                  color: '#f87171'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                    <ShieldAlert size={20} color="#ef4444" />
                    <strong style={{ fontSize: '0.95rem' }}>Account Suspended by Administrator</strong>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0 }}>
                    Sending chat messages and files is disabled while your account is under suspension. Please check your notifications.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: '16px 20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(15, 23, 42, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Note Mode Toggle (Mentors Only) */}
                    <button
                      type="button"
                      onClick={() => setIsNote(!isNote)}
                      className={`btn-brutal ${isNote ? 'btn-amber' : 'btn-white'}`}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <Bookmark size={14} /> {isNote ? 'Note Mode (ON)' : 'Mark as Note'}
                    </button>

                    {/* Attachment Button */}
                    <label className="btn-brutal btn-white" style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <Paperclip size={14} /> {attachment ? attachment.name.slice(0, 15) : 'Attach File'}
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => setAttachment(e.target.files[0])}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="brutal-input"
                      placeholder={isNote ? 'Write an important coaching note...' : 'Type your message here...'}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="btn-brutal btn-lime"
                      style={{ padding: '0 24px' }}
                    >
                      <Send size={16} /> {sending ? '...' : 'Send'}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              <p style={{ fontWeight: '700' }}>Select a conversation on the left to start chatting.</p>
            </div>
          )}
        </div>
      </div>

      {/* Report User Modal */}
      {activeOtherUser && (
        <ReportUserModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportedUser={activeOtherUser}
          chatRoomId={activeRoomId}
        />
      )}
    </div>
  );
};

export default ChatPage;
