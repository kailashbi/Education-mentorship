import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  UserX, 
  AlertTriangle, 
  FileText, 
  Bookmark, 
  Download,
  CheckCircle2
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import { chatAPI } from '../api/chat';

export const ChatInspectorModal = ({ isOpen, onClose, report, onActionSuccess }) => {
  const [chatData, setChatData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && report) {
      const fetchChat = async () => {
        try {
          setLoading(true);
          const params = {
            report_id: report.id,
            room_id: report.chat_room,
            user1_id: report.reporter_details?.id || report.reporter,
            user2_id: report.reported_user_details?.id || report.reported_user,
          };
          const data = await adminAPI.inspectChat(params);

          setChatData(data.room);
          setMessages(data.messages || []);
        } catch (err) {
          console.warn('No chat found or failed to load', err);
          setChatData(null);
          setMessages([]);
        } finally {
          setLoading(false);
        }
      };

      fetchChat();
    }
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const handleAction = async (actionType) => {
    try {
      setActionLoading(true);
      await adminAPI.takeReportAction(report.id, actionType, adminNotes);
      if (onActionSuccess) onActionSuccess();
      onClose();
    } catch (err) {
      alert('Failed to execute moderation action: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const reportedUser = report.reported_user_details;
  const reporter = report.reporter_details;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '880px', padding: '28px', maxHeight: '92vh', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'var(--neon-coral)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              color: '#ffffff'
            }}>
              <ShieldAlert size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#f8fafc' }}>
                  Incident Report #{report.id} Review
                </h3>
                <span className="brutal-badge badge-coral">{report.category}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Reporter: <b style={{ color: '#f8fafc' }}>{reporter?.full_name || reporter?.username}</b> ({reporter?.role}) vs. Reported: <b style={{ color: '#fb7185' }}>{reportedUser?.full_name || reportedUser?.username}</b> ({reportedUser?.role})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-brutal btn-white" style={{ padding: '6px 10px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Report Claim Summary */}
        <div style={{
          background: 'rgba(251, 191, 36, 0.12)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--neon-amber)', marginBottom: '4px' }}>
            Reported Violation Details:
          </h4>
          <p style={{ fontSize: '0.95rem', color: '#f8fafc' }}>
            "{report.description}"
          </p>
        </div>

        {/* Chat Inspector Transcript Log */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#f8fafc' }}>
              💬 Full Conversation Transcript ({messages.length} messages)
            </h4>
            {chatData && (
              <a
                href={chatAPI.getExportPDFUrl(chatData.id)}
                target="_blank"
                rel="noreferrer"
                className="btn-brutal btn-white"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Download size={12} /> Download PDF Log
              </a>
            )}
          </div>

          <div style={{
            background: 'rgba(9, 13, 22, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '16px',
            maxHeight: '300px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Loading conversation history...</p>
            ) : messages.length > 0 ? (
              messages.map((m) => {
                const isReported = m.sender === report.reported_user;
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: isReported ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isReported ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.8)',
                      borderLeft: isReported ? '5px solid #ef4444' : '5px solid var(--neon-cyan)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', color: isReported ? '#fb7185' : 'var(--neon-cyan)' }}>
                        {m.sender_name} {isReported && '(REPORTED USER)'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.time_str}</span>
                    </div>

                    {m.is_note && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--neon-amber)', marginBottom: '4px' }}>
                        <Bookmark size={12} fill="var(--neon-amber)" /> Highlighted Note
                      </div>
                    )}
                    <p style={{ color: '#f8fafc' }}>{m.content}</p>

                    {m.attachment_url && (
                      <a
                        href={m.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--neon-cyan)', fontWeight: '700' }}
                      >
                        <FileText size={12} /> View Attachment
                      </a>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                <p style={{ fontWeight: '700' }}>No direct chat messages found</p>
                <p style={{ fontSize: '0.8rem' }}>The issue may have occurred during a live session call or off-platform.</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Action Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '20px'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '10px', color: '#f8fafc' }}>
            Admin Moderation Action
          </h4>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.8rem', marginBottom: '4px', color: '#94a3b8' }}>
              Admin Resolution Notes
            </label>
            <input
              type="text"
              className="brutal-input"
              placeholder="e.g. Chat logs confirmed scam/abusive message. Account blocked."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '8px 12px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1' }}>
                User Status: {reportedUser?.username} —{' '}
                {reportedUser?.is_suspended ? (
                  <span className="brutal-badge badge-coral">SUSPENDED / BLOCKED</span>
                ) : (
                  <span className="brutal-badge badge-lime">ACTIVE</span>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleAction('dismiss')}
                disabled={actionLoading}
                className="btn-brutal btn-white"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Dismiss Report
              </button>

              <button
                type="button"
                onClick={() => handleAction('warn')}
                disabled={actionLoading}
                className="btn-brutal btn-amber"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <AlertTriangle size={14} /> Issue Warning
              </button>

              <button
                type="button"
                onClick={() => handleAction('suspend')}
                disabled={actionLoading}
                className="btn-brutal btn-coral"
                style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: '900' }}
              >
                <UserX size={16} /> Block & Suspend Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
