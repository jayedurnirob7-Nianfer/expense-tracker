import React from 'react';
import { Menu, Plus } from 'lucide-react';
import useStore from '../store/useStore';

const Header = ({ onOpenSidebar, onOpenAddModal }) => {
  const { activeView } = useStore();

  // Format the title depending on the view
  const title = activeView === 'DebitCredit' ? 'Debit & Credit' : activeView;

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* Left section: Hamburger and Titles */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onOpenSidebar}
              className="p-2.5 rounded-full border border-border bg-card text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase mb-0.5">
                Nirob Expence Lerger
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
                {title}
              </h1>
            </div>
          </div>

          {/* Right section: Add Transaction Button */}
          <div className="flex items-center">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
            >
              <Plus size={16} />
              <span>Add transaction</span>
            </button>
          </div>
          
        </div>
      </div>
    </header>
  );
};

export default Header;
