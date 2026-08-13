import { create } from 'zustand';
import { addMonths, subMonths } from 'date-fns';
import api from '../api';

const useStore = create((set, get) => ({
  isAuthenticated: !!localStorage.getItem('token'),
  isLocked: false,
  isSetupComplete: true,
  activeView: 'Overview',
  selectedMonth: new Date(),

  setActiveView: (view) => set({ activeView: view }),
  setSelectedMonth: (date) => set({ selectedMonth: date }),
  prevMonth: () => set((state) => ({ selectedMonth: subMonths(state.selectedMonth, 1) })),
  nextMonth: () => set((state) => ({ selectedMonth: addMonths(state.selectedMonth, 1) })),
  
  fetchData: async () => {
    const state = get();
    await Promise.all([
      state.fetchSettings(),
      state.fetchCategories(),
      state.fetchTransactions()
    ]);
  },

  login: async (password) => {
    try {
      const res = await api.post('/auth/login', { password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      set({ isAuthenticated: true, isLocked: false, isSetupComplete: true });
      get().fetchData();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  },

  setup: async (password) => {
    try {
      const res = await api.post('/auth/setup', { password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        set({ isAuthenticated: true, isLocked: false, isSetupComplete: true });
        get().fetchData();
      } else {
        set({ isSetupComplete: true });
      }
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
      set({ settings: res.data || { currency: 'BDT', theme: 'dark' } });
      if (res.data?.theme === 'dark') {
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
      set({ categories: res.data || [] });
    } catch (error) {
      console.error(error);
    }
  },

  addCategory: async (data) => {
    try {
      // Standardize category type to 'Income' or 'Expense'
      const formattedType = data.type ? (data.type.charAt(0).toUpperCase() + data.type.slice(1).toLowerCase()) : 'Expense';
      const res = await api.post('/categories', { ...data, type: formattedType });
      set((state) => ({ categories: [...state.categories, res.data] }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Error adding category' };
    }
  },

  updateCategory: async (id, data) => {
    try {
      const res = await api.put(`/categories/${id}`, data);
      set((state) => ({
        categories: state.categories.map(c => c._id === id ? res.data : c)
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || 'Error updating category' };
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
      set({ transactions: res.data || [] });
    } catch (error) {
      console.error(error);
    }
  },

  addTransaction: async (data) => {
    try {
      const formattedType = data.type ? (data.type.charAt(0).toUpperCase() + data.type.slice(1).toLowerCase()) : 'Expense';
      const res = await api.post('/transactions', { ...data, type: formattedType });
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
  },

  exportBackup: () => {
    const { settings, categories, transactions } = get();
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings,
      categories,
      transactions
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `expense_ledger_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  restoreBackup: async (backupObject) => {
    try {
      if (backupObject.settings) {
        await get().updateSettings(backupObject.settings);
      }
      if (Array.isArray(backupObject.categories)) {
        for (const cat of backupObject.categories) {
          const formattedType = cat.type ? (cat.type.charAt(0).toUpperCase() + cat.type.slice(1).toLowerCase()) : 'Expense';
          await api.post('/categories', { name: cat.name, type: formattedType, color: cat.color, budget: cat.budget });
        }
        await get().fetchCategories();
      }
      if (Array.isArray(backupObject.transactions)) {
        for (const tx of backupObject.transactions) {
          await api.post('/transactions', tx);
        }
        await get().fetchTransactions();
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to restore backup' };
    }
  }
}));

export default useStore;
