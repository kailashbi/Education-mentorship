import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Play, 
  Calendar, 
  Clock, 
  Linkedin, 
  Github, 
  Globe, 
  ShieldCheck, 
  MessageSquare, 
  Award,
  ArrowLeft
} from 'lucide-react';
import { mentorsAPI } from '../api/mentors';
import { VideoPlayerModal } from '../components/VideoPlayerModal';
import { SessionBookingModal } from '../components/SessionBookingModal';
import { ReportUserModal } from '../components/ReportUserModal';
import { useAuth } from '../context/AuthContext';

export const MentorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isMentee } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);


  useEffect(() => {
    const fetchMentor = async () => {
      try {
        setLoading(true);
        const data = await mentorsAPI.getMentorDetail(id);
        setMentor(data.mentor);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Failed to load mentor profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentor();
  }, [id]);

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const data = await chatAPI.getOrCreateRoom(mentor.user);
      navigate(`/chat?room=${data.room.id}`);
    } catch (err) {
      console.error('Failed to open chat', err);
      navigate('/chat');
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ fontWeight: '700', color: '#64748b' }}>Loading mentor profile...</p>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px' }}>Mentor Not Found</h3>
        <Link to="/mentors" className="btn-brutal btn-lime">
          Back to Directory
        </Link>
      </div>
    );
  }

  const demoVideoUrl = mentor.demo_video_file_url || mentor.demo_video_url;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Back link */}
      <Link to="/mentors" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Mentors
      </Link>

      {/* Main Mentor Profile Glass Card */}
      <div className="glass-card-static" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Avatar + Basic Details */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '24px',
              background: 'var(--neon-lime)',
              border: '3px solid var(--color-border)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '2rem',
              boxShadow: 'var(--shadow-md)'
            }}>
              {mentor.profile_picture_url ? (
                <img src={mentor.profile_picture_url} alt={mentor.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                mentor.username.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '900' }}>
                  {mentor.first_name} {mentor.last_name}
                </h1>
                <span className="brutal-badge badge-lime">
                  <ShieldCheck size={14} /> Verified
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '600' }}>
                {mentor.experience_years} Years Industry Experience • {mentor.total_sessions} Sessions Completed
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <Star size={18} fill="#fbbf24" color="#0f172a" />
                <span style={{ fontWeight: '900', fontSize: '1rem' }}>{mentor.average_rating || '5.0'}</span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({mentor.total_reviews} reviews)</span>
              </div>
            </div>
          </div>

          {/* Rate & Action Buttons */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f8fafc', marginBottom: '8px' }}>
              ₹{mentor.hourly_rate}<span style={{ fontSize: '1rem', color: '#94a3b8' }}>/hr</span>
            </div>

            
            <div style={{ display: 'flex', gap: '10px' }}>
              {demoVideoUrl && (
                <button 
                  onClick={() => setVideoModalOpen(true)}
                  className="btn-brutal btn-purple"
                >
                  <Play size={16} /> Watch Demo Pitch
                </button>
              )}
              {isAuthenticated && isMentee ? (
                <button 
                  onClick={() => setBookingModalOpen(true)}
                  className="btn-brutal btn-lime"
                >
                  <Calendar size={16} /> Book Mentorship
                </button>
              ) : isAuthenticated && !isMentee ? (
                <button 
                  onClick={() => alert('Only mentees / students can book mentorship sessions.')}
                  className="btn-brutal btn-slate"
                >
                  <Calendar size={16} /> Book Session
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/register', { state: { message: 'Please register as a student to book mentorship sessions.' } })}
                  className="btn-brutal btn-lime"
                >
                  <Calendar size={16} /> Register to Book
                </button>
              )}
              <button onClick={handleStartChat} className="btn-brutal btn-white">
                <MessageSquare size={16} /> Chat
              </button>
            </div>

          </div>
        </div>

        {/* Skills List */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: '#64748b' }}>
            Specialized Skills & Topics
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {mentor.skills_list?.map((skill, idx) => (
              <span key={idx} className="brutal-badge badge-slate" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* About / Bio */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--neon-cyan)' }}>
            About the Mentor
          </h4>
          <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#cbd5e1' }}>
            {mentor.bio || 'Dedicated to coaching developers and founders in leveling up architecture, engineering mastery, and career roadmaps.'}
          </p>
        </div>

        {/* Availability & Social Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8' }}>Typical Availability</span>
            <p style={{ fontWeight: '700', fontSize: '0.9rem', marginTop: '2px', color: '#f8fafc' }}>
              {mentor.availability || 'Weekdays 9:00 AM – 6:00 PM'}
            </p>
          </div>


          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {mentor.linkedin_url && (
              <a href={mentor.linkedin_url} target="_blank" rel="noreferrer" className="btn-brutal btn-white" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Linkedin size={14} /> LinkedIn
              </a>
            )}
            {mentor.github_url && (
              <a href={mentor.github_url} target="_blank" rel="noreferrer" className="btn-brutal btn-white" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Github size={14} /> GitHub
              </a>
            )}
            {mentor.portfolio_url && (
              <a href={mentor.portfolio_url} target="_blank" rel="noreferrer" className="btn-brutal btn-white" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Globe size={14} /> Portfolio
              </a>
            )}
            {isAuthenticated && (
              <button 
                onClick={() => setReportModalOpen(true)}
                className="btn-brutal btn-white"
                style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', marginLeft: 'auto' }}
                title="Report this mentor profile to admin"
              >
                🚩 Report Profile
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Reviews Section */}
      <div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '16px' }}>
          Mentee Reviews ({reviews.length})
        </h3>

        {reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map((rev) => (
              <div key={rev.id} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--neon-lime)',
                      border: '2px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.9rem'
                    }}>
                      {rev.mentee_avatar ? (
                        <img src={rev.mentee_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                      ) : (
                        rev.mentee_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>{rev.mentee_name}</h4>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="#fbbf24" color="#0f172a" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#334155', marginTop: '6px' }}>
                  "{rev.comment || 'Great session! Very helpful insights.'}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            <Award size={36} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
            <p style={{ fontWeight: '700' }}>No reviews yet</p>
            <p style={{ fontSize: '0.85rem' }}>Be the first mentee to book a session and leave a review!</p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {demoVideoUrl && (
        <VideoPlayerModal
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          videoUrl={demoVideoUrl}
          videoTitle={`${mentor.first_name || mentor.username}'s Demo Pitch`}
        />
      )}

      {/* Booking Modal */}
      <SessionBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        mentor={mentor}
        onSuccess={() => {
          navigate('/mentee/dashboard');
        }}
      />


      {/* Report Modal */}
      {mentor && (
        <ReportUserModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportedUser={mentor}
        />
      )}
    </div>
  );
};

