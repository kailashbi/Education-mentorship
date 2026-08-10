import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/auth';
import { User, Save, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfileSettings = () => {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    phone: '',
    // Mentor specific
    skills: '',
    experience_years: 0,
    hourly_rate: 0,
    availability: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    demo_video_url: '',
    // Mentee specific
    interests: '',
    learning_goals: '',
    education: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [demoVideo, setDemoVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        skills: user.mentor_profile?.skills || '',
        experience_years: user.mentor_profile?.experience_years || 0,
        hourly_rate: user.mentor_profile?.hourly_rate || 0,
        availability: user.mentor_profile?.availability || '',
        linkedin_url: user.mentor_profile?.linkedin_url || '',
        github_url: user.mentor_profile?.github_url || '',
        portfolio_url: user.mentor_profile?.portfolio_url || '',
        demo_video_url: user.mentor_profile?.demo_video_url || '',
        interests: user.mentee_profile?.interests || '',
        learning_goals: user.mentee_profile?.learning_goals || '',
        education: user.mentee_profile?.education || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      setError('');

      const submissionData = new FormData();
      Object.keys(formData).forEach((key) => {
        submissionData.append(key, formData[key]);
      });
      if (profilePicture) {
        submissionData.append('profile_picture', profilePicture);
      }
      if (demoVideo) {
        submissionData.append('demo_video', demoVideo);
      }

      await authAPI.updateProfile(submissionData);
      await refreshUser();
      setMessage('Your profile has been updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '60px' }}>
      <div className="glass-card-static" style={{ padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--neon-lime)',
            border: '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <User size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Edit Your Profile</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Role: <span className="brutal-badge badge-purple">{user?.role}</span>
            </p>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '12px 16px',
            background: '#dcfce7',
            border: '2px solid #22c55e',
            borderRadius: '12px',
            color: '#15803d',
            fontWeight: '700',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
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

        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>First Name</label>
              <input type="text" name="first_name" className="brutal-input" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Last Name</label>
              <input type="text" name="last_name" className="brutal-input" value={formData.last_name} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Bio / Summary</label>
            <textarea name="bio" className="brutal-textarea" rows={3} value={formData.bio} onChange={handleChange} />
          </div>

          {/* Mentor Specific Profile Fields */}
          {user?.role === 'mentor' && (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Skills (comma separated)</label>
                <input type="text" name="skills" className="brutal-input" value={formData.skills} onChange={handleChange} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Hourly Rate (₹/hr)</label>
                  <input type="number" name="hourly_rate" className="brutal-input" value={formData.hourly_rate} onChange={handleChange} />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Years Experience</label>
                  <input type="number" name="experience_years" className="brutal-input" value={formData.experience_years} onChange={handleChange} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Availability</label>
                <input type="text" name="availability" className="brutal-input" value={formData.availability} onChange={handleChange} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Update Demo Video URL</label>
                <input type="url" name="demo_video_url" className="brutal-input" value={formData.demo_video_url} onChange={handleChange} placeholder="https://..." />
              </div>
            </>
          )}

          {/* Mentee Specific Fields */}
          {user?.role === 'mentee' && (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Interests</label>
                <input type="text" name="interests" className="brutal-input" value={formData.interests} onChange={handleChange} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Learning Goals</label>
                <textarea name="learning_goals" className="brutal-textarea" rows={2} value={formData.learning_goals} onChange={handleChange} />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Profile Avatar</label>
            <input type="file" accept="image/*" className="brutal-input" onChange={(e) => setProfilePicture(e.target.files[0])} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brutal btn-lime"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}
          >
            <Save size={16} /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
