import React, { useState } from 'react';
import useStore from '../store/useStore';
import { format } from 'date-fns';
import { Trash2, Search, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';

const TransactionList = () => {
  const { transactions, settings, deleteTransaction, updateTransaction } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = transactions.filter(t => 
    t.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (t) => {
    updateTransaction(t._id, { status: t.status === 'Paid' ? 'Pending' : 'Paid' });
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-foreground">Transactions</h2>
        <div className="relative w-full sm:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/50 text-secondary-foreground text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Description</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length > 0 ? filtered.map((t) => (
              <tr key={t._id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 whitespace-nowrap text-sm text-foreground">
                  {format(new Date(t.date), 'MMM dd, yyyy')}
                </td>
                <td className="p-4 text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    {t.isRecurring && <RefreshCcw size={14} className="text-primary" title="Recurring" />}
                    <span>{t.notes || '-'}</span>
                  </div>
                </td>
                <td className="p-4 text-sm">
                  <span 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${t.category?.color || '#8884d8'}20`, color: t.category?.color || '#8884d8' }}
                  >
                    {t.category?.name || 'Uncategorized'}
                  </span>
                  {t.subcategory && <span className="text-xs text-secondary-foreground ml-2">› {t.subcategory.name}</span>}
                </td>
                <td className="p-4 whitespace-nowrap text-sm font-semibold">
                  <div className={`flex items-center gap-1 ${t.type === 'Income' ? 'text-green-500' : 'text-foreground'}`}>
                    {t.type === 'Income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} className="text-destructive" />}
                    {settings.currency} {t.amount.toLocaleString()}
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <button 
                    onClick={() => toggleStatus(t)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${t.status === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'} hover:opacity-80 transition`}
                  >
                    {t.status}
                  </button>
                </td>
                <td className="p-4 whitespace-nowrap text-right">
                  <button 
                    onClick={() => deleteTransaction(t._id)}
                    className="p-2 text-secondary-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="p-8 text-center text-secondary-foreground">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
