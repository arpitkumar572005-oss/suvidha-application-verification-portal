import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('suvidha_token') || null);
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState([]);

  // Load demo accounts list on mount
  useEffect(() => {
    api.getDemoAccounts()
      .then(res => setDemoAccounts(res.accounts || []))
      .catch(err => console.warn('Could not load demo accounts:', err.message));
  }, []);

  // Verify token on mount or token change
  useEffect(() => {
    if (token) {
      api.getCurrentUser()
        .then(userData => {
          setUser(userData);
          setLoading(false);
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('suvidha_token');
          setToken(null);
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('suvidha_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('suvidha_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (targetRole) => {
    const targetAccount = demoAccounts.find(a => a.role === targetRole);
    if (targetAccount) {
      return login(targetAccount.email, 'Demo@123');
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(prev => ({ ...prev, ...updatedUserData }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      demoAccounts,
      login,
      logout,
      updateUser,
      switchDemoRole,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
