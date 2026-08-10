import client from './client';

export const adminAPI = {
  // Get platform-wide stats
  getAdminStats: async () => {
    const response = await client.get('/dashboard/admin/stats/');
    return response.data;
  },

  // Get pending / all mentor applications
  getApplications: async (status = 'pending') => {
    const response = await client.get('/dashboard/admin/applications/', {
      params: { status },
    });
    return response.data;
  },

  // Approve a mentor application
  approveMentor: async (mentorId) => {
    const response = await client.post(`/dashboard/admin/approve/${mentorId}/`);
    return response.data;
  },

  // Reject a mentor application with reason
  rejectMentor: async (mentorId, reason) => {
    const response = await client.post(`/dashboard/admin/reject/${mentorId}/`, { reason });
    return response.data;
  },

  // Get users list with role / search filters
  getUsers: async (params = {}) => {
    const response = await client.get('/dashboard/admin/users/', { params });
    return response.data;
  },

  // Toggle user suspension
  toggleSuspendUser: async (userId) => {
    const response = await client.post(`/dashboard/admin/users/${userId}/suspend/`);
    return response.data;
  },

  // Delete user permanently
  deleteUser: async (userId) => {
    const response = await client.delete(`/dashboard/admin/users/${userId}/delete/`);
    return response.data;
  },

  // Mentor dashboard stats
  getMentorStats: async () => {
    const response = await client.get('/dashboard/mentor/stats/');
    return response.data;
  },

  // Mentee dashboard stats
  getMenteeStats: async () => {
    const response = await client.get('/dashboard/mentee/stats/');
    return response.data;
  },

  // Incident & Chat Reports
  getReports: async (status = 'all') => {
    const response = await client.get('/dashboard/admin/reports/', {
      params: { status },
    });
    return response.data;
  },

  // Take action on a report (suspend, warn, dismiss)
  takeReportAction: async (reportId, action, adminNotes = '') => {
    const response = await client.post(`/dashboard/admin/reports/${reportId}/action/`, {
      action,
      admin_notes: adminNotes,
    });
    return response.data;
  },

  // Inspect full chat conversation for moderation analysis
  inspectChat: async (params) => {
    const response = await client.get('/dashboard/admin/inspect-chat/', { params });
    return response.data;
  },

  // Get all active platform chats for global inspection
  getAllChats: async () => {
    const response = await client.get('/dashboard/admin/all-chats/');
    return response.data;
  },
};


