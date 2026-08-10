import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Video, 
  ShieldCheck, 
  Compass, 
  ArrowRight, 
  Star, 
  Users, 
  Zap, 
  CheckCircle2, 
  Play, 
  Award, 
  MessageSquare 
} from 'lucide-react';
import { mentorsAPI } from '../api/mentors';
import { VideoPlayerModal } from '../components/VideoPlayerModal';

export const LandingPage = () => {
  const [featuredMentors, setFeaturedMentors] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const data = await mentorsAPI.getMentors();
        setFeaturedMentors(data.mentors?.slice(0, 3) || []);
      } catch (err) {
        console.error('Failed to load mentors', err);
      }
    };
    fetchMentors();
  }, []);

  const handleWatchDemo = (mentor) => {
    const videoUrl = mentor.demo_video_file_url || mentor.demo_video_url || 'https://www.youtube.com/watch?v=A95rliroC8Q';
    setSelectedVideo({
      url: videoUrl,
      title: `${mentor.first_name || mentor.username}'s Demo Pitch`,
    });
    setVideoModalOpen(true);
  };


  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Hero Section */}
      <section style={{
        padding: '60px 0 80px 0',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Floating Badges */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span className="brutal-badge badge-lime">
            <Sparkles size={14} /> Next-Gen Mentorship Platform
          </span>
          <span className="brutal-badge badge-purple">
            <ShieldCheck size={14} /> 100% Admin Verified Mentors
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: '900',
          lineHeight: '1.1',
          maxWidth: '960px',
          margin: '0 auto 24px auto',
          letterSpacing: '-1.5px',
        }}>
          Master Your Craft With <span style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #f43f5e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Top-Tier Mentors</span> In Real-Time.
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: '#cbd5e1',
          maxWidth: '720px',
          margin: '0 auto 36px auto',
          fontWeight: '500'
        }}>
          Book 1-on-1 live video coaching, get custom career guidance, code reviews, and interview prep from thoroughly vetted industry leaders.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/mentors" className="btn-brutal btn-lime" style={{ fontSize: '1.1rem', padding: '14px 28px' }}>
            <Compass size={20} /> Find Your Mentor <ArrowRight size={18} />
          </Link>
          <Link to="/apply" className="btn-brutal btn-purple" style={{ fontSize: '1.1rem', padding: '14px 28px' }}>
            <Zap size={20} /> Apply As Mentor (Submit Demo)
          </Link>
        </div>

        {/* Live Metrics Showcase */}
        <div style={{
          marginTop: '60px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          maxWidth: '900px',
          margin: '60px auto 0 auto'
        }}>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--neon-lime)' }}>100%</h3>
            <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#94a3b8' }}>Video Vetted Mentors</p>
          </div>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--neon-purple)' }}>WebRTC</h3>
            <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#94a3b8' }}>1-on-1 Ultra Low Latency</p>
          </div>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--neon-coral)' }}>5.0 ★</h3>
            <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#94a3b8' }}>Average Satisfaction</p>
          </div>
        </div>
      </section>

      {/* Feature Pillar Cards (Neubrutalism + Glass) */}
      <section style={{ padding: '40px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="brutal-badge badge-cyan" style={{ marginBottom: '12px' }}>How It Works</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '900' }}>Engineered for Real Transformation</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {/* Card 1 */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'var(--neon-lime)',
              border: '2px solid rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '20px',
              color: '#0f172a'
            }}>
              <ShieldCheck size={26} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>
              1. Admin Quality Gate & Demo Video
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Every mentor submits their credentials and a video pitch. Our platform admins personally inspect every profile before granting access.
            </p>
          </div>


          {/* Card 2 */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'var(--neon-cyan)',
              border: '2px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '20px',
              color: '#ffffff'
            }}>
              <Video size={26} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>
              2. Seamless 1-on-1 WebRTC Video
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>
              Jump straight into high-definition video calls with screen sharing, call timers, and live in-call chat directly in the browser.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'var(--neon-amber)',
              border: '2px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '20px'
            }}>
              <MessageSquare size={26} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>
              3. Chat, Notes & PDF Exports
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>
              Collaborate continuously with mentors using highlighted notes, file attachments, and 1-click PDF conversation summaries.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Mentors Showcase */}
      <section style={{ padding: '60px 0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <span className="brutal-badge badge-purple" style={{ marginBottom: '8px' }}>Featured Mentors</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900' }}>Learn from Proven Practitioners</h2>
          </div>
          <Link to="/mentors" className="btn-brutal btn-white">
            View All Mentors <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid-mentors">
          {featuredMentors.length > 0 ? (
            featuredMentors.map((mentor) => (
              <div key={mentor.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'var(--neon-lime)',
                    border: '2px solid var(--color-border)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '1.5rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {mentor.profile_picture_url ? (
                      <img src={mentor.profile_picture_url} alt={mentor.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      mentor.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                      {mentor.first_name} {mentor.last_name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {mentor.experience_years} Years Exp • ₹{mentor.hourly_rate}/hr
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Star size={14} fill="#fbbf24" color="#0f172a" />
                      <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{mentor.average_rating || '5.0'}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({mentor.total_reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '16px', flex: 1 }}>
                  {mentor.bio ? mentor.bio.slice(0, 100) + '...' : 'Specialized in system architecture, engineering mentorship, and career growth.'}
                </p>


                {/* Skills tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {mentor.skills_list?.slice(0, 3).map((skill, i) => (
                    <span key={i} className="brutal-badge badge-slate" style={{ fontSize: '0.7rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Card Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(mentor.demo_video_file_url || mentor.demo_video_url) && (
                    <button 
                      onClick={() => handleWatchDemo(mentor)}
                      className="btn-brutal btn-purple" 
                      style={{ padding: '8px', fontSize: '0.8rem' }}
                    >
                      <Play size={14} /> Demo Video
                    </button>
                  )}
                  <Link 
                    to={`/mentors/${mentor.id}`} 
                    className="btn-brutal btn-lime"
                    style={{ padding: '8px', fontSize: '0.8rem', gridColumn: (mentor.demo_video_file_url || mentor.demo_video_url) ? 'auto' : '1 / -1' }}
                  >
                    View & Book
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ fontWeight: '700', color: '#64748b' }}>
                Loading verified mentors directory...
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          videoUrl={selectedVideo.url}
          videoTitle={selectedVideo.title}
        />
      )}
    </div>
  );
};
