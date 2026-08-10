import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Video, 
  Star, 
  Clock, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  BookOpen,
  Award,
  Zap,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { ReviewModal } from '../components/ReviewModal';
import { SessionBookingModal } from '../components/SessionBookingModal';

export const MenteeDashboard = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSessionForReview, setSelectedSessionForReview] = useState(null);

  // Subscribed Mentorship Quick Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getMenteeStats();
      setStatsData(data);
    } catch (err) {
      console.error('Failed to load mentee dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenReview = (session) => {
    setSelectedSessionForReview(session);
    setReviewModalOpen(true);
  };

  const handleRequestSubscribedSession = (subscription) => {
    const mentorObj = {
      id: subscription.mentor,
      user: subscription.mentor,
      first_name: subscription.mentor_name?.split(' ')[0] || 'Mentor',
      last_name: subscription.mentor_name?.split(' ').slice(1).join(' ') || '',
      hourly_rate: 0,
      monthly_rate: 0,
      quarterly_rate: 0,
    };
    setSelectedMentorForBooking(mentorObj);
    setBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ fontWeight: '700', color: '#94a3b8' }}>Loading your learning dashboard...</p>
      </div>
    );
  }

  const { stats, upcoming_sessions, recent_sessions, unreviewed_sessions, active_live_sessions, active_subscriptions } = statsData || {};
  const totalBookedCount = (upcoming_sessions?.length || 0) + (recent_sessions?.length || 0);

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <span className="brutal-badge badge-amber" style={{ marginBottom: '6px' }}>
            <Sparkles size={12} /> Mentee Learning Hub
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#f8fafc' }}>My Mentorship Sessions</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Manage your booked 1-on-1 calls, active 3-month plans, and request sessions anytime.
          </p>
        </div>

        <Link to="/mentors" className="btn-brutal btn-lime">
          <Compass size={16} /> Explore New Mentors
        </Link>
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
              Account Restricted by Administrator
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
              Your account has been suspended by the platform administrator. You can view your dashboard and past history, but booking new sessions and chat messaging are currently disabled. Check your notifications for details.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Summary */}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8' }}>Active Plans</span>
            <Award size={18} color="var(--neon-purple)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', marginTop: '6px', color: 'var(--neon-purple)' }}>
            {active_subscriptions?.length || 0}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8' }}>Upcoming Calls</span>
            <Calendar size={18} color="var(--neon-cyan)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', marginTop: '6px', color: 'var(--neon-cyan)' }}>
            {upcoming_sessions?.length || 0}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8' }}>Pending Confirmation</span>
            <Clock size={18} color="var(--neon-amber)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', marginTop: '6px', color: 'var(--neon-amber)' }}>
            {recent_sessions?.filter(s => s.status === 'pending').length || stats?.pending_count || 0}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8' }}>Completed Sessions</span>
            <CheckCircle2 size={18} color="var(--neon-emerald)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', marginTop: '6px', color: 'var(--neon-emerald)' }}>
            {stats?.completed_count || recent_sessions?.filter(s => s.status === 'completed').length || 0}
          </h2>
        </div>
      </div>

      {/* Active Mentorship Subscriptions (e.g. 3-Month / 1-Month Plan) */}
      {active_subscriptions && active_subscriptions.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award color="var(--neon-purple)" size={20} /> My Active Mentorship Subscriptions
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {active_subscriptions.map((sub) => (
              <div 
                key={sub.id} 
                className="glass-card" 
                style={{ 
                  padding: '20px', 
                  border: '2px solid rgba(192, 132, 252, 0.4)',
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span className="brutal-badge badge-purple" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>
                      {sub.plan_type === '3_months' ? '🌟 3-Month Mentorship' : '✨ 1-Month Mentorship'}
                    </span>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#f8fafc' }}>
                      {sub.mentor_name || 'Mentor'}
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                    Active
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '14px' }}>
                  <span>🎯 Sessions: <strong style={{ color: 'var(--neon-lime)' }}>Unlimited (Book Anytime)</strong></span>
                  <span>⏳ Valid until: <strong>{new Date(sub.end_date).toLocaleDateString()}</strong></span>
                </div>


                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleRequestSubscribedSession(sub)}
                    className="btn-brutal btn-lime"
                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Calendar size={15} /> Request 1-on-1 Session (₹0)
                  </button>

                  <Link 
                    to="/chat" 
                    className="btn-brutal btn-white"
                    style={{ padding: '10px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <MessageSquare size={15} /> Chat
                  </Link>
                </div>
              </div>
            ))}
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
              width: '42px',
              height: '42px',
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc' }}>Mentor is Live Now!</h3>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                With {active_live_sessions[0].mentor_name} • "{active_live_sessions[0].topic}"
              </p>
            </div>
          </div>
          <Link 
            to={`/session/call/${active_live_sessions[0].id}`} 
            className="btn-brutal btn-coral"
            style={{ padding: '10px 20px' }}
          >
            <Video size={16} /> Join Video Call
          </Link>
        </div>
      )}

      {/* Main Grid: Upcoming Sessions & All Session Requests */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '36px' }}>
        {/* Confirmed Upcoming Sessions */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc' }}>
              Confirmed Upcoming Calls ({upcoming_sessions?.length || 0})
            </h3>
          </div>

          {upcoming_sessions && upcoming_sessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {upcoming_sessions.map((s) => (
                <div key={s.id} className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontWeight: '800', fontSize: '1rem', color: '#f8fafc' }}>{s.topic}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Mentor: {s.mentor_details?.full_name || s.mentor_details?.username}
                      </p>
                    </div>
                    <span className="brutal-badge badge-lime">Confirmed</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '12px' }}>
                    📅 {new Date(s.proposed_date).toLocaleString()} ({s.duration_minutes} mins)
                  </p>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Link
                      to={`/chat`}
                      className="btn-brutal btn-white"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Chat
                    </Link>
                    <Link
                      to={`/session/call/${s.id}`}
                      className="btn-brutal btn-lime"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      <Video size={14} /> Join Call Room
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={32} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
              <p style={{ fontWeight: '700' }}>No confirmed upcoming sessions</p>
              <p style={{ fontSize: '0.8rem' }}>When your mentor accepts your session request, it will appear here.</p>
            </div>
          )}
        </div>

        {/* All Requests & Status History */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc', marginBottom: '18px' }}>
            All Session Requests & History
          </h3>

          {recent_sessions && recent_sessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recent_sessions.slice(0, 6).map((s) => (
                <div key={s.id} className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontWeight: '800', fontSize: '0.92rem', color: '#f8fafc' }}>{s.topic}</h4>
                    <span className={`brutal-badge ${
                      s.status === 'accepted' ? 'badge-lime' :
                      s.status === 'pending' ? 'badge-amber' :
                      s.status === 'completed' ? 'badge-cyan' : 'badge-coral'
                    }`}>
                      {s.status === 'pending' ? 'Pending Mentor Approval' : s.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Mentor: {s.mentor_details?.full_name || s.mentor_details?.username} • {new Date(s.proposed_date).toLocaleDateString()}
                  </p>

                  {/* Mentor Reschedule Note */}
                  {s.status === 'rejected' && s.mentor_note && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      borderLeft: '3px solid #ef4444',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      color: '#fca5a5'
                    }}>
                      💬 Mentor Note: "{s.mentor_note}"
                    </div>
                  )}

                  {s.status === 'completed' && (
                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenReview(s)}
                        className="btn-brutal btn-amber"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <Star size={12} /> Rate Session
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No recent sessions found.</p>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedSessionForReview && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          sessionId={selectedSessionForReview.id}
          mentorName={selectedSessionForReview.mentor_details?.full_name || selectedSessionForReview.mentor_details?.username}
          onSuccess={() => {
            setReviewModalOpen(false);
            fetchStats();
          }}
        />
      )}

      {/* Subscribed Quick Session Request Modal */}
      {bookingModalOpen && selectedMentorForBooking && (
        <SessionBookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          mentor={selectedMentorForBooking}
          onSuccess={() => {
            setBookingModalOpen(false);
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default MenteeDashboard;
