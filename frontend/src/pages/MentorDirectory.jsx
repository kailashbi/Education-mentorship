import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Play, Sparkles, User, ArrowRight, DollarSign, Briefcase } from 'lucide-react';
import { mentorsAPI } from '../api/mentors';
import { VideoPlayerModal } from '../components/VideoPlayerModal';
import { SessionBookingModal } from '../components/SessionBookingModal';
import { useAuth } from '../context/AuthContext';

export const MentorDirectory = () => {
  const { isAuthenticated, isMentee } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);

  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [query, setQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [minExp, setMinExp] = useState('');

  // Modals state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState(null);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (query) params.q = query;
      if (selectedSkill) params.skill = selectedSkill;
      if (minRating) params.min_rating = minRating;
      if (maxRate) params.max_rate = maxRate;
      if (minExp) params.min_exp = minExp;

      const data = await mentorsAPI.getMentors(params);
      setMentors(data.mentors || []);
      if (data.skills) setAvailableSkills(data.skills);
    } catch (err) {
      console.error('Failed to fetch mentors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [selectedSkill, minRating, maxRate, minExp]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMentors();
  };

  const handleWatchDemo = (mentor) => {
    const videoUrl = mentor.demo_video_file_url || mentor.demo_video_url || 'https://www.youtube.com/watch?v=A95rliroC8Q';
    setSelectedVideo({
      url: videoUrl,
      title: `${mentor.first_name || mentor.username}'s Demo Video`,
    });
    setVideoModalOpen(true);
  };


  const handleBook = (mentor) => {
    setSelectedMentorForBooking(mentor);
    setBookingModalOpen(true);
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedSkill('');
    setMinRating('');
    setMaxRate('');
    setMinExp('');
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <span className="brutal-badge badge-lime" style={{ marginBottom: '8px' }}>
          <Sparkles size={12} /> Verified Network
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '8px' }}>
          Discover Top Mentors
        </h1>
        <p style={{ color: '#475569', fontSize: '1.05rem' }}>
          Browse verified engineers, founders, and experts ready for 1-on-1 coaching sessions.
        </p>
      </div>

      {/* Search & Filter Bar (Glassmorphic) */}
      <div className="glass-card-static" style={{ padding: '20px', marginBottom: '36px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <input
              type="text"
              className="brutal-input"
              placeholder="Search by name, expertise, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          </div>
          <button type="submit" className="btn-brutal btn-lime">
            Search Mentors
          </button>
          <button type="button" onClick={handleResetFilters} className="btn-brutal btn-white">
            Reset
          </button>
        </form>

        {/* Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {/* Skill Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
              Skill / Domain
            </label>
            <select
              className="brutal-select"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="">All Skills</option>
              {availableSkills.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Min Rating */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
              Min Rating
            </label>
            <select
              className="brutal-select"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
            </select>
          </div>

          {/* Max Hourly Rate */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
              Max Hourly Rate
            </label>
            <select
              className="brutal-select"
              value={maxRate}
              onChange={(e) => setMaxRate(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="">Any Price</option>
              <option value="500">Under ₹500/hr</option>
              <option value="1000">Under ₹1,000/hr</option>
              <option value="2000">Under ₹2,000/hr</option>
              <option value="5000">Under ₹5,000/hr</option>
            </select>
          </div>


          {/* Min Experience */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
              Min Experience
            </label>
            <select
              className="brutal-select"
              value={minExp}
              onChange={(e) => setMinExp(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="">Any Experience</option>
              <option value="1">1+ Years</option>
              <option value="3">3+ Years</option>
              <option value="5">5+ Years</option>
              <option value="8">8+ Years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>
          Showing <span className="brutal-badge badge-lime" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>{mentors.length}</span> Verified Mentors
        </p>
      </div>

      {/* Mentors Grid */}
      {loading ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontWeight: '700', color: '#64748b' }}>Loading verified mentors...</p>
        </div>
      ) : mentors.length > 0 ? (
        <div className="grid-mentors">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              {/* Top Row: Avatar & Name */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'var(--neon-lime)',
                  border: '2px solid var(--color-border)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: '1.4rem',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {mentor.profile_picture_url ? (
                    <img src={mentor.profile_picture_url} alt={mentor.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    mentor.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                      {mentor.first_name} {mentor.last_name}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--neon-lime)' }}>₹{mentor.hourly_rate}/hr</span>
                    <span>•</span>
                    <span>{mentor.experience_years} yrs exp</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Star size={14} fill="#fbbf24" color="#0f172a" />
                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#f8fafc' }}>{mentor.average_rating || '5.0'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({mentor.total_reviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '16px', flex: 1 }}>
                {mentor.bio || 'Experienced engineering mentor ready to help you level up your skills, review architectures, and prepare for high-stakes interviews.'}
              </p>


              {/* Skills List */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {mentor.skills_list?.slice(0, 4).map((skill, i) => (
                  <span key={i} className="brutal-badge badge-slate" style={{ fontSize: '0.7rem' }}>
                    {skill}
                  </span>
                ))}
              </div>

              {/* Card Bottom Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: (mentor.demo_video_file_url || mentor.demo_video_url) ? '1fr 1fr' : '1fr', gap: '8px' }}>
                {(mentor.demo_video_file_url || mentor.demo_video_url) && (
                  <button 
                    onClick={() => handleWatchDemo(mentor)}
                    className="btn-brutal btn-purple" 
                    style={{ padding: '8px', fontSize: '0.85rem' }}
                  >
                    <Play size={14} /> Demo Pitch
                  </button>
                )}
                {isAuthenticated && isMentee ? (
                  <button 
                    onClick={() => handleBook(mentor)}
                    className="btn-brutal btn-lime"
                    style={{ padding: '8px', fontSize: '0.85rem' }}
                  >
                    Book Session
                  </button>
                ) : isAuthenticated && !isMentee ? (
                  <Link 
                    to={`/mentors/${mentor.id}`} 
                    className="btn-brutal btn-white"
                    style={{ padding: '8px', fontSize: '0.85rem', textAlign: 'center' }}
                  >
                    View Profile
                  </Link>
                ) : (
                  <Link 
                    to="/register" 
                    className="btn-brutal btn-lime"
                    style={{ padding: '8px', fontSize: '0.85rem', textAlign: 'center' }}
                  >
                    Register to Book
                  </Link>
                )}

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <User size={48} style={{ margin: '0 auto 16px auto', color: '#94a3b8' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '8px' }}>No Mentors Found</h3>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            Try adjusting your search terms, skill filters, or price range.
          </p>
          <button onClick={handleResetFilters} className="btn-brutal btn-lime">
            Clear All Filters
          </button>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          videoUrl={selectedVideo.url}
          videoTitle={selectedVideo.title}
        />
      )}

      {/* Booking Modal */}
      {selectedMentorForBooking && (
        <SessionBookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          mentor={selectedMentorForBooking}
          onSuccess={() => {
            navigate('/mentee/dashboard');
          }}
        />
      )}
    </div>
  );
};

