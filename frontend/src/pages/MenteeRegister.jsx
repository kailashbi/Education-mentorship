import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/auth';
import { UserPlus, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export const MenteeRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    bio: '',
    interests: '',
    learning_goals: '',
    education: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const submissionData = new FormData();
      Object.keys(formData).forEach((key) => {
        submissionData.append(key, formData[key]);
      });
      if (profilePicture) {
        submissionData.append('profile_picture', profilePicture);
      }

      await authAPI.registerMentee(submissionData);
      
      // Auto login
      await login({ username: formData.username, password: formData.password });
      navigate('/mentee/dashboard');
    } catch (err) {
      const errData = err.response?.data?.errors;
      if (errData) {
        const msg = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ');
        setError(msg);
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto 80px auto', padding: '0 16px' }}>
      <div className="glass-card-static" style={{ padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="brutal-badge badge-amber" style={{ marginBottom: '8px' }}>
            Mentee Registration
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Join MentorHub as a Learner</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Create your account to book 1-on-1 sessions and connect with industry leaders.
          </p>
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

        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                className="brutal-input"
                placeholder="e.g. Sarah"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                className="brutal-input"
                placeholder="e.g. Connor"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                Username *
              </label>
              <input
                type="text"
                name="username"
                className="brutal-input"
                placeholder="e.g. sarah_c"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                className="brutal-input"
                placeholder="sarah@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
              Password *
            </label>
            <input
              type="password"
              name="password"
              className="brutal-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
              Interests / Topics of Interest
            </label>
            <input
              type="text"
              name="interests"
              className="brutal-input"
              placeholder="e.g. Full-Stack, System Design, AI/ML, Career Growth"
              value={formData.interests}
              onChange={handleChange}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
              Current Learning Goals
            </label>
            <textarea
              name="learning_goals"
              className="brutal-textarea"
              rows={2}
              placeholder="e.g. Preparing for Senior Software Engineer interviews at top tech companies..."
              value={formData.learning_goals}
              onChange={handleChange}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
              Profile Avatar (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              className="brutal-input"
              onChange={(e) => setProfilePicture(e.target.files[0])}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brutal btn-lime"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}
          >
            <UserPlus size={18} /> {loading ? 'Creating Account...' : 'Complete Mentee Registration'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: '800', color: 'var(--color-dark)', textDecoration: 'underline' }}>
            Log in here
          </Link>
          {' '}• Want to mentor?{' '}
          <Link to="/apply" style={{ fontWeight: '800', color: 'var(--neon-purple)', textDecoration: 'underline' }}>
            Apply as Mentor
          </Link>
        </div>
      </div>
    </div>
  );
};
