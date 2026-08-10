import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Compass } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '40px 20px 24px 20px',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      color: '#94a3b8'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Brand Col */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              background: 'var(--neon-lime)',
              border: '2px solid #000000',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              fontWeight: '900',
              fontSize: '1.2rem',
              color: '#0f172a'
            }}>
              M
            </div>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#f8fafc' }}>
                Mentor<span style={{ color: 'var(--neon-purple)' }}>Hub</span>
              </span>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Modern 1-on-1 mentorship & live video coaching platform.
              </p>
            </div>
          </div>

          {/* Platform Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.88rem', fontWeight: '600' }}>
            <Link to="/mentors" style={{ color: '#cbd5e1', transition: 'color 0.15s' }}>
              Explore Mentors
            </Link>
            <Link to="/apply" style={{ color: 'var(--neon-purple)', transition: 'color 0.15s' }}>
              Become a Mentor
            </Link>
            <Link to="/register" style={{ color: '#cbd5e1', transition: 'color 0.15s' }}>
              Sign Up
            </Link>
            <Link to="/login" style={{ color: 'var(--neon-lime)', transition: 'color 0.15s' }}>
              Log In
            </Link>
          </div>
        </div>

        <div style={{
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.8rem',
          color: '#64748b'
        }}>
          <div>
            © 2025 MentorHub. Kailash bishnoi.
          </div>
          <div>
            Safe, verified & secure mentorship.
          </div>
        </div>
      </div>
    </footer>
  );
};
