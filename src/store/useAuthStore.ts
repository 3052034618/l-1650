import { create } from 'zustand';
import { User, ApiResponse, LoginRequest, RegisterRequest } from '../../shared/types.js';

interface AuthState {
  user: Omit<User, 'createdAt'> | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

const API_BASE = '/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<{ token: string; user: Omit<User, 'createdAt'> }> = await res.json();
      
      if (result.success && result.data) {
        localStorage.setItem('token', result.data.token);
        set({ 
          user: result.data.user, 
          token: result.data.token, 
          isAuthenticated: true, 
          loading: false 
        });
        return true;
      } else {
        set({ error: result.errors?.[0] || '登录失败', loading: false });
        return false;
      }
    } catch (error) {
      set({ error: '网络错误，请稍后重试', loading: false });
      return false;
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<{ token: string; user: Omit<User, 'createdAt'> }> = await res.json();
      
      if (result.success && result.data) {
        localStorage.setItem('token', result.data.token);
        set({ 
          user: result.data.user, 
          token: result.data.token, 
          isAuthenticated: true, 
          loading: false 
        });
        return true;
      } else {
        set({ error: result.errors?.[0] || '注册失败', loading: false });
        return false;
      }
    } catch (error) {
      set({ error: '网络错误，请稍后重试', loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },

  clearError: () => set({ error: null }),
}));

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}
