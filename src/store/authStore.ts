import { create } from 'zustand';
import type { AuthState, LoginCredentials, RegisterCredentials } from '../types';
import { authService } from '../services/api';

const useAuthStore = create<AuthState & {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('token', response.data.token);
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false
      });
    }
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(credentials);
      localStorage.setItem('token', response.data.token);
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
      localStorage.removeItem('token');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Logout failed',
        isLoading: false
      });
      // Still remove token and user data on client side even if server logout fails
      localStorage.removeItem('token');
      set({
        user: null,
        isAuthenticated: false
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authService.getCurrentUser();
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }
}));

export default useAuthStore;
