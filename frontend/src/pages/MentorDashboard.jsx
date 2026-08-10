import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Video, 
  Star, 
  Users, 
  DollarSign, 
  Sparkles, 
  MessageSquare,
  Award,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import { sessionsAPI } from '../api/sessions';
import { useAuth } from '../context/AuthContext';

export const MentorDashboard = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject / Reschedule Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getMentorStats();
      setStatsData(data);
    } catch (err) {
      console.error('Failed to load mentor dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoading(true);
      await sessionsAPI.acceptSession(requestId);
      alert('✅ Session request accepted! The live video call room is ready.');
      await fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept session request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (requestId) => {
    setSelectedRequestId(requestId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedRequestId) return;
    try {
      setActionLoading(true);
      await sessionsAPI.rejectSession(selectedRequestId, rejectReason.trim() || 'Schedule conflict. Please request another time slot.');
      alert('Session rejected/reschedule note sent to mentee.');
      setRejectModalOpen(false);
      await fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject session request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ fontWeight: '700', color: '#94a3b8' }}>Loading your mentor dashboard...</p>
      </div>
    );
  }

  const { profile, stats, pending_requests, upcoming_sessions, active_live_sessions, active_subscribers, recent_reviews } = statsData || {};

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <span className="brutal-badge badge-cyan" style={{ marginBottom: '6px' }}>
          <Sparkles size={12} /> Mentor Workspace
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#f8fafc' }}>
          Welcome, {profile?.first_name || 'Mentor'}!
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Manage your incoming mentee requests, launch video coaching calls, and review 3-month subscriptions.
        </p>
      </div>

      {/* Account Suspension Alert Banner */}
      {user?.is_suspended && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid #ef4444',
          borderRadius: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#f87171'
        }}>
          <ShieldAlert size={28} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: '900', fontSize: '1rem', color: '#f87171', margin: '0 0 2px 0' }}>
              Mentor Account Suspended by Administrator
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
              Your mentor account privileges have been temporarily suspended by the platform administrator. You may not accept new sessions or start video calls. Check your notifications for official administrator notes.
            </p>
          </div>
        </div>
      )}

      {/* Active Live Session Alert Banner */}
      {active_live_sessions && active_live_sessions.length > 0 && (

        <div className="glass-card" style={{
          padding: '20px',
          background: 'rgba(190, 242, 100, 0.2)',
          border: '2px solid var(--neon-lime)',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--neon-coral)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Video size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc' }}>Active Live Coaching Call</h3>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                With {active_live_sessions[0].mentee_name} • "{active_live_sessions[0].topic}"
              </p>
            </div>
          </div>
          <Link 
            to={`/session/call/${active_live_sessions[0].id}`} 
            className="btn-brutal btn-coral"
            style={{ padding: '10px 20px' }}
          >
            <Video size={16} /> Rejoin Live Video Call
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '6px solid var(--neon-amber)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8' }}>Pending Requests</span>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>
            {stats?.pending_requests_count || 0}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '6px solid var(--neon-cyan)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8' }}>Upcoming Calls</span>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>
            {stats?.upcoming_sessions_count || 0}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '6px solid var(--neon-lime)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8' }}>Active Subscribers</span>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#22c55e', marginTop: '4px' }}>
            {active_subscribers?.length || 0}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '6px solid var(--neon-purple)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8' }}>Average Rating</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <Star size={24} fill="#fbbf24" color="#0f172a" />
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#f8fafc' }}>{stats?.average_rating || '5.0'}</h2>
          </div>
        </div>
      </div>

      {/* Active Mentorship Subscribers (3-Month / 1-Month) */}
      {active_subscribers && active_subscribers.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award color="var(--neon-purple)" size={20} /> My Mentorship Subscribers
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            {active_subscribers.map((sub) => (
              <div key={sub.id} className="glass-card" style={{ padding: '16px', border: '1px solid rgba(192, 132, 252, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="brutal-badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    {sub.plan_type === '3_months' ? '🌟 3-Month Plan' : '✨ 1-Month Plan'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Valid till: {new Date(sub.end_date).toLocaleDateString()}
                  </span>
                </div>
                <h4 style={{ fontWeight: '900', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {sub.mentee_name || 'Student'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px', marginBottom: '10px' }}>
                  Sessions: <strong style={{ color: 'var(--neon-lime)' }}>Unlimited Plan Active</strong>
                </p>

                <Link to="/chat" className="btn-brutal btn-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}>
                  <MessageSquare size={14} /> Open Mentee Chat
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Pending Requests & Upcoming Sessions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '36px' }}>
        {/* Pending Requests */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc' }}>
              Pending Session Requests ({pending_requests?.length || 0})
            </h3>
          </div>

          {pending_requests && pending_requests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pending_requests.map((req) => (
                <div key={req.id} className="glass-card" style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.8)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ fontWeight: '800', fontSize: '1rem', color: '#f8fafc' }}>{req.topic}</h4>
                        {req.is_paid && (
                          <span className="brutal-badge badge-lime" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                            Subscribed
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Mentee: <strong>{req.mentee_details?.full_name || req.mentee_details?.username}</strong>
                      </p>
                    </div>
                    <span className="brutal-badge badge-amber">Pending</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '10px' }}>
                    📅 {new Date(req.proposed_date).toLocaleString()} ({req.duration_minutes} mins)
                  </p>

                  {req.description && (
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '12px' }}>
                      "{req.description}"
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleOpenRejectModal(req.id)}
                      disabled={actionLoading}
                      className="btn-brutal btn-white"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444' }}
                    >
                      <XCircle size={14} /> Reschedule / Reject
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={actionLoading}
                      className="btn-brutal btn-lime"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      <CheckCircle2 size={14} /> Accept Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={32} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
              <p style={{ fontWeight: '700' }}>No pending requests</p>
              <p style={{ fontSize: '0.8rem' }}>When mentees request sessions, they will appear here for you to accept or reschedule.</p>
            </div>
          )}
        </div>

        {/* Upcoming Accepted Sessions */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc', marginBottom: '18px' }}>
            Confirmed Upcoming Sessions
          </h3>

          {upcoming_sessions && upcoming_sessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {upcoming_sessions.map((s) => (
                <div key={s.id} className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontWeight: '800', fontSize: '1rem', color: '#f8fafc' }}>{s.topic}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Mentee: {s.mentee_details?.full_name || s.mentee_details?.username}
                      </p>
                    </div>
                    <span className="brutal-badge badge-lime">Confirmed</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '12px' }}>
                    📅 {new Date(s.proposed_date).toLocaleString()} ({s.duration_minutes} mins)
                  </p>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Link
                      to="/chat"
                      className="btn-brutal btn-white"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Chat
                    </Link>
                    <Link
                      to={`/session/call/${s.id}`}
                      className="btn-brutal btn-cyan"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      <Video size={14} /> Start 1-on-1 Call
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              <Calendar size={32} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
              <p style={{ fontWeight: '700' }}>No confirmed upcoming sessions</p>
              <p style={{ fontSize: '0.8rem' }}>Accept pending requests above to schedule live coaching calls.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule / Reject Modal */}
      {rejectModalOpen && (
        <div className="modal-overlay" onClick={() => setRejectModalOpen(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '460px', padding: '24px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#f8fafc', marginBottom: '8px' }}>
              Reschedule / Reject Request
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
              Provide a note or suggest an alternative time slot for your mentee:
            </p>

            <form onSubmit={handleConfirmReject}>
              <textarea
                className="brutal-input"
                rows={3}
                required
                placeholder="e.g., Sorry, I am busy at 2 PM. Please request a slot tomorrow at 5 PM IST."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '16px' }}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="btn-brutal btn-white"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-brutal btn-coral"
                  style={{ padding: '8px 18px' }}
                >
                  {actionLoading ? 'Sending...' : 'Send Reschedule Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
