import React, { useState, useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, RefreshCcw } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import useStore from '../store/useStore';
import EditTransactionModal from './EditTransactionModal';
import MonthNavigator from './MonthNavigator';

const DebitCredit = () => {
  const { 
    transactions, 
    settings, 
    selectedMonth
  } = useStore();

  const [editingItem, setEditingItem] = useState(null);

  const currency = settings?.currency || 'BDT';

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isSameMonth(d, selectedMonth);
    });
  }, [transactions, selectedMonth]);

  const incomeTransactions = useMemo(() => {
    return monthlyTransactions.filter(t => t.type === 'Income');
  }, [monthlyTransactions]);

  const expenseTransactions = useMemo(() => {
    return monthlyTransactions.filter(t => t.type === 'Expense' && t.status === 'Paid');
  }, [monthlyTransactions]);

  const totalCredit = useMemo(() => {
    return incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [incomeTransactions]);

  const totalDebit = useMemo(() => {
    return expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [expenseTransactions]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Interactive Month Selector with Full Month/Year Picker */}
      <MonthNavigator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Credit Section (Income) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowDownRight size={18} className="text-primary" />
              <h3 className="font-bold text-[15px]">Credit — money in</h3>
            </div>
            <span className="font-bold text-[15px] text-primary">
              {currency} {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {incomeTransactions.length > 0 ? (
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm divide-y divide-border space-y-2">
              {incomeTransactions.map(t => (
                <div 
                  key={t._id} 
                  onClick={() => setEditingItem(t)}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer hover:bg-secondary/30 transition-all"
                >
                  <div>
                    <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors">{t.notes || t.category?.name || 'Income'}</p>
                    <p className="text-xs text-secondary-foreground">
                      {format(new Date(t.date), 'MMM dd')} · {t.category?.name || 'Income'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-emerald-400">
                      +{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center min-h-[140px]">
              <h4 className="text-[15px] font-bold mb-2">No income this month</h4>
              <p className="text-sm text-secondary-foreground">Add a credit transaction to see your numbers come alive.</p>
            </div>
          )}
        </div>

        {/* Debit Section (Expenses) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowUpRight size={18} className="text-destructive" />
              <h3 className="font-bold text-[15px]">Debit — costs & bills</h3>
            </div>
            <span className="font-bold text-[15px] text-foreground">
              {currency} {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {expenseTransactions.length > 0 ? (
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm divide-y divide-border space-y-2">
              {expenseTransactions.map(t => (
                <div 
                  key={t._id} 
                  onClick={() => setEditingItem(t)}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer hover:bg-secondary/30 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors">{t.notes || t.category?.name || 'Expense'}</p>
                      {t.isRecurring && <RefreshCcw size={12} className="text-primary" title="Recurring" />}
                    </div>
                    <p className="text-xs text-secondary-foreground flex items-center flex-wrap gap-1.5 mt-0.5">
                      <span>{format(new Date(t.date), 'MMM dd')} · {t.category?.name || 'Expense'}</span>
                      {t.fundSource && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Paid from: {t.fundSource}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-foreground">
                      -{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center min-h-[140px]">
              <h4 className="text-[15px] font-bold mb-2">No expenses this month</h4>
              <p className="text-sm text-secondary-foreground">Add a debit transaction to see your numbers come alive.</p>
            </div>
          )}
        </div>

      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditTransactionModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
        />
      )}

    </div>
  );
};

export default DebitCredit;
