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

  const [addTxType, setAddTxType] = useState('Expense');
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenAddTx = (type = 'Expense') => {
    setAddTxType(type);
    setIsAddTxOpen(true);
  };

  useEffect(() => {
    if (isAuthenticated && !isLocked) {
      fetchData();
    }
  }, [isAuthenticated, isLocked, fetchData]);

  // 5-minute Inactivity timeout and background tab lock logic
  useEffect(() => {
    let inactivityTimer;
    const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

    const updateActivity = () => {
      if (isAuthenticated && !isLocked) {
        localStorage.setItem('last_active_time', Date.now().toString());
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          lockApp();
        }, LOCK_TIMEOUT_MS);
      }
    };

    const checkLockStatus = () => {
      if (isAuthenticated && !isLocked) {
        const lastActive = Number(localStorage.getItem('last_active_time') || 0);
        if (lastActive && (Date.now() - lastActive >= LOCK_TIMEOUT_MS)) {
          lockApp();
        } else {
          updateActivity();
        }
      }
    };

    const throttledActivity = () => {
      const last = Number(localStorage.getItem('last_active_time') || 0);
      if (Date.now() - last > 5000) { // Throttle localStorage writes to once every 5 seconds
        updateActivity();
      }
    };

    if (isAuthenticated && !isLocked) {
      updateActivity();
      window.addEventListener('mousemove', throttledActivity);
      window.addEventListener('mousedown', updateActivity);
      window.addEventListener('touchstart', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('scroll', throttledActivity);
      window.addEventListener('focus', checkLockStatus);
      document.addEventListener('visibilitychange', checkLockStatus);
    }

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', throttledActivity);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', throttledActivity);
      window.removeEventListener('focus', checkLockStatus);
      document.removeEventListener('visibilitychange', checkLockStatus);
    };
  }, [isAuthenticated, isLocked, lockApp]);

  if (!isAuthenticated || isLocked) {
    return <Auth />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'Overview': return <Overview onOpenAddModal={handleOpenAddTx} onOpenAddBillModal={() => setIsAddBillOpen(true)} />;
      case 'DebitCredit': return <DebitCredit />;
      case 'Bills': return <Bills onOpenAddBillModal={() => setIsAddBillOpen(true)} />;
      case 'Crypto': return <CryptoPortfolio />;
      case 'Settings': return <SettingsView />;
      default: return <Overview onOpenAddModal={handleOpenAddTx} onOpenAddBillModal={() => setIsAddBillOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <Header 
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenAddModal={() => handleOpenAddTx('Expense')} 
      />
      
      <main className="py-6 px-4 sm:px-6 lg:px-8">
        {renderView()}
      </main>

      {isAddTxOpen && (
        <AddTransactionModal initialType={addTxType} onClose={() => setIsAddTxOpen(false)} />
      )}

      {isAddBillOpen && (
        <AddBillModal onClose={() => setIsAddBillOpen(false)} />
      )}
    </div>
  );
}

export default App;
