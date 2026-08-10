import client, { API_BASE_URL } from './client';

export const chatAPI = {
  // Get all chat rooms for current user
  getRooms: async () => {
    const response = await client.get('/chat/rooms/');
    return response.data;
  },

  // Get or create chat room with a specific user
  getOrCreateRoom: async (userId) => {
    const response = await client.post(`/chat/with-user/${userId}/`);
    return response.data;
  },

  // Get specific chat room messages
  getRoomDetails: async (roomId) => {
    const response = await client.get(`/chat/room/${roomId}/`);
    return response.data;
  },

  // Send a message (text, note, or file attachment)
  sendMessage: async (roomId, formData) => {
    const isFormData = formData instanceof FormData;
    const response = await client.post(`/chat/send/${roomId}/`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Poll new messages
  pollMessages: async (roomId, lastId = 0) => {
    const response = await client.get(`/chat/poll/${roomId}/`, {
      params: { last_id: lastId },
    });
    return response.data;
  },

  // Export chat as PDF
  getExportPDFUrl: (roomId) => {
    return `${API_BASE_URL}/api/v1/chat/export/${roomId}/`;
  },
};
