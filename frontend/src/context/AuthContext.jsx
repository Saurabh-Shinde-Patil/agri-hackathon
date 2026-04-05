import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  
  // Farm Management State
  const [farms, setFarms] = useState([]);
  const [activeFarmId, setActiveFarmId] = useState(localStorage.getItem('activeFarmId') || null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          id: decoded.id,
          role: decoded.role || 'user',
          tier: decoded.tier || 'premium',
          email: decoded.email
        });
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error("Invalid token", err);
        logout();
      }
    } else {
      setUser(null);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (activeFarmId) {
      localStorage.setItem('activeFarmId', activeFarmId);
    } else {
      localStorage.removeItem('activeFarmId');
    }
  }, [activeFarmId]);

  const login = (newToken, email, role, tier) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setFarms([]);
    setActiveFarmId(null);
  };

  const selectFarm = (farmId) => {
    setActiveFarmId(farmId);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    farms,
    setFarms,
    activeFarmId,
    selectFarm,
    isPremium: user?.tier === 'premium' || user?.role === 'admin',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
