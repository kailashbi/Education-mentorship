import client from './client';

export const sessionsAPI = {
  // Razorpay Payment & Mentorship Subscriptions
  createRazorpayOrder: async (mentorId, planType = 'single') => {
    const response = await client.post(`/sessions/payment/create-order/${mentorId}/`, { plan_type: planType });
    return response.data;
  },

  verifyPayment: async (mentorId, paymentData) => {
    const response = await client.post(`/sessions/payment/verify/${mentorId}/`, paymentData);
    return response.data;
  },

  checkSubscription: async (mentorId) => {
    const response = await client.get(`/sessions/payment/check-subscription/${mentorId}/`);
    return response.data;
  },

  // Mentee books a session with a mentor
  requestSession: async (mentorId, data) => {
    const response = await client.post(`/sessions/request/${mentorId}/`, data);
    return response.data;
  },

  // Mentor gets incoming requests
  getMentorRequests: async (status = null) => {
    const params = status ? { status } : {};
    const response = await client.get('/sessions/mentor-requests/', { params });
    return response.data;
  },

  // Mentor accepts a session
  acceptSession: async (requestId) => {
    const response = await client.post(`/sessions/accept/${requestId}/`);
    return response.data;
  },

  // Mentor rejects a session
  rejectSession: async (requestId, mentorNote = '') => {
    const response = await client.post(`/sessions/reject/${requestId}/`, { mentor_note: mentorNote });
    return response.data;
  },

  // Join live session video call
  getLiveSession: async (sessionId) => {
    const response = await client.get(`/sessions/live/${sessionId}/`);
    return response.data;
  },

  // Live session status check (polled every 1.5s)
  getLiveSessionStatus: async (sessionId) => {
    const response = await client.get(`/sessions/live/${sessionId}/status/`);
    return response.data;
  },

  // WebRTC Relay Signaling
  sendSignal: async (sessionId, type, data = {}) => {
    const response = await client.post(`/sessions/live/${sessionId}/signal/`, { type, data });
    return response.data;
  },

  getSignals: async (sessionId) => {
    const response = await client.get(`/sessions/live/${sessionId}/signal/`);
    return response.data;
  },

  // End live session video call
  endLiveSession: async (sessionId) => {
    const response = await client.post(`/sessions/live/${sessionId}/end/`);
    return response.data;
  },


  // Mentee submits review
  submitReview: async (sessionId, data) => {
    const response = await client.post(`/sessions/review/${sessionId}/`, data);
    return response.data;
  },

  // Get user session history
  getMySessions: async () => {
    const response = await client.get('/sessions/my-sessions/');
    return response.data;
  },
};

export default sessionsAPI;
