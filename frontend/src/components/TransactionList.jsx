import React, { useState } from 'react';
import useStore from '../store/useStore';
import { format } from 'date-fns';
import { Search, RefreshCcw } from 'lucide-react';
import EditTransactionModal from './EditTransactionModal';
import { resolveFundSource } from '../utils/funds';

const TransactionList = () => {
  const { transactions, categories, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const filtered = transactions.filter(t => 
    (t.type === 'Income' || t.status === 'Paid') &&
    (t.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currency = settings.currency || 'BDT';

  // Calculate totals for filtered transactions
  let totalDebit = 0;
  let totalCredit = 0;
  filtered.forEach(t => {
    if (t.type === 'Income') totalCredit += Number(t.amount);
    else totalDebit += Number(t.amount);
  });

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Transactions Ledger</h2>
          <p className="text-xs text-secondary-foreground mt-0.5">Click any row to edit or safely delete</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/40 text-secondary-foreground text-xs uppercase tracking-wider border-b border-border">
              <th className="p-4 font-semibold w-1/2">Description</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold text-right text-rose-400">Debit</th>
              <th className="p-4 font-semibold text-right text-emerald-400">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length > 0 ? filtered.map((t) => (
              <tr 
                key={t._id} 
                onClick={() => setEditingItem(t)}
                className="hover:bg-secondary/30 cursor-pointer transition-colors group"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {t.notes || t.category?.name || 'Transaction'}
                    </span>
                    {t.isRecurring && <RefreshCcw size={12} className="text-primary shrink-0" title="Recurring" />}
                  </div>
                  <p className="text-xs text-secondary-foreground mt-0.5">
                    {format(new Date(t.date), 'MMM dd, yyyy')}
                  </p>
                </td>

                <td className="p-4 text-xs font-medium">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span 
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-transparent"
                      style={{ backgroundColor: `${t.category?.color || '#8884d8'}20`, color: t.category?.color || '#8884d8' }}
                    >
                      {t.category?.name || 'Uncategorized'}
                    </span>
                    {t.type === 'Expense' && t.fundSource && (() => {
                      const resolved = resolveFundSource(t.fundSource, transactions, categories);
                      const isMisc = resolved.toLowerCase() === 'miscellaneous' || resolved.toLowerCase() === 'misc';
                      return (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          isMisc 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          Fund: {resolved}
                        </span>
                      );
                    })()}
                  </div>
                </td>

                <td className="p-4 text-right font-bold text-sm text-foreground whitespace-nowrap">
                  {t.type === 'Expense' ? (
                    <span>{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>

                <td className="p-4 text-right font-bold text-sm text-emerald-400 whitespace-nowrap">
                  {t.type === 'Income' ? (
                    <span>{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="p-8 text-center text-secondary-foreground">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr className="bg-secondary/60 font-bold border-t-2 border-border text-sm">
              <td className="p-4 uppercase tracking-wider text-xs text-slate-300">Total</td>
              <td className="p-4"></td>
              <td className="p-4 text-right font-black text-rose-400 text-base border-t border-border">
                {currency} {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="p-4 text-right font-black text-emerald-400 text-base border-t border-border">
                {currency} {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {editingItem && (
        <EditTransactionModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
        />
      )}
    </div>
  );
};

export default TransactionList;
