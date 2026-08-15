import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import DebitCredit from './components/DebitCredit';
import Bills from './components/Bills';
import CryptoPortfolio from './components/CryptoPortfolio';
import SettingsView from './components/SettingsView';
import Auth from './components/Auth';
import AddTransactionModal from './components/AddTransactionModal';
import AddBillModal from './components/AddBillModal';
import useStore from './store/useStore';

function App() {
  const { 
    isAuthenticated, 
    isLocked,
    lockApp,
    fetchData,
    activeView
  } = useStore();

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLocked) {
      fetchData();
    }
  }, [isAuthenticated, isLocked, fetchData]);

  // Inactivity timeout logic (15 minutes timeout with touch & click listeners)
  useEffect(() => {
    let inactivityTimer;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (isAuthenticated && !isLocked) {
        inactivityTimer = setTimeout(() => {
          lockApp();
        }, 15 * 60 * 1000); // 15 minutes of complete inactivity
      }
    };

    if (isAuthenticated && !isLocked) {
      resetTimer();
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('mousedown', resetTimer);
      window.addEventListener('touchstart', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('scroll', resetTimer);
    }

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isAuthenticated, isLocked, lockApp]);

  if (!isAuthenticated || isLocked) {
    return <Auth />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'Overview': return <Overview onOpenAddModal={() => setIsAddTxOpen(true)} onOpenAddBillModal={() => setIsAddBillOpen(true)} />;
      case 'DebitCredit': return <DebitCredit />;
      case 'Bills': return <Bills onOpenAddBillModal={() => setIsAddBillOpen(true)} />;
      case 'Crypto': return <CryptoPortfolio />;
      case 'Settings': return <SettingsView />;
      default: return <Overview onOpenAddModal={() => setIsAddTxOpen(true)} onOpenAddBillModal={() => setIsAddBillOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <Header 
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenAddModal={() => setIsAddTxOpen(true)} 
      />
      
      <main className="py-6 px-4 sm:px-6 lg:px-8">
        {renderView()}
      </main>

      {isAddTxOpen && (
        <AddTransactionModal onClose={() => setIsAddTxOpen(false)} />
      )}

      {isAddBillOpen && (
        <AddBillModal onClose={() => setIsAddBillOpen(false)} />
      )}
    </div>
  );
}

export default App;
