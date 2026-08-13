import React, { useEffect, useRef } from 'react';
import useStore from './store/useStore';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const { isAuthenticated, isLocked, lockApp, fetchSettings, fetchCategories, fetchTransactions } = useStore();
  const inactivityTimerRef = useRef(null);

  const resetTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (isAuthenticated && !isLocked) {
      // 1 minute inactivity lock
      inactivityTimerRef.current = setTimeout(() => {
        lockApp();
      }, 60000);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isLocked) {
      fetchSettings();
      fetchCategories();
      fetchTransactions();
      
      // Setup activity listeners
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('scroll', resetTimer);
      window.addEventListener('click', resetTimer);
      
      resetTimer(); // Start timer
      
      return () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        window.removeEventListener('mousemove', resetTimer);
        window.removeEventListener('keydown', resetTimer);
        window.removeEventListener('scroll', resetTimer);
        window.removeEventListener('click', resetTimer);
      };
    }
  }, [isAuthenticated, isLocked]);

  if (!isAuthenticated || isLocked) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Dashboard />
    </div>
  );
}

export default App;
