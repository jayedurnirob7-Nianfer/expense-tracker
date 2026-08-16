import React, { useEffect } from 'react';
import useStore from '../store/useStore';
import { Home, LayoutGrid, Wallet, ReceiptText, Settings, X, Lock, LogOut, Sun, Moon, Coins } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { activeView, setActiveView, lockApp, logout, settings, toggleTheme, cryptoHoldings, userProfile } = useStore();

  const isDark = settings?.theme === 'dark';
  const menuItems = [
    { id: 'Overview', label: 'Home Dashboard', icon: Home },
    { id: 'DebitCredit', label: 'Debit & Credit', icon: Wallet },
    { id: 'Bills', label: 'Bills', icon: ReceiptText },
    { id: 'Crypto', label: 'Crypto & Assets', icon: Coins, badge: cryptoHoldings?.length > 0 ? `${cryptoHoldings.length}` : null },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 min-h-[100dvh] w-full h-full bg-black/80 backdrop-blur-md z-[90] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-background border-r border-border z-[95] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex items-center justify-between">
          <div 
            onClick={() => {
              setActiveView('Overview');
              onClose();
            }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase block">Financial OS</span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Nirob Expense Ledger</h2>
          </div>
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
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-secondary-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon size={20} className={isActive ? 'text-primary-foreground' : 'text-secondary-foreground group-hover:text-foreground'} />
                  <span className="text-[15px]">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/15 text-primary'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-border flex flex-col gap-2">
          {/* User Account Info */}
          {userProfile?.email && (
            <div 
              onClick={() => {
                setActiveView('Settings');
                onClose();
              }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border cursor-pointer transition-colors group mb-1"
              title="View Account & Security Settings"
            >
              {userProfile?.googlePicture ? (
                <img 
                  src={userProfile.googlePicture} 
                  alt={userProfile.name || 'User'} 
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-primary/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                  {(userProfile?.name || userProfile?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-foreground truncate">{userProfile?.name || 'Account'}</p>
                  {userProfile?.hasGoogleLinked && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Google Account Bound" />
                  )}
                </div>
                <p className="text-[11px] text-secondary-foreground truncate font-mono">{userProfile?.email}</p>
              </div>
            </div>
          )}

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
