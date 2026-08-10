import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('mentorhub_token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('mentorhub_token');
      if (storedToken) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (err) {
          console.warn('Session expired or invalid token');
          localStorage.removeItem('mentorhub_token');
          localStorage.removeItem('mentorhub_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);
    if (data.tokens && data.tokens.access) {
      localStorage.setItem('mentorhub_token', data.tokens.access);
      localStorage.setItem('mentorhub_user', JSON.stringify(data.user));
      setToken(data.tokens.access);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('mentorhub_token');
    localStorage.removeItem('mentorhub_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
      localStorage.setItem('mentorhub_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.is_superuser;
  const isMentor = user?.role === 'mentor';
  const isMentee = user?.role === 'mentee';
  const isApprovedMentor = isMentor && user?.mentor_profile?.approval_status === 'approved';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isAdmin,
        isMentor,
        isMentee,
        isApprovedMentor,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
