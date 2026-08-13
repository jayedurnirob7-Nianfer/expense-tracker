import React from 'react';
import useStore from '../store/useStore';
import { LayoutGrid, Wallet, ReceiptText, Settings, X, Lock, LogOut, Sun, Moon } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { activeView, setActiveView, lockApp, logout, settings, toggleTheme } = useStore();

  const isDark = settings?.theme === 'dark';
  const menuItems = [
    { id: 'Overview', label: 'Overview', icon: LayoutGrid },
    { id: 'DebitCredit', label: 'Debit & Credit', icon: Wallet },
    { id: 'Bills', label: 'Bills', icon: ReceiptText },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-background border-r border-border z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Nirob Expense Ledger</h2>
          <button onClick={onClose} className="p-2 text-secondary-foreground hover:bg-secondary rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  onClose();
                }}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-secondary-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary-foreground' : 'text-secondary-foreground group-hover:text-foreground'} />
                <span className="text-[15px]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-border flex flex-col gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-secondary-foreground font-medium text-sm hover:bg-secondary hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>

          <button
            onClick={() => {
              lockApp();
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-secondary-foreground font-medium text-sm hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Lock size={18} />
            <span>Lock App</span>
          </button>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-destructive font-medium text-sm hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
