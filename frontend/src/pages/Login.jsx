import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Sparkles, User, Shield, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await login({ username, password });

      // Redirect based on role
      if (data.user.role === 'admin' || data.user.is_superuser) {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'mentor') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/mentee/dashboard');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.approval_status === 'pending') {
        navigate('/pending-approval', { state: { user: errData.user } });
      } else if (errData?.approval_status === 'rejected') {
        setError(`Application Rejected: ${errData.rejection_reason || 'Profile did not meet criteria.'}`);
      } else {
        setError(errData?.error || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '40px auto 80px auto',
      padding: '0 16px'
    }}>
      <div className="glass-card-static" style={{ padding: '36px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'var(--neon-lime)',
            border: '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            margin: '0 auto 16px auto',
            fontWeight: '900',
            fontSize: '1.6rem'
          }}>
            M
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Welcome Back</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Log in to your MentorHub account
          </p>
        </div>

        {/* Demo Fast-Fill Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '24px'
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--neon-cyan)', marginBottom: '8px', textAlign: 'center' }}>
            ⚡ 1-Click Demo Login
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
            <button
              type="button"
              onClick={() => autofillDemo('admin', 'admin123')}
              className="btn-brutal btn-purple"
              style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              title="Kailash - Admin"
            >
              👑 Kailash
            </button>
            <button
              type="button"
              onClick={() => autofillDemo('mentor_ankit', 'ankit123')}
              className="btn-brutal btn-cyan"
              style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              title="Ankit Mishra - Mentor"
            >
              🎓 Ankit
            </button>
            <button
              type="button"
              onClick={() => autofillDemo('mentor_yanshu', 'yanshu123')}
              className="btn-brutal btn-cyan"
              style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              title="Yanshu Patel - Mentor"
            >
              🎓 Yanshu
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => autofillDemo('mentee_dholi', 'dholi123')}
              className="btn-brutal btn-amber"
              style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              title="Dholi Kumari - Mentee"
            >
              🚀 Dholi
            </button>
            <button
              type="button"
              onClick={() => autofillDemo('mentee_rohit', 'rohit123')}
              className="btn-brutal btn-amber"
              style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              title="Rohit Sharma - Mentee"
            >
              🚀 Rohit
            </button>
            <button
              type="button"
              onClick={() => autofillDemo('mentee_dinesh', 'dinesh123')}
              className="btn-brutal btn-amber"
              style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              title="Dinesh Meena - Mentee"
            >
              🚀 Dinesh
            </button>
          </div>
        </div>




        {error && (
          <div style={{
            padding: '12px 14px',
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            color: '#b91c1c',
            fontWeight: '700',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
              Username or Email
            </label>
            <input
              type="text"
              className="brutal-input"
              placeholder="e.g. admin or alex_dev"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              className="brutal-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brutal btn-lime"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '6px' }}
          >
            <LogIn size={18} /> {loading ? 'Authenticating...' : 'Log In to Account'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: '800', color: 'var(--color-dark)', textDecoration: 'underline' }}>
            Sign up as Mentee
          </Link>
          {' '}or{' '}
          <Link to="/apply" style={{ fontWeight: '800', color: 'var(--neon-purple)', textDecoration: 'underline' }}>
            Apply as Mentor
          </Link>
        </div>
      </div>
    </div>
  );
};
