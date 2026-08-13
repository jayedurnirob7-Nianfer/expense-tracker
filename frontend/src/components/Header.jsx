import React from 'react';
import { Plus, Download, LogOut, Settings, Moon, Sun, Lock, FolderKanban } from 'lucide-react';
import useStore from '../store/useStore';
import { exportTransactionsToPDF } from '../utils/exportPdf';

const Header = ({ onOpenAddTx, onOpenCatManager }) => {
  const { logout, lockApp, settings, updateSettings, transactions } = useStore();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleExport = () => {
    exportTransactionsToPDF(transactions, settings.currency);
  };

  return (
    <header className="bg-card border-b border-border p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <FolderKanban size={24} />
        </div>
        <h1 className="text-xl font-bold text-foreground hidden sm:block">ExpenseTracker</h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={onOpenAddTx}
          className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 sm:px-4 sm:py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Transaction</span>
        </button>

        <button 
          onClick={onOpenCatManager}
          className="p-2 text-secondary-foreground hover:bg-secondary rounded-lg transition"
          title="Manage Categories"
        >
          <Settings size={20} />
        </button>

        <button 
          onClick={handleExport}
          className="p-2 text-secondary-foreground hover:bg-secondary rounded-lg transition"
          title="Export to PDF"
        >
          <Download size={20} />
        </button>

        <div className="w-px h-6 bg-border mx-1"></div>

        <button 
          onClick={toggleTheme}
          className="p-2 text-secondary-foreground hover:bg-secondary rounded-lg transition"
          title="Toggle Theme"
        >
          {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button 
          onClick={lockApp}
          className="p-2 text-secondary-foreground hover:bg-secondary rounded-lg transition"
          title="Lock App"
        >
          <Lock size={20} />
        </button>

        <button 
          onClick={logout}
          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
