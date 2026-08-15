import React from 'react';
import { Menu, Plus, Sun, Moon, Home } from 'lucide-react';
import useStore from '../store/useStore';

const Header = ({ onOpenSidebar, onOpenAddModal }) => {
  const { activeView, setActiveView, settings, toggleTheme } = useStore();

  const isDark = settings?.theme === 'dark';
  const isHome = activeView === 'Overview';
  const title = activeView === 'DebitCredit' 
    ? 'Debit & Credit' 
    : activeView === 'Crypto' 
    ? 'Crypto Portfolio' 
    : activeView;

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-24">
          
          {/* Left section: Hamburger & Title */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            <button 
              onClick={onOpenSidebar}
              className="p-2.5 rounded-2xl border border-border bg-card text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            
            <div 
              onClick={() => setActiveView('Overview')}
              className="flex flex-col cursor-pointer group"
              title="Click to return to Home"
            >
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase mb-0.5 group-hover:underline">
                Nirob Expense Ledger
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-none">
                {title}
              </h1>
            </div>
          </div>

          {/* Right section: Single Home Button, Theme Toggle & Add Transaction Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Single clean Home icon button */}
            <button
              onClick={() => setActiveView('Overview')}
              className={`p-2.5 rounded-2xl border transition-colors ${
                isHome 
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                  : 'bg-card text-foreground border-border hover:bg-secondary hover:text-primary'
              }`}
              title="Home Dashboard"
            >
              <Home size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl border border-border bg-card text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
          
        </div>
      </div>
    </header>
  );
};

export default Header;
