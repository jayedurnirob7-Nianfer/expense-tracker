import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import DebitCredit from './components/DebitCredit';
import Bills from './components/Bills';
import SettingsView from './components/SettingsView';
import Auth from './components/Auth';
import AddTransactionModal from './components/AddTransactionModal';
import useStore from './store/useStore';

function App() {
  const { 
    isAuthenticated, 
    isLocked,
    lockApp,
    fetchData,
    activeView
  } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLocked) {
      fetchData();
    }
  }, [isAuthenticated, isLocked, fetchData]);

  // Inactivity timeout logic
  useEffect(() => {
    let inactivityTimer;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (isAuthenticated && !isLocked) {
        inactivityTimer = setTimeout(() => {
          lockApp();
        }, 60000); // 1 minute
      }
    };

    if (isAuthenticated && !isLocked) {
      resetTimer();
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('scroll', resetTimer);
    }

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isAuthenticated, isLocked, lockApp]);

  if (!isAuthenticated || isLocked) {
    return <Auth />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'Overview': return <Overview />;
      case 'DebitCredit': return <DebitCredit />;
      case 'Bills': return <Bills />;
      case 'Settings': return <SettingsView />;
      default: return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <Header 
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)} 
      />
      
      <main className="py-6 px-4 sm:px-6 lg:px-8">
        {renderView()}
      </main>

      {isAddModalOpen && (
        <AddTransactionModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}

export default App;
