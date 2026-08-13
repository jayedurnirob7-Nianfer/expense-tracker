import React from 'react';
import useStore from '../store/useStore';
import { LayoutGrid, Wallet, ReceiptText, Settings, X, CloudOff } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { activeView, setActiveView } = useStore();

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
          <h2 className="text-xl font-bold tracking-tight text-foreground">Nirob Expence Lerger</h2>
          <button onClick={onClose} className="p-2 text-secondary-foreground hover:bg-secondary rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
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

        <div className="p-6 mt-auto">
          <div className="flex items-center gap-3 text-secondary-foreground text-sm font-medium">
            <CloudOff size={18} />
            <span>Local only — sign in to sync</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
