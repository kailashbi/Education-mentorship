import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { 
  Sparkles, 
  Video, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Send,
  Linkedin,
  Github,
  Globe
} from 'lucide-react';

export const MentorApply = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    bio: '',
    phone: '',
    skills: '',
    experience_years: 3,
    hourly_rate: 50,
    availability: 'Mon-Fri 10am-6pm IST',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    demo_video_url: '',
  });

  const [demoVideoFile, setDemoVideoFile] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!formData.skills.trim()) {
      setError('Please provide at least one skill or topic you can mentor in.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const submissionData = new FormData();
      Object.keys(formData).forEach((key) => {
        submissionData.append(key, formData[key]);
      });
      if (demoVideoFile) {
        submissionData.append('demo_video', demoVideoFile);
      }
      if (profilePicture) {
        submissionData.append('profile_picture', profilePicture);
      }

      const response = await authAPI.applyMentor(submissionData);
      
      // Navigate to pending approval page with applicant state
      navigate('/pending-approval', { 
        state: { 
          mentorProfile: response.mentor_profile,
          message: response.message 
        } 
      });
    } catch (err) {
      const errData = err.response?.data?.errors;
      if (errData) {
        const msg = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ');
        setError(msg);
      } else {
        setError(err.response?.data?.error || 'Failed to submit mentor application.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '40px auto 80px auto', padding: '0 16px' }}>
      <div className="glass-card-static" style={{ padding: '36px' }}>
        {/* Banner */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="brutal-badge badge-purple" style={{ marginBottom: '8px' }}>
            <Sparkles size={12} /> Mentor Verification Portal
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: '900' }}>Apply to Become an Approved Mentor</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px', maxWidth: '600px', margin: '6px auto 0 auto' }}>
            To ensure the highest standard of guidance for mentees, all mentors must submit basic details and a <b>Demo Pitch Video</b> for admin approval.
          </p>
        </div>

        {/* Process Checklist */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '16px',
          background: 'rgba(241, 245, 249, 0.85)',
          borderRadius: '14px',
          border: '2px dashed var(--color-border)',
          marginBottom: '28px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <span>1. Submit Profile & Demo Video</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#0891b2" />
            <span>2. Admin Reviews Video & Skills</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#7c3aed" />
            <span>3. Account Approved for Bookings</span>
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

        <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: Account Info */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', borderBottom: '2px solid var(--color-border)', paddingBottom: '6px', marginBottom: '14px' }}>
              1. Basic Account Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>First Name *</label>
                <input type="text" name="first_name" className="brutal-input" placeholder="e.g. Alex" value={formData.first_name} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Last Name *</label>
                <input type="text" name="last_name" className="brutal-input" placeholder="e.g. Rivera" value={formData.last_name} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Username *</label>
                <input type="text" name="username" className="brutal-input" placeholder="e.g. mentor_alex" value={formData.username} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Email Address *</label>
                <input type="email" name="email" className="brutal-input" placeholder="alex@techcorp.com" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Password *</label>
              <input type="password" name="password" className="brutal-input" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
          </div>

          {/* Section 2: Mentorship Credentials */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', borderBottom: '2px solid var(--color-border)', paddingBottom: '6px', marginBottom: '14px' }}>
              2. Skills & Mentorship Details
            </h4>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                Skills & Domains (Comma Separated) *
              </label>
              <input
                type="text"
                name="skills"
                className="brutal-input"
                placeholder="e.g. Python, System Design, React, AWS, Engineering Leadership, Mock Interviews"
                value={formData.skills}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Years Experience</label>
                <input type="number" min="0" name="experience_years" className="brutal-input" value={formData.experience_years} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Hourly Rate (₹/hr)</label>
                <input type="number" min="0" name="hourly_rate" className="brutal-input" value={formData.hourly_rate} onChange={handleChange} required />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Availability</label>
                <input type="text" name="availability" className="brutal-input" placeholder="Mon-Fri 10am-6pm" value={formData.availability} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>Mentor Bio & Pitch</label>
              <textarea
                name="bio"
                className="brutal-textarea"
                rows={3}
                placeholder="Share your background, current role, technologies you specialize in, and how you help mentees succeed..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Section 3: Demo Video & Verification Files */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', borderBottom: '2px solid var(--color-border)', paddingBottom: '6px', marginBottom: '14px' }}>
              3. Demo Video Pitch & Verification (Admin Required)
            </h4>

            <div className="glass-card" style={{ padding: '20px', background: 'rgba(254, 240, 138, 0.35)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Video size={24} color="#854d0e" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h5 style={{ fontWeight: '800', color: '#713f12', marginBottom: '4px' }}>Upload Your Demo Pitch Video</h5>
                  <p style={{ fontSize: '0.85rem', color: '#854d0e' }}>
                    Record a 1 to 3-minute video introducing yourself, explaining your teaching philosophy, or demonstrating how you explain a technical concept. Admins will review this before approving your profile.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Option A: Upload Video File (.mp4, .webm, .mov)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  className="brutal-input"
                  onChange={(e) => setDemoVideoFile(e.target.files[0])}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Option B: Video URL (YouTube / Loom / Drive)
                </label>
                <input
                  type="url"
                  name="demo_video_url"
                  className="brutal-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.demo_video_url}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                Profile Avatar Photo
              </label>
              <input
                type="file"
                accept="image/*"
                className="brutal-input"
                onChange={(e) => setProfilePicture(e.target.files[0])}
              />
            </div>
          </div>

          {/* Section 4: Social / Verification Links */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', borderBottom: '2px solid var(--color-border)', paddingBottom: '6px', marginBottom: '14px' }}>
              4. Verification Links
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <Linkedin size={14} style={{ verticalAlign: 'middle' }} /> LinkedIn
                </label>
                <input type="url" name="linkedin_url" className="brutal-input" placeholder="https://linkedin.com/in/..." value={formData.linkedin_url} onChange={handleChange} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <Github size={14} style={{ verticalAlign: 'middle' }} /> GitHub
                </label>
                <input type="url" name="github_url" className="brutal-input" placeholder="https://github.com/..." value={formData.github_url} onChange={handleChange} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <Globe size={14} style={{ verticalAlign: 'middle' }} /> Portfolio
                </label>
                <input type="url" name="portfolio_url" className="brutal-input" placeholder="https://myportfolio.com" value={formData.portfolio_url} onChange={handleChange} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brutal btn-purple"
            style={{ width: '100%', padding: '16px', fontSize: '1.05rem', marginTop: '10px' }}
          >
            <Send size={18} /> {loading ? 'Submitting Application & Video...' : 'Submit Application for Admin Approval'}
          </button>
        </form>
      </div>
    </div>
  );
};
