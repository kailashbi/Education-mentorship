import client from './client';

export const authAPI = {
  // Mentee Registration
  registerMentee: async (formData) => {
    const isFormData = formData instanceof FormData;
    const response = await client.post('/accounts/register/mentee/', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Mentor Application with Demo Video upload
  applyMentor: async (formData) => {
    const response = await client.post('/accounts/apply/mentor/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // User Login
  login: async (credentials) => {
    const response = await client.post('/accounts/login/', credentials);
    return response.data;
  },

  // Fetch Current Logged-in User
  getMe: async () => {
    const response = await client.get('/accounts/me/');
    return response.data;
  },

  // Update Profile
  updateProfile: async (formData) => {
    const isFormData = formData instanceof FormData;
    const response = await client.patch('/accounts/profile/update/', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Submit Incident / Chat Violation Report
  reportUser: async (reportData) => {
    const response = await client.post('/accounts/reports/create/', reportData);
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await client.get('/accounts/notifications/');
    return response.data;
  },

  markNotificationRead: async (notificationId) => {
    const response = await client.post(`/accounts/notifications/${notificationId}/mark-read/`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await client.post('/accounts/notifications/mark-all-read/');
    return response.data;
  },
};


