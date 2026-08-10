import axios from 'axios';

// Get API base URL from environment or default to local Django server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to outgoing requests
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mentorhub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle expired tokens or unauthenticated errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && !window.location.pathname.includes('/apply')) {
        localStorage.removeItem('mentorhub_token');
        localStorage.removeItem('mentorhub_user');
      }
    }
    return Promise.reject(error);
  }
);

export default client;
export { API_BASE_URL };
