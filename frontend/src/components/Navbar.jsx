import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, 
  Video, 
  MessageSquare, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Sparkles,
  Award,
  Bell
} from 'lucide-react';
import { chatAPI } from '../api/chat';
import { adminAPI } from '../api/admin';
import { authAPI } from '../api/auth';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isMentor, isMentee } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Live badge counts
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const notifData = await authAPI.getNotifications();
      setNotifications(notifData.notifications || []);
      setUnreadNotifCount(notifData.unread_count || 0);
    } catch (err) {}
  };

  // Poll for unread chats, session counts, and notifications in real time
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadChatCount(0);
      setSessionCount(0);
      setNotifications([]);
      setUnreadNotifCount(0);
      return;
    }

    const fetchBadgeData = async () => {
      try {
        // 1. Notifications
        await fetchNotifications();

        // 2. Unread chat count
        const chatData = await chatAPI.getRooms();
        if (chatData.rooms) {
          const totalUnread = chatData.rooms.reduce((acc, r) => acc + (r.unread_count || 0), 0);
          setUnreadChatCount(totalUnread);
        }

        // 3. Sessions count
        if (isMentee) {
          const menteeStats = await adminAPI.getMenteeStats();
          const activeSessions = (menteeStats.upcoming_sessions?.length || 0) + (menteeStats.active_live_sessions?.length || 0);
          setSessionCount(activeSessions || menteeStats.stats?.total_sessions_booked || 0);
        } else if (isMentor) {
          const mentorStats = await adminAPI.getMentorStats();
          const pendingOrUpcoming = (mentorStats.pending_requests?.length || 0) + (mentorStats.upcoming_sessions?.length || 0);
          setSessionCount(pendingOrUpcoming || mentorStats.stats?.completed_sessions || 0);
        }
      } catch (err) {
        // Ignore background polling errors
      }
    };

    fetchBadgeData();
    const interval = setInterval(fetchBadgeData, 4000); // Check every 4s

    return () => clearInterval(interval);
  }, [isAuthenticated, isMentee, isMentor, location.pathname]);


  return (
    <nav style={{
      position: 'sticky',
      top: '16px',
      zIndex: 1000,
      margin: '0 auto 24px auto',
      maxWidth: '1280px',
      padding: '0 16px'
    }}>
      <div className="glass-card-static" style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '20px',
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            background: 'var(--neon-lime)',
            border: '2px solid #000000',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            fontWeight: '900',
            fontSize: '1.4rem',
            color: '#0f172a'
          }}>
            M
          </div>
          <div>
            <span style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-0.5px', color: '#f8fafc' }}>
              Mentor<span style={{ color: 'var(--neon-purple)' }}>Hub</span>
            </span>
            <span className="brutal-badge badge-cyan" style={{ marginLeft: '8px', fontSize: '0.65rem', padding: '2px 6px' }}>
              LIVE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-links">
          {/* Explore Mentors only for guests or mentees */}
          {(!isAuthenticated || isMentee) && (
            <Link 
              to="/mentors" 
              className={`btn-brutal ${isActive('/mentors') ? 'btn-lime' : 'btn-white'}`}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <Compass size={16} /> Explore Mentors
            </Link>
          )}

          {isAuthenticated ? (
            <>
              {/* Dashboard Link based on Role */}
              {isAdmin && (
                <Link 
                  to="/admin/dashboard" 
                  className={`btn-brutal ${isActive('/admin/dashboard') ? 'btn-purple' : 'btn-white'}`}
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <ShieldCheck size={16} /> Admin Approval Hub
                </Link>
              )}

              {isMentor && (
                <Link 
                  to="/mentor/dashboard" 
                  className={`btn-brutal ${isActive('/mentor/dashboard') ? 'btn-cyan' : 'btn-white'}`}
                  style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LayoutDashboard size={16} /> Mentor Dashboard
                  {sessionCount > 0 && (
                    <span className="brutal-badge badge-cyan" style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '9999px' }}>
                      {sessionCount}
                    </span>
                  )}
                </Link>
              )}

              {isMentee && (
                <Link 
                  to="/mentee/dashboard" 
                  className={`btn-brutal ${isActive('/mentee/dashboard') ? 'btn-amber' : 'btn-white'}`}
                  style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LayoutDashboard size={16} /> My Sessions
                  {sessionCount > 0 && (
                    <span className="brutal-badge badge-amber" style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '9999px' }}>
                      {sessionCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Chat tab with Live Unread Counter */}
              <Link 
                to="/chat" 
                className={`btn-brutal ${isActive('/chat') ? 'btn-coral' : 'btn-white'}`}
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}
              >
                <MessageSquare size={16} /> Chat
                {unreadChatCount > 0 && (
                  <span className="brutal-badge badge-coral" style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '9999px', boxShadow: '0 0 6px #ef4444' }}>
                    {unreadChatCount}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/apply" 
                className="btn-brutal btn-purple"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <Sparkles size={16} /> Become a Mentor
              </Link>
            </>
          )}
        </div>

        {/* Right Side: Auth / Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAuthenticated ? (
            <>
              {/* Notification Bell Button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
                  className={`btn-brutal ${notifDropdownOpen ? 'btn-lime' : 'btn-white'}`}
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadNotifCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: '900',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px #ef4444'
                    }}>
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <NotificationDropdown
                  isOpen={notifDropdownOpen}
                  onClose={() => setNotifDropdownOpen(false)}
                  notifications={notifications}
                  unreadCount={unreadNotifCount}
                  onRefresh={fetchNotifications}
                />
              </div>

              {/* User Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotifDropdownOpen(false);
                  }}
                  className="btn-brutal btn-white"
                  style={{
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '9999px',
                  }}
                >

                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--neon-lime)',
                  border: '1.5px solid var(--color-border)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  color: '#0f172a'
                }}>
                  {user?.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{user?.first_name || user?.username}</span>
                <span className={`brutal-badge ${isAdmin ? 'badge-purple' : isMentor ? 'badge-cyan' : 'badge-lime'}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                  {user?.role}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div 
                  className="glass-card" 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '220px',
                    padding: '8px',
                    zIndex: 2000,
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '6px' }}>
                    <p style={{ fontWeight: '800', fontSize: '0.9rem', color: '#f8fafc' }}>{user?.full_name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email}</p>
                  </div>
                  <Link 
                    to="/profile" 
                    className="btn-brutal btn-white"
                    onClick={() => setUserDropdownOpen(false)}
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none', boxShadow: 'none', padding: '8px 12px' }}
                  >
                    <User size={16} /> Edit Profile
                  </Link>
                  <button 
                    onClick={() => { setUserDropdownOpen(false); handleLogout(); }}
                    className="btn-brutal btn-coral"
                    style={{ width: '100%', justifyContent: 'flex-start', marginTop: '6px', padding: '8px 12px' }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (


            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn-brutal btn-white" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Log in
              </Link>
              <Link to="/register" className="btn-brutal btn-lime" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
