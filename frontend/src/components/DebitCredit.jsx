import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowDownRight, ArrowUpRight, Trash2, RefreshCcw } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import useStore from '../store/useStore';

const DebitCredit = () => {
  const { 
    transactions, 
    settings, 
    selectedMonth, 
    prevMonth, 
    nextMonth, 
    deleteTransaction, 
    updateTransaction 
  } = useStore();

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
    return monthlyTransactions.filter(t => t.type === 'Expense');
  }, [monthlyTransactions]);

  const totalCredit = useMemo(() => {
    return incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [incomeTransactions]);

  const totalDebit = useMemo(() => {
    return expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [expenseTransactions]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Month Selector */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between">
        <button 
          onClick={prevMonth}
          className="p-2 hover:bg-secondary rounded-xl text-secondary-foreground hover:text-foreground transition-colors"
          title="Previous Month"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-[15px]">{format(selectedMonth, 'MMMM yyyy')}</span>
        <button 
          onClick={nextMonth}
          className="p-2 hover:bg-secondary rounded-xl text-secondary-foreground hover:text-foreground transition-colors"
          title="Next Month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

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
                <div key={t._id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.notes || t.category?.name || 'Income'}</p>
                    <p className="text-xs text-secondary-foreground">
                      {format(new Date(t.date), 'MMM dd')} · {t.category?.name || 'Income'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-green-500">
                      +{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <button 
                      onClick={() => deleteTransaction(t._id)}
                      className="p-1 text-secondary-foreground hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
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
                <div key={t._id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-foreground">{t.notes || t.category?.name || 'Expense'}</p>
                      {t.isRecurring && <RefreshCcw size={12} className="text-primary" title="Recurring" />}
                    </div>
                    <p className="text-xs text-secondary-foreground">
                      {format(new Date(t.date), 'MMM dd')} · {t.category?.name || 'Expense'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-foreground">
                      -{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <button 
                      onClick={() => updateTransaction(t._id, { status: t.status === 'Paid' ? 'Pending' : 'Paid' })}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${t.status === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                    >
                      {t.status}
                    </button>
                    <button 
                      onClick={() => deleteTransaction(t._id)}
                      className="p-1 text-secondary-foreground hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
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

    </div>
  );
};

export default DebitCredit;
