import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCcw, 
  Filter, 
  Layers, 
  ArrowLeft, 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale
} from 'lucide-react';
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
    setActiveView,
    debitCreditTab,
    setDebitCreditTab
  } = useStore();

  const [editingItem, setEditingItem] = useState(null);
  const [activeFundFilter, setActiveFundFilter] = useState('ALL'); // 'ALL' | 'Salary' | custom
  const [activeTab, setActiveTab] = useState(debitCreditTab || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFundCardOpen, setIsFundCardOpen] = useState(false);

  // Sync if store tab updates
  useEffect(() => {
    if (debitCreditTab) {
      setActiveTab(debitCreditTab);
    }
  }, [debitCreditTab]);

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
    return monthlyTransactions.filter(t => {
      // Fund Filter
      if (activeFundFilter !== 'ALL') {
        if (t.type === 'Income') {
          const name = t.notes?.trim() || t.category?.name?.trim() || 'Salary';
          if (name.toLowerCase() !== activeFundFilter.toLowerCase()) return false;
        } else {
          const resolved = resolveFundSource(t.fundSource, transactions, categories);
          if (resolved.toLowerCase() !== activeFundFilter.toLowerCase()) return false;
        }
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNote = t.notes?.toLowerCase().includes(q);
        const matchesCat = t.category?.name?.toLowerCase().includes(q);
        const matchesFund = t.fundSource?.toLowerCase().includes(q);
        if (!matchesNote && !matchesCat && !matchesFund) return false;
      }

      return true;
    });
  }, [monthlyTransactions, activeFundFilter, searchQuery, transactions, categories]);

  const incomeTransactions = useMemo(() => {
    return filteredMonthlyTransactions.filter(t => t.type === 'Income');
  }, [filteredMonthlyTransactions]);

  const expenseTransactions = useMemo(() => {
    return filteredMonthlyTransactions.filter(t => t.type === 'Expense' && t.status === 'Paid');
  }, [filteredMonthlyTransactions]);

  const allSortedTransactions = useMemo(() => {
    return [...filteredMonthlyTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredMonthlyTransactions]);

  const totalCredit = useMemo(() => {
    return incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [incomeTransactions]);

  const totalDebit = useMemo(() => {
    return expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [expenseTransactions]);

  const netFlow = totalCredit - totalDebit;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20">
      
      {/* Month Navigator */}
      <MonthNavigator />

      {/* Quick Cash Flow Highlights Strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Credit Total */}
        <div 
          onClick={() => setActiveTab('CREDIT')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'CREDIT' 
              ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30' 
              : 'bg-card border-border hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            <ArrowDownRight size={13} className="shrink-0" />
            <span className="truncate">Credit (In)</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-white mt-1 truncate">
            +{currency} {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Debit Total */}
        <div 
          onClick={() => setActiveTab('DEBIT')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'DEBIT' 
              ? 'bg-rose-500/15 border-rose-500/40 ring-1 ring-rose-500/30' 
              : 'bg-card border-border hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
            <ArrowUpRight size={13} className="shrink-0" />
            <span className="truncate">Debit (Out)</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-white mt-1 truncate">
            -{currency} {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Net Flow */}
        <div 
          onClick={() => setActiveTab('ALL')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'ALL' 
              ? 'bg-primary/15 border-primary/40 ring-1 ring-primary/30' 
              : 'bg-card border-border hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <Scale size={13} className="shrink-0" />
            <span className="truncate">Net Cash</span>
          </div>
          <p className={`text-base sm:text-xl font-bold mt-1 truncate ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netFlow >= 0 ? '+' : ''}{currency} {netFlow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Collapsible Fund Source Breakdown Toggle */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsFundCardOpen(!isFundCardOpen)}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-secondary/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground">Multi-Fund Breakdown & Balances</p>
              <p className="text-[11px] text-secondary-foreground">View cashflow by Salary, Freelance, Savings, etc.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
            <span>{isFundCardOpen ? 'Hide' : 'Expand'}</span>
            {isFundCardOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {isFundCardOpen && (
          <div className="p-3 sm:p-5 border-t border-border bg-background/50 animate-in fade-in duration-200">
            <FundBreakdownCard monthlyOnly={true} />
          </div>
        )}
      </div>

      {/* Controls Bar: Search & Fund Filter Chips */}
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-foreground" />
          <input
            type="text"
            placeholder="Search debit/credit by note, category, or fund..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-secondary-foreground/60 focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
        </div>

        {/* Fund Filter Chips */}
        {presentFunds.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-secondary-foreground flex items-center gap-1 shrink-0 pr-1">
              <Filter size={12} />
              Fund:
            </span>
            <button
              onClick={() => setActiveFundFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
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
      </div>

      {/* Mobile Tab Switcher (Visible on mobile screens) */}
      <div className="flex md:hidden bg-secondary/50 p-1 rounded-2xl border border-border">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-secondary-foreground hover:text-foreground'
          }`}
        >
          All ({allSortedTransactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('DEBIT')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'DEBIT'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-secondary-foreground hover:text-foreground'
          }`}
        >
          <span>Debit</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/30 font-mono">{expenseTransactions.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CREDIT')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'CREDIT'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-secondary-foreground hover:text-foreground'
          }`}
        >
          <span>Credit</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 font-mono">{incomeTransactions.length}</span>
        </button>
      </div>

      {/* Transactions Container: Unified Timeline on Mobile when 'ALL' is chosen */}
      <div className="block md:hidden">
        {activeTab === 'ALL' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">Monthly Timeline Ledger</span>
              <span className="text-xs font-mono text-secondary-foreground">{allSortedTransactions.length} transactions</span>
            </div>

            {allSortedTransactions.length > 0 ? (
              <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-sm divide-y divide-border space-y-2">
                {allSortedTransactions.map(t => {
                  const isIncome = t.type === 'Income';
                  return (
                    <div 
                      key={t._id} 
                      onClick={() => setEditingItem(t)}
                      className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer hover:bg-secondary/30 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold ${
                          isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {isIncome ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[170px] sm:max-w-xs">
                              {t.notes || t.category?.name || (isIncome ? 'Income' : 'Expense')}
                            </p>
                            {t.isRecurring && <RefreshCcw size={11} className="text-primary shrink-0" title="Recurring" />}
                            {t.receiptImage && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                                <Camera size={9} />
                                <span>Photo</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-secondary-foreground flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span>{format(new Date(t.date), 'MMM dd')} · {t.category?.name || (isIncome ? 'Income' : 'Expense')}</span>
                            {!isIncome && t.fundSource && (() => {
                              const resolved = resolveFundSource(t.fundSource, transactions, categories);
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">
                                  {resolved}
                                </span>
                              );
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-bold text-xs sm:text-sm font-mono ${isIncome ? 'text-emerald-400' : 'text-foreground'}`}>
                          {isIncome ? '+' : '-'}{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-sm font-bold text-foreground">No transactions found</p>
                <p className="text-xs text-secondary-foreground mt-1">Try changing your fund filter or search term.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'DEBIT' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Debit — Costs & Expenses</span>
              <span className="text-xs font-bold text-foreground font-mono">-{currency} {totalDebit.toLocaleString()}</span>
            </div>

            {expenseTransactions.length > 0 ? (
              <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-sm divide-y divide-border space-y-2">
                {expenseTransactions.map(t => (
                  <div 
                    key={t._id} 
                    onClick={() => setEditingItem(t)}
                    className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer hover:bg-secondary/30 transition-all active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[170px]">
                          {t.notes || t.category?.name || 'Expense'}
                        </p>
                        {t.isRecurring && <RefreshCcw size={11} className="text-primary shrink-0" title="Recurring" />}
                        {t.receiptImage && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                            <Camera size={9} />
                            <span>Photo</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-secondary-foreground flex items-center flex-wrap gap-1.5 mt-0.5">
                        <span>{format(new Date(t.date), 'MMM dd')} · {t.category?.name || 'Expense'}</span>
                        {t.fundSource && (() => {
                          const resolved = resolveFundSource(t.fundSource, transactions, categories);
                          return (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">
                              {resolved}
                            </span>
                          );
                        })()}
                      </p>
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-foreground font-mono shrink-0">
                      -{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-sm font-bold text-foreground">No expenses found</p>
                <p className="text-xs text-secondary-foreground mt-1">No debit entries for this selection.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'CREDIT' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Credit — Income & Inflow</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">+{currency} {totalCredit.toLocaleString()}</span>
            </div>

            {incomeTransactions.length > 0 ? (
              <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-sm divide-y divide-border space-y-2">
                {incomeTransactions.map(t => (
                  <div 
                    key={t._id} 
                    onClick={() => setEditingItem(t)}
                    className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer hover:bg-secondary/30 transition-all active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[170px]">
                          {t.notes || t.category?.name || 'Income'}
                        </p>
                        {t.receiptImage && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                            <Camera size={9} />
                            <span>Photo</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-secondary-foreground mt-0.5">
                        {format(new Date(t.date), 'MMM dd')} · {t.category?.name || 'Income'}
                      </p>
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-emerald-400 font-mono shrink-0">
                      +{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-sm font-bold text-foreground">No income entries</p>
                <p className="text-xs text-secondary-foreground mt-1">No credit entries for this selection.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop View: Dual Columns (Side by Side) */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        
        {/* Credit Section (Income) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowDownRight size={18} className="text-emerald-400" />
              <h3 className="font-bold text-[15px]">Credit — Money In</h3>
            </div>
            <span className="font-bold text-[15px] text-emerald-400 font-mono">
              +{currency} {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors">{t.notes || t.category?.name || 'Income'}</p>
                      {t.receiptImage && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          <Camera size={9} />
                          <span>Receipt</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary-foreground">
                      {format(new Date(t.date), 'MMM dd')} · {t.category?.name || 'Income'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-emerald-400 font-mono">
                      +{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center min-h-[140px]">
              <h4 className="text-[15px] font-bold mb-1">No income entries</h4>
              <p className="text-xs text-secondary-foreground">
                {activeFundFilter !== 'ALL' ? `No income logged for ${activeFundFilter} this month.` : 'Add a credit transaction to see your numbers come alive.'}
              </p>
            </div>
          )}
        </div>

        {/* Debit Section (Expenses) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowUpRight size={18} className="text-rose-400" />
              <h3 className="font-bold text-[15px]">Debit — Costs & Bills</h3>
            </div>
            <span className="font-bold text-[15px] text-foreground font-mono">
              -{currency} {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors">{t.notes || t.category?.name || 'Expense'}</p>
                      {t.isRecurring && <RefreshCcw size={12} className="text-primary" title="Recurring" />}
                      {t.receiptImage && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          <Camera size={9} />
                          <span>Receipt</span>
                        </span>
                      )}
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
                    <span className="font-bold text-sm text-foreground font-mono">
                      -{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center min-h-[140px]">
              <h4 className="text-[15px] font-bold mb-1">No expense entries</h4>
              <p className="text-xs text-secondary-foreground">
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

