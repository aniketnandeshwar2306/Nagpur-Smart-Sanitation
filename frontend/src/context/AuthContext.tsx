import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export type UserRole = 'citizen' | 'worker' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  ward: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  vehicle_number?: string;
  zone_assigned?: string;
  reward_points?: number;
}

interface AuthContextType {
  user: AuthUser;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  registerCitizen: (data: { name: string; phone: string; email?: string; ward: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
  getRoleDefaultUser: (role: UserRole) => AuthUser;
}

export const DEFAULT_USERS: Record<UserRole, AuthUser> = {
  citizen: {
    id: 'CIT-7819',
    name: 'Aniket Nandeshwar',
    role: 'citizen',
    ward: 'Ward 14 - Dharampeth',
    phone: '+91 98231 44556',
    email: 'aniket@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    reward_points: 1450,
  },
  worker: {
    id: 'W-002',
    name: 'Suresh Meshram',
    role: 'worker',
    ward: 'Ward 12 - Dharampeth',
    phone: '+91 98230 02222',
    email: 'suresh.meshram@nmc.gov.in',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    vehicle_number: 'NMC-T18',
    zone_assigned: 'Zone B - Civil Lines & Sitabuldi',
  },
  admin: {
    id: 'ADM-001',
    name: 'Dr. Priya Sharma',
    role: 'admin',
    ward: 'NMC HQ - Civil Lines',
    phone: '+91 98220 10001',
    email: 'priya.sharma@nmc.gov.in',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nss_auth_token'));
  const [user, setUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem('nss_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    const currentRole = (localStorage.getItem('nagpur_clean_role') as UserRole) || 'citizen';
    return DEFAULT_USERS[currentRole] || DEFAULT_USERS.citizen;
  });

  const getRoleDefaultUser = (role: UserRole): AuthUser => {
    return DEFAULT_USERS[role] || DEFAULT_USERS.citizen;
  };

  // Sync user state changes to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('nss_current_user', JSON.stringify(user));
    }
  }, [user]);

  const login = async (username: string, password: string, role?: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || 'Login failed. Please check your credentials.' };
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('nss_auth_token', data.access_token);
      localStorage.setItem('nss_current_user', JSON.stringify(data.user));
      localStorage.setItem('nagpur_clean_role', data.role);
      return { success: true };
    } catch (err: unknown) {
      // Offline fallback
      const errorMsg = err instanceof Error ? err.message : 'Server connection failed';
      console.warn('[Auth] Server login failed, applying local session:', errorMsg);
      return { success: false, error: 'Could not connect to authentication server. Please check your connection.' };
    }
  };

  const registerCitizen = async (data: { name: string; phone: string; email?: string; ward: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/citizen/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.detail || 'Registration failed.' };
      }

      setToken(resData.access_token);
      setUser(resData.user);
      localStorage.setItem('nss_auth_token', resData.access_token);
      localStorage.setItem('nss_current_user', JSON.stringify(resData.user));
      localStorage.setItem('nagpur_clean_role', 'citizen');
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Server connection failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('nss_auth_token');
    const currentRole = (localStorage.getItem('nagpur_clean_role') as UserRole) || 'citizen';
    const fallbackUser = DEFAULT_USERS[currentRole] || DEFAULT_USERS.citizen;
    setUser(fallbackUser);
    localStorage.setItem('nss_current_user', JSON.stringify(fallbackUser));
  };

  const updateUser = (updatedFields: Partial<AuthUser>) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('nss_current_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        registerCitizen,
        logout,
        updateUser,
        getRoleDefaultUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
