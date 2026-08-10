import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  ShieldCheck, 
  Video, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  LogOut
} from 'lucide-react';

export const PendingApproval = () => {
  const { user, refreshUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const applicant = location.state?.mentorProfile || user;

  const handleRefreshStatus = async () => {
    try {
      setChecking(true);
      setStatusMessage('');
      const updatedUser = await refreshUser();
      if (updatedUser?.mentor_profile?.approval_status === 'approved') {
        navigate('/mentor/dashboard');
      } else {
        setStatusMessage('Your application is still under review by the admin team. Please check back shortly.');
      }
    } catch (err) {
      setStatusMessage('Unable to check status right now. Please try logging in again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '40px auto 80px auto', padding: '0 16px' }}>
      <div className="glass-card-static" style={{ padding: '40px', textAlign: 'center' }}>
        {/* Animated Beacon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '24px',
          background: 'var(--neon-purple)',
          border: '3px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          margin: '0 auto 20px auto',
          color: '#ffffff'
        }}>
          <Clock size={36} />
        </div>

        <span className="brutal-badge badge-purple" style={{ marginBottom: '12px' }}>
          <Sparkles size={12} /> Application Under Review
        </span>

        <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '12px' }}>
          Your Mentor Profile is Being Verified
        </h2>

        <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '28px', maxWidth: '520px', margin: '0 auto 28px auto' }}>
          Thank you for applying to mentor on MentorHub! An administrator is currently reviewing your profile credentials and <b>Demo Video Pitch</b>.
        </p>

        {/* Status Timeline */}
        <div style={{
          background: 'rgba(241, 245, 249, 0.85)',
          border: '2px solid var(--color-border)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '28px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={22} color="#16a34a" />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>1. Application & Video Pitch Received</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Credentials submitted successfully.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--neon-amber)',
                border: '2px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={12} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>2. Admin Quality Verification (In Progress)</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Admin is reviewing demo video, domain expertise, and rate.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.5 }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#cbd5e1',
                border: '2px solid var(--color-border)'
              }} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>3. Profile Activation & Public Listing</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Once approved, you can log in, accept bookings, and launch video calls.</p>
              </div>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div style={{
            padding: '12px',
            background: 'rgba(254, 240, 138, 0.5)',
            border: '2px solid var(--color-border)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: '700',
            marginBottom: '20px'
          }}>
            {statusMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefreshStatus}
            disabled={checking}
            className="btn-brutal btn-lime"
            style={{ padding: '12px 24px' }}
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking Status...' : 'Check Approval Status'}
          </button>

          <Link to="/" className="btn-brutal btn-white" style={{ padding: '12px 24px' }}>
            Browse Platform
          </Link>

          {user && (
            <button onClick={logout} className="btn-brutal btn-coral" style={{ padding: '12px 20px' }}>
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
