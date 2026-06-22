import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';
import { userAPI } from '../api/user';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // True until we verify token

  /**
   * Load user from stored token on app start
   */
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (token) {
        try {
          // Manually inject session into Supabase client since persistSession is false.
          // This makes direct supabase.from() queries work!
          await supabase.auth.setSession({ access_token: token, refresh_token: refreshToken || '' });
          
          const res = await userAPI.getMe();
          setUser(res.data.data);
        } catch {
          // Token invalid/expired — clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          await supabase.auth.signOut();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' });
    // Always fetch the FULL profile from /user/me — the login response is partial
    // and missing stripeSubscriptionId, stripeCustomerId etc.
    const profileRes = await userAPI.getMe();
    const fullUser = profileRes.data.data;
    setUser(fullUser);
    return fullUser;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { accessToken, refreshToken } = res.data.data;
    
    if (!accessToken) {
      // Email confirmation is required by Supabase Auth
      return { emailVerificationRequired: true };
    }

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' });
    // Always fetch the FULL profile from /user/me
    const profileRes = await userAPI.getMe();
    const fullUser = profileRes.data.data;
    setUser(fullUser);
    return fullUser;
  }, []);

  /**
   * loginWithSession — called by AuthCallback after Google OAuth.
   * Receives the Supabase session directly (no backend round-trip for auth).
   * Still fetches the full profile from the backend to populate user state.
   */
  const loginWithSession = useCallback(async (session) => {
    localStorage.setItem('accessToken', session.access_token);
    localStorage.setItem('refreshToken', session.refresh_token);
    await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token || '' });
    // Fetch the full profile via the Express backend (uses the token we just stored)
    const res = await userAPI.getMe();
    const userData = res.data.data;
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout({ refreshToken: localStorage.getItem('refreshToken') });
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Clear supabase in-memory session too
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await userAPI.getMe();
      setUser(res.data.data);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    loginWithSession,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isActiveSubscriber: user?.subscriptionStatus === 'active',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
