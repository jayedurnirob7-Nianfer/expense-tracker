import { create } from 'zustand';
import api from '../api';

const useStore = create((set, get) => ({
  isAuthenticated: !!localStorage.getItem('token'),
  isLocked: false,
  isSetupComplete: true,
  
  login: async (password) => {
    try {
      const res = await api.post('/auth/login', { password });
      localStorage.setItem('token', res.data.token);
      set({ isAuthenticated: true, isLocked: false });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  },

  setup: async (password) => {
    try {
      await api.post('/auth/setup', { password });
      set({ isSetupComplete: true });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Setup failed' };
    }
  },

  checkSetup: async () => {
    try {
      const res = await api.get('/auth/check-setup');
      set({ isSetupComplete: res.data.isSetup });
    } catch (error) {
      console.error('Failed to check setup', error);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false, isLocked: false });
  },

  lockApp: () => set({ isLocked: true }),

  categories: [],
  transactions: [],
  settings: { currency: 'BDT', theme: 'dark' },

  fetchSettings: async () => {
    try {
      const res = await api.get('/settings');
      set({ settings: res.data });
      if (res.data.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error(error);
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const res = await api.put('/settings', newSettings);
      set({ settings: res.data });
      if (res.data.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error(error);
    }
  },

  fetchCategories: async () => {
    try {
      const res = await api.get('/categories');
      set({ categories: res.data });
    } catch (error) {
      console.error(error);
    }
  },

  addCategory: async (data) => {
    try {
      const res = await api.post('/categories', data);
      set((state) => ({ categories: [...state.categories, res.data] }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Error' };
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      set((state) => ({ categories: state.categories.filter(c => c._id !== id) }));
    } catch (error) {
      console.error(error);
    }
  },

  fetchTransactions: async (filters = {}) => {
    try {
      const res = await api.get('/transactions', { params: filters });
      set({ transactions: res.data });
    } catch (error) {
      console.error(error);
    }
  },

  addTransaction: async (data) => {
    try {
      const res = await api.post('/transactions', data);
      set((state) => ({ transactions: [res.data, ...state.transactions] }));
    } catch (error) {
      console.error(error);
    }
  },
  
  deleteTransaction: async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      set((state) => ({ transactions: state.transactions.filter(t => t._id !== id) }));
    } catch (error) {
      console.error(error);
    }
  },
  
  updateTransaction: async (id, data) => {
    try {
      const res = await api.put(`/transactions/${id}`, data);
      set((state) => ({ 
        transactions: state.transactions.map(t => t._id === id ? res.data : t) 
      }));
    } catch (error) {
      console.error(error);
    }
  }
}));

export default useStore;
