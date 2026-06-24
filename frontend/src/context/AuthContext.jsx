import { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to rehydrate user from stored token
  useEffect(() => {
    const token = localStorage.getItem('cg_token');
    if (!token) { setLoading(false); return; }

    authApi.getMe()
      .then(res => setUser(res.data.data.user))
      .catch(() => localStorage.removeItem('cg_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    localStorage.setItem('cg_token', res.data.token);
    setUser(res.data.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem('cg_token', res.data.token);
    setUser(res.data.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cg_token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authApi.getMe();
    setUser(res.data.data.user);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
