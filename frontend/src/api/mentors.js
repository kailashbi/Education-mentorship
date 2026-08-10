import client from './client';

export const mentorsAPI = {
  // Get all approved mentors with search & filtering
  getMentors: async (params = {}) => {
    const response = await client.get('/accounts/mentors/', { params });
    return response.data;
  },

  // Get specific mentor details with reviews
  getMentorDetail: async (id) => {
    const response = await client.get(`/accounts/mentors/${id}/`);
    return response.data;
  },
};
