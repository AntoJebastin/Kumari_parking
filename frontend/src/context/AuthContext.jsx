import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kumari_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('kumari_access_token') || null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (active && res?.success && res.data) {
          setUser(res.data);
          localStorage.setItem('kumari_user', JSON.stringify(res.data));
        }
      } catch {
        if (active) {
          localStorage.removeItem('kumari_access_token');
          localStorage.removeItem('kumari_user');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    verifySession();
    return () => {
      active = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('kumari_access_token', access_token);
    localStorage.setItem('kumari_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async ({ full_name, email, phone, password }) => {
    const res = await api.post('/auth/register', { full_name, email, phone, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('kumari_access_token', access_token);
    localStorage.setItem('kumari_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('kumari_access_token');
    localStorage.removeItem('kumari_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('kumari_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
