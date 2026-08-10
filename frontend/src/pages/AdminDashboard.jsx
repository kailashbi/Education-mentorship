import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Play, 
  AlertTriangle, 
  UserCheck, 
  Trash2, 
  Search, 
  RefreshCw,
  Video,
  Award,
  Sparkles
} from 'lucide-react';
import { VideoPlayerModal } from '../components/VideoPlayerModal';
import { RejectReasonModal } from '../components/RejectReasonModal';
import { ChatInspectorModal } from '../components/ChatInspectorModal';
import { adminAPI } from '../api/admin';

export const AdminDashboard = () => {

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'reports' | 'analytics' | 'users'
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appStatusFilter, setAppStatusFilter] = useState('pending');
  const [usersList, setUsersList] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [reportsList, setReportsList] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('pending');
  const [selectedReportForInspection, setSelectedReportForInspection] = useState(null);
  const [chatInspectorOpen, setChatInspectorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedMentorForReject, setSelectedMentorForReject] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, appsData] = await Promise.all([
        adminAPI.getAdminStats(),
        adminAPI.getApplications(appStatusFilter),
      ]);
      setStats(statsData.stats);
      setApplications(appsData.applications || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getReports(reportStatusFilter);
      setReportsList(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await adminAPI.getUsers({ q: userSearchQuery });
      setUsersList(data.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [appStatusFilter]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, reportStatusFilter, userSearchQuery]);


  // Handle Approve Mentor
  const handleApprove = async (mentorId) => {
    try {
      setActionLoading(true);
      await adminAPI.approveMentor(mentorId);
      await fetchAdminData();
    } catch (err) {
      alert('Failed to approve mentor: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reject Modal
  const openRejectModal = (mentor) => {
    setSelectedMentorForReject(mentor);
    setRejectModalOpen(true);
  };

  // Confirm Reject Mentor
  const handleConfirmReject = async (reason) => {
    try {
      setActionLoading(true);
      await adminAPI.rejectMentor(selectedMentorForReject.id, reason);
      setRejectModalOpen(false);
      await fetchAdminData();
    } catch (err) {
      alert('Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Video Preview
  const handleWatchVideo = (mentor) => {
    const videoUrl = mentor.demo_video_file_url || mentor.demo_video_url || 'https://www.youtube.com/watch?v=A95rliroC8Q';
    setSelectedVideo({
      url: videoUrl,
      title: `${mentor.first_name || mentor.username}'s Demo Pitch Video`,
    });
    setVideoModalOpen(true);
  };


  // Handle User Suspension Toggle
  const handleToggleSuspend = async (userId) => {
    try {
      await adminAPI.toggleSuspendUser(userId);
      fetchUsers();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${username}"?`)) {
      try {
        await adminAPI.deleteUser(userId);
        fetchUsers();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <span className="brutal-badge badge-purple" style={{ marginBottom: '6px' }}>
            <ShieldCheck size={12} /> Admin Control Center
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900' }}>Mentor Approval & Platform Hub</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Review demo video pitches, approve mentor accounts, and monitor platform activity.
          </p>
        </div>

        <button onClick={fetchAdminData} className="btn-brutal btn-white" style={{ padding: '8px 16px' }}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* Top Stats Overview */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '6px solid var(--neon-purple)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>
              Pending Applications
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--neon-purple)', marginTop: '4px' }}>
              {stats.pending_mentors}
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '6px solid var(--neon-lime)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>
              Approved Mentors
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#16a34a', marginTop: '4px' }}>
              {stats.total_mentors}
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '6px solid var(--neon-cyan)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>
              Active Mentees
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0891b2', marginTop: '4px' }}>
              {stats.total_mentees}
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '6px solid var(--neon-coral)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>
              Completed Sessions
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#e11d48', marginTop: '4px' }}>
              {stats.completed_sessions}
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderLeft: '6px solid #ef4444' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#b91c1c' }}>
              Incident Reports
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#ef4444', marginTop: '4px' }}>
              {stats.pending_reports || 0}
            </h2>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('applications')}
          className={`btn-brutal ${activeTab === 'applications' ? 'btn-purple' : 'btn-white'}`}
        >
          <Sparkles size={16} /> Mentor Approval Queue ({stats?.pending_mentors || 0})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`btn-brutal ${activeTab === 'reports' ? 'btn-coral' : 'btn-white'}`}
        >
          <ShieldCheck size={16} /> 🚩 Reports & Chat Analysis ({stats?.pending_reports || 0})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`btn-brutal ${activeTab === 'analytics' ? 'btn-cyan' : 'btn-white'}`}
        >
          <Award size={16} /> Platform Metrics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn-brutal ${activeTab === 'users' ? 'btn-lime' : 'btn-white'}`}
        >
          <Users size={16} /> User Management
        </button>
      </div>


      {/* TAB 1: MENTOR APPROVAL QUEUE */}
      {activeTab === 'applications' && (
        <div>
          {/* Status Sub-filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setAppStatusFilter('pending')}
                className={`btn-brutal ${appStatusFilter === 'pending' ? 'btn-amber' : 'btn-white'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Pending ({stats?.pending_mentors || 0})
              </button>
              <button
                onClick={() => setAppStatusFilter('approved')}
                className={`btn-brutal ${appStatusFilter === 'approved' ? 'btn-lime' : 'btn-white'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Approved ({stats?.total_mentors || 0})
              </button>
              <button
                onClick={() => setAppStatusFilter('rejected')}
                className={`btn-brutal ${appStatusFilter === 'rejected' ? 'btn-coral' : 'btn-white'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Rejected ({stats?.rejected_mentors || 0})
              </button>
              <button
                onClick={() => setAppStatusFilter('all')}
                className={`btn-brutal ${appStatusFilter === 'all' ? 'btn-dark' : 'btn-white'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                All Applications
              </button>
            </div>
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontWeight: '700', color: '#64748b' }}>Loading applications...</p>
            </div>
          ) : applications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {applications.map((app) => (
                <div key={app.id} className="glass-card-static" style={{ padding: '24px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    {/* Applicant Profile */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'var(--neon-purple)',
                        border: '2px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '1.4rem',
                        color: '#ffffff',
                        boxShadow: 'var(--shadow-sm)',
                        overflow: 'hidden'
                      }}>
                        {app.profile_picture_url ? (
                          <img src={app.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          app.username?.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                            {app.first_name} {app.last_name}
                          </h3>
                          <span className={`brutal-badge ${app.approval_status === 'approved' ? 'badge-lime' : app.approval_status === 'rejected' ? 'badge-coral' : 'badge-amber'}`}>
                            {app.approval_status}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          @{app.username} • {app.email} • {app.phone || 'No phone'}
                        </p>
                        <p style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '2px' }}>
                          {app.experience_years} Years Exp • ₹{app.hourly_rate}/hr • Applied: {new Date(app.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Action Controls (Video Preview & Approve/Reject) */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Watch Video Button */}
                      {(app.demo_video_file_url || app.demo_video_url) ? (
                        <button
                          onClick={() => handleWatchVideo(app)}
                          className="btn-brutal btn-purple"
                        >
                          <Play size={16} /> Watch Demo Pitch Video
                        </button>
                      ) : (
                        <span className="brutal-badge badge-slate" style={{ padding: '8px 12px' }}>
                          No Demo Video
                        </span>
                      )}

                      {/* Approve Button */}
                      {app.approval_status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={actionLoading}
                          className="btn-brutal btn-lime"
                        >
                          <CheckCircle2 size={16} /> Approve Mentor
                        </button>
                      )}

                      {/* Reject Button */}
                      {app.approval_status !== 'rejected' && (
                        <button
                          onClick={() => openRejectModal(app)}
                          disabled={actionLoading}
                          className="btn-brutal btn-coral"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {app.skills_list?.map((s, idx) => (
                        <span key={idx} className="brutal-badge badge-slate" style={{ fontSize: '0.75rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bio */}
                  {app.bio && (
                    <p style={{ fontSize: '0.9rem', color: '#334155', background: 'rgba(241, 245, 249, 0.6)', padding: '12px', borderRadius: '10px', marginBottom: '10px' }}>
                      <b>Pitch / Bio:</b> {app.bio}
                    </p>
                  )}

                  {/* Rejection Note if rejected */}
                  {app.rejection_reason && (
                    <div style={{ fontSize: '0.85rem', color: '#b91c1c', background: '#fee2e2', padding: '10px', borderRadius: '10px', fontWeight: '600' }}>
                      ⚠️ Rejection Reason: {app.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>All Clear!</h3>
              <p style={{ color: '#64748b' }}>No applications in the "{appStatusFilter}" status queue.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCIDENT REPORTS & CHAT ANALYSIS */}
      {activeTab === 'reports' && (
        <div>
          {/* Status filter bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setReportStatusFilter('pending')}
                className={`btn-brutal ${reportStatusFilter === 'pending' ? 'btn-coral' : 'btn-white'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Pending Review ({stats?.pending_reports || 0})
              </button>
              <button
                onClick={() => setReportStatusFilter('resolved')}
                className={`btn-brutal ${reportStatusFilter === 'resolved' ? 'btn-lime' : 'btn-white'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Resolved / Action Taken
              </button>
              <button
                onClick={() => setReportStatusFilter('dismissed')}
                className={`btn-brutal ${reportStatusFilter === 'dismissed' ? 'btn-slate' : 'btn-white'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Dismissed
              </button>
              <button
                onClick={() => setReportStatusFilter('all')}
                className={`btn-brutal ${reportStatusFilter === 'all' ? 'btn-dark' : 'btn-white'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                All Reports
              </button>
            </div>
          </div>

          {/* Reports Feed */}
          {loading ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontWeight: '700', color: '#64748b' }}>Loading incident reports...</p>
            </div>
          ) : reportsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reportsList.map((rep) => {
                const isResolved = rep.status === 'resolved';
                const isPending = rep.status === 'pending';
                return (
                  <div key={rep.id} className="glass-card-static" style={{ padding: '24px', borderLeft: isPending ? '6px solid #ef4444' : '6px solid #16a34a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: isPending ? 'var(--neon-coral)' : '#dcfce7',
                          border: '2px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '900',
                          color: isPending ? '#ffffff' : '#15803d'
                        }}>
                          {isPending ? '!' : '✓'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                              Report #{rep.id}: {rep.category}
                            </h3>
                            <span className={`brutal-badge ${isPending ? 'badge-coral' : isResolved ? 'badge-lime' : 'badge-slate'}`}>
                              {rep.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            Filed by <b>{rep.reporter_details?.full_name || rep.reporter_details?.username}</b> ({rep.reporter_details?.role}) against <b>{rep.reported_user_details?.full_name || rep.reported_user_details?.username}</b> ({rep.reported_user_details?.role}) • {new Date(rep.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setSelectedReportForInspection(rep);
                            setChatInspectorOpen(true);
                          }}
                          className="btn-brutal btn-cyan"
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                        >
                          🔍 Inspect Chat Log & Moderation Hub
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '12px 16px', borderRadius: '10px', marginBottom: '10px' }}>
                      <p style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                        <b>Incident Details:</b> "{rep.description}"
                      </p>
                    </div>

                    {/* Action Taken if resolved */}
                    {rep.action_taken && (
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--neon-emerald)' }}>
                        🛡️ Action Taken: {rep.action_taken} {rep.admin_notes && `(${rep.admin_notes})`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>No Reports in this Queue</h3>
              <p style={{ color: '#94a3b8' }}>All platform users and chats are in good standing.</p>
            </div>
          )}
        </div>
      )}


      {/* TAB 3: PLATFORM METRICS */}
      {activeTab === 'analytics' && (

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>Platform Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>Total Sessions Booked</span>
                <span style={{ fontWeight: '800' }}>{stats?.total_sessions || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>Completed Live Calls</span>
                <span style={{ fontWeight: '800', color: '#16a34a' }}>{stats?.completed_sessions || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>Active Live WebRTC Calls</span>
                <span style={{ fontWeight: '800', color: 'var(--neon-cyan)' }}>{stats?.active_live_sessions || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>Total Mentee Reviews</span>
                <span style={{ fontWeight: '800' }}>{stats?.total_reviews || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>Suspended Users</span>
                <span style={{ fontWeight: '800', color: '#ef4444' }}>{stats?.suspended_users || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div>
          {/* User Search */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                className="brutal-input"
                placeholder="Search users by name, username, email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <div className="glass-card-static" style={{ padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '12px', fontWeight: '800', fontSize: '0.85rem' }}>User</th>
                  <th style={{ padding: '12px', fontWeight: '800', fontSize: '0.85rem' }}>Role</th>
                  <th style={{ padding: '12px', fontWeight: '800', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '12px', fontWeight: '800', fontSize: '0.85rem' }}>Joined</th>
                  <th style={{ padding: '12px', fontWeight: '800', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '700' }}>{u.full_name || u.username}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`brutal-badge ${u.role === 'admin' ? 'badge-purple' : u.role === 'mentor' ? 'badge-cyan' : 'badge-lime'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {u.is_suspended ? (
                        <span className="brutal-badge badge-coral">Suspended</span>
                      ) : (
                        <span className="brutal-badge badge-lime">Active</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {!u.is_superuser && (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleToggleSuspend(u.id)}
                            className={`btn-brutal ${u.is_suspended ? 'btn-lime' : 'btn-coral'}`}
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="btn-brutal btn-white"
                            style={{ padding: '4px 8px', color: '#ef4444' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Reject Modal */}
      {selectedMentorForReject && (
        <RejectReasonModal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          mentorName={selectedMentorForReject.first_name || selectedMentorForReject.username}
          onConfirm={handleConfirmReject}
          loading={actionLoading}
        />
      )}

      {/* Chat Inspector Modal for Incident Review */}
      {selectedReportForInspection && (
        <ChatInspectorModal
          isOpen={chatInspectorOpen}
          onClose={() => {
            setChatInspectorOpen(false);
            setSelectedReportForInspection(null);
          }}
          report={selectedReportForInspection}
          onActionSuccess={() => {
            fetchReports();
            fetchAdminData();
          }}
        />
      )}
    </div>
  );
};

