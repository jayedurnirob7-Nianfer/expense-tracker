import { create } from 'zustand';
import { addMonths, subMonths } from 'date-fns';
import api from '../api';

const useStore = create((set, get) => ({
  isAuthenticated: false,
  isLocked: !!localStorage.getItem('token'),
  isSetupComplete: true,
  activeView: 'Overview',
  selectedMonth: new Date(),

  setActiveView: (view) => set({ activeView: view }),
  setSelectedMonth: (date) => {
    set({ selectedMonth: date });
    get().checkAndGenerateMonthlyRecurringBills(date);
  },
  prevMonth: () => {
    set((state) => {
      const newMonth = subMonths(state.selectedMonth, 1);
      setTimeout(() => get().checkAndGenerateMonthlyRecurringBills(newMonth), 0);
      return { selectedMonth: newMonth };
    });
  },
  nextMonth: () => {
    set((state) => {
      const newMonth = addMonths(state.selectedMonth, 1);
      setTimeout(() => get().checkAndGenerateMonthlyRecurringBills(newMonth), 0);
      return { selectedMonth: newMonth };
    });
  },
  
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
      const msg = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')
        ? 'Cannot connect to server. Please ensure backend server is running on port 5000.'
        : (error.response?.data?.message || 'Login failed');
      return { success: false, message: msg };
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
      const msg = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')
        ? 'Cannot connect to server. Please ensure backend server is running on port 5000.'
        : (error.response?.data?.message || 'Setup failed');
      return { success: false, message: msg };
    }
  },

  loginWithGoogle: async (credentialOrData) => {
    try {
      const res = await api.post('/auth/google', credentialOrData);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      set({ 
        isAuthenticated: true, 
        isLocked: false, 
        isSetupComplete: true,
        userProfile: res.data.user || null
      });
      get().fetchData();
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Google authentication failed';
      return { success: false, message: msg };
    }
  },

  requestEmergencyRecovery: async (email) => {
    try {
      const res = await api.post('/auth/request-recovery', { email });
      return { success: true, data: res.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Recovery request failed',
        needsEmailInput: error.response?.data?.needsEmailInput 
      };
    }
  },

  verifyEmergencyRecovery: async (otp, newPassword) => {
    try {
      const res = await api.post('/auth/verify-recovery', { otp, newPassword });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      set({ isAuthenticated: true, isLocked: false, isSetupComplete: true });
      get().fetchData();
      return { success: true, message: res.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Recovery verification failed' 
      };
    }
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/auth/profile');
      set({ userProfile: res.data });
      return res.data;
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      set((state) => ({ userProfile: { ...state.userProfile, ...res.data.user } }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update profile' };
    }
  },

  checkSetup: async () => {
    try {
      const res = await api.get('/auth/check-setup');
      set({ 
        isSetupComplete: res.data.isSetup,
        hasBoundEmail: res.data.hasBoundEmail,
        maskedEmail: res.data.maskedEmail
      });
    } catch (error) {
      console.error('Failed to check setup', error);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false, isLocked: false, userProfile: null });
  },

  lockApp: () => set({ isLocked: true }),

  userProfile: null,
  hasBoundEmail: false,
  maskedEmail: '',

  categories: [],
  transactions: [],
  settings: { currency: 'BDT', theme: localStorage.getItem('theme') || 'dark' },

  toggleTheme: async () => {
    const currentTheme = get().settings?.theme || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set((state) => ({
      settings: { ...state.settings, theme: newTheme }
    }));
    try {
      await api.put('/settings', { theme: newTheme });
    } catch (err) {
      console.error(err);
    }
  },

  fetchSettings: async () => {
    try {
      const res = await api.get('/settings');
      const theme = res.data?.theme || localStorage.getItem('theme') || 'dark';
      set({ settings: res.data || { currency: 'BDT', theme } });
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
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
      if (res.data.theme) {
        localStorage.setItem('theme', res.data.theme);
        if (res.data.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
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
      setTimeout(() => get().checkAndGenerateMonthlyRecurringBills(get().selectedMonth), 0);
    } catch (error) {
      console.error(error);
    }
  },

  checkAndGenerateMonthlyRecurringBills: async (targetDate = get().selectedMonth) => {
    const { transactions } = get();
    // Identify recurring bill templates
    const recurringTemplates = transactions.filter(t => t.isRecurring);
    if (recurringTemplates.length === 0) return;

    // Deduplicate templates by description/notes + category ID
    const uniqueTemplatesMap = new Map();
    recurringTemplates.forEach(t => {
      const catId = t.category?._id || t.category || '';
      const key = `${(t.notes || '').toLowerCase()}_${catId}`;
      if (!uniqueTemplatesMap.has(key)) {
        uniqueTemplatesMap.set(key, t);
      }
    });

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    for (const [key, t] of uniqueTemplatesMap.entries()) {
      // Check if a bill for this template already exists in the target month
      const existsInTargetMonth = transactions.some(tx => {
        const d = new Date(tx.date);
        const txCatId = tx.category?._id || tx.category || '';
        const matchKey = `${(tx.notes || '').toLowerCase()}_${txCatId}`;
        return matchKey === key && d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      });

      if (!existsInTargetMonth) {
        const origDay = new Date(t.date).getDate();
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const validDay = Math.min(origDay, daysInMonth);
        const newBillDate = new Date(targetYear, targetMonth, validDay);

        const newBillData = {
          amount: t.amount,
          date: newBillDate,
          category: t.category?._id || t.category,
          type: 'Expense',
          notes: t.notes,
          fundSource: t.fundSource || 'Salary',
          isRecurring: true,
          status: 'Pending',
          isEssential: true
        };

        try {
          const res = await api.post('/transactions', newBillData);
          set((state) => ({ transactions: [res.data, ...state.transactions] }));
        } catch (err) {
          console.error('Failed auto-generating monthly bill:', err);
        }
      }
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
