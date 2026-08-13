import React, { useState } from 'react';
import Header from './Header';
import Summary from './Summary';
import TransactionList from './TransactionList';
import AddTransactionModal from './AddTransactionModal';
import CategoryManagerModal from './CategoryManagerModal';

const Dashboard = () => {
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header 
        onOpenAddTx={() => setIsAddTxOpen(true)}
        onOpenCatManager={() => setIsCatManagerOpen(true)}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <Summary />
        <TransactionList />
      </main>
      
      {isAddTxOpen && <AddTransactionModal onClose={() => setIsAddTxOpen(false)} />}
      {isCatManagerOpen && <CategoryManagerModal onClose={() => setIsCatManagerOpen(false)} />}
    </div>
  );
};

export default Dashboard;
