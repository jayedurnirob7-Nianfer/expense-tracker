import React, { useState, useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, RefreshCcw, Filter, Layers, ArrowLeft } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import useStore from '../store/useStore';
import EditTransactionModal from './EditTransactionModal';
import MonthNavigator from './MonthNavigator';
import FundBreakdownCard from './FundBreakdownCard';
import { resolveFundSource } from '../utils/funds';

const DebitCredit = () => {
  const { 
    transactions, 
    categories,
    settings, 
    selectedMonth,
    setActiveView
  } = useStore();

  const [editingItem, setEditingItem] = useState(null);
  const [activeFundFilter, setActiveFundFilter] = useState('ALL'); // 'ALL' | 'Salary' | custom

  const currency = settings?.currency || 'BDT';

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isSameMonth(d, selectedMonth);
    });
  }, [transactions, selectedMonth]);

  // Extract unique fund sources present in this month's transactions
  const presentFunds = useMemo(() => {
    const set = new Set();
    monthlyTransactions.forEach(t => {
      if (t.type === 'Income') {
        const name = t.notes?.trim() || t.category?.name?.trim() || 'Salary';
        set.add(name);
      } else if (t.type === 'Expense' && t.status === 'Paid') {
        const resolved = resolveFundSource(t.fundSource, transactions, categories);
        set.add(resolved);
      }
    });
    return Array.from(set).filter(Boolean);
  }, [monthlyTransactions, transactions, categories]);

  const filteredMonthlyTransactions = useMemo(() => {
    if (activeFundFilter === 'ALL') return monthlyTransactions;
    return monthlyTransactions.filter(t => {
      if (t.type === 'Income') {
        const name = t.notes?.trim() || t.category?.name?.trim() || 'Salary';
        return name.toLowerCase() === activeFundFilter.toLowerCase();
      } else {
        const resolved = resolveFundSource(t.fundSource, transactions, categories);
        return resolved.toLowerCase() === activeFundFilter.toLowerCase();
      }
    });
  }, [monthlyTransactions, activeFundFilter, transactions, categories]);

  const incomeTransactions = useMemo(() => {
    return filteredMonthlyTransactions.filter(t => t.type === 'Income');
  }, [filteredMonthlyTransactions]);

  const expenseTransactions = useMemo(() => {
    return filteredMonthlyTransactions.filter(t => t.type === 'Expense' && t.status === 'Paid');
  }, [filteredMonthlyTransactions]);

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

      {/* Fund Source Summary Card */}
      <FundBreakdownCard monthlyOnly={true} />

      {/* Fund Filter Chips Bar */}
      {presentFunds.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-secondary-foreground flex items-center gap-1.5 shrink-0 pr-1">
            <Filter size={13} />
            Filter Fund:
          </span>
          <button
            onClick={() => setActiveFundFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeFundFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-secondary-foreground hover:text-foreground'
            }`}
          >
            All Funds
          </button>
          {presentFunds.map(fund => (
            <button
              key={fund}
              onClick={() => setActiveFundFilter(fund)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeFundFilter.toLowerCase() === fund.toLowerCase()
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-secondary-foreground hover:text-foreground'
              }`}
            >
              {fund} Fund
            </button>
          ))}
        </div>
      )}

      {/* Credit & Debit Dual Grid */}
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
              <h4 className="text-[15px] font-bold mb-2">No income entries</h4>
              <p className="text-sm text-secondary-foreground">
                {activeFundFilter !== 'ALL' ? `No income logged for ${activeFundFilter} this month.` : 'Add a credit transaction to see your numbers come alive.'}
              </p>
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
                      {t.fundSource && (() => {
                        const resolved = resolveFundSource(t.fundSource, transactions, categories);
                        const isMisc = resolved.toLowerCase() === 'miscellaneous' || resolved.toLowerCase() === 'misc';
                        return (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isMisc 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            Paid from: {resolved}
                          </span>
                        );
                      })()}
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
              <h4 className="text-[15px] font-bold mb-2">No expense entries</h4>
              <p className="text-sm text-secondary-foreground">
                {activeFundFilter !== 'ALL' ? `No expenses paid from ${activeFundFilter} this month.` : 'Add a debit transaction to see your numbers come alive.'}
              </p>
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
