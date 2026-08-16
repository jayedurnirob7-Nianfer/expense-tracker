import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, RefreshCcw, AlertTriangle, CheckCircle2, Clock, Plus, ArrowUpRight, ArrowDownRight, Coins, ChevronRight as ArrowRightIcon, Camera, Wallet } from 'lucide-react';
import { format, isSameMonth, isSameDay, getDaysInMonth, startOfMonth, addDays } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import useStore from '../store/useStore';
import EditTransactionModal from './EditTransactionModal';
import BillActionModal from './BillActionModal';
import MonthNavigator from './MonthNavigator';
import FundBreakdownCard from './FundBreakdownCard';
import { Check } from 'lucide-react';
import { resolveFundSource } from '../utils/funds';

const CustomDailyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    const income = Number(data?.Income || 0);
    const expense = Number(data?.Expense || 0);
    const net = income - expense;
    const currency = useStore.getState().settings?.currency || 'BDT';
    return (
      <div className="bg-[#0e1621]/95 backdrop-blur-md border border-[#1e293b] rounded-2xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[190px] pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-foreground">
        <div className="font-bold text-slate-200 border-b border-[#1e293b] pb-1.5 flex items-center justify-between">
          <span>{data?.dateStr || `Day ${data?.day}`}</span>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded">Day {data?.day}</span>
        </div>
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Income:
            </span>
            <span className="font-bold text-white">
              {currency} {income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Expense:
            </span>
            <span className="font-bold text-white">
              {currency} {expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          {(income > 0 || expense > 0) && (
            <div className="pt-1.5 mt-1 border-t border-[#1e293b] flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Net Flow:</span>
              <span className={`font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {net >= 0 ? '+' : ''}{currency} {net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const currency = useStore.getState().settings?.currency || 'BDT';
    return (
      <div className="bg-[#0e1621]/95 backdrop-blur-md border border-[#1e293b] rounded-xl px-3.5 py-2.5 shadow-2xl text-xs flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
        <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: data.payload?.color }} />
        <div>
          <p className="text-slate-300 font-medium">{data.name}</p>
          <p className="font-bold text-white text-sm">{currency} {Number(data.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    );
  }
  return null;
};

const Overview = ({ onOpenAddModal, onOpenAddBillModal }) => {
  const { 
    transactions, 
    categories, 
    settings, 
    selectedMonth, 
    prevMonth, 
    nextMonth, 
    deleteTransaction, 
    updateTransaction,
    cryptoSummary,
    cryptoHoldings,
    setActiveView
  } = useStore();

  const [editingItem, setEditingItem] = useState(null);
  const [activeBillAction, setActiveBillAction] = useState(null);
  const [selectedBillIds, setSelectedBillIds] = useState([]);

  const currency = settings?.currency || 'BDT';

  // Helper to check if a pending bill is past due date (e.g. 10th or date < today)
  const isOverdue = (bill) => {
    if (bill.status !== 'Pending') return false;
    const now = new Date();
    const billDate = new Date(bill.date);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const billStart = new Date(billDate.getFullYear(), billDate.getMonth(), billDate.getDate());
    
    if (billStart < todayStart) return true;
    if (isSameMonth(now, billDate) && (now.getDate() >= billDate.getDate() || now.getDate() >= 10)) return true;
    return false;
  };

  // Essential bills for selected month - ONLY recurring/essential items!
  const essentialBills = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isSameMonth(d, selectedMonth) && (t.isRecurring || t.isEssential);
    });
  }, [transactions, selectedMonth]);

  const pendingBills = useMemo(() => {
    return essentialBills.filter(b => b.status === 'Pending');
  }, [essentialBills]);

  const selectedTotalAmount = useMemo(() => {
    return essentialBills
      .filter(b => selectedBillIds.includes(b._id))
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  }, [essentialBills, selectedBillIds]);

  const toggleSelectBill = (id) => {
    setSelectedBillIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPending = () => {
    if (selectedBillIds.length === pendingBills.length && pendingBills.length > 0) {
      setSelectedBillIds([]);
    } else {
      setSelectedBillIds(pendingBills.map(b => b._id));
    }
  };

  const handleBatchPaySelected = async () => {
    if (selectedBillIds.length === 0) return;
    await Promise.all(
      selectedBillIds.map(id => updateTransaction(id, { status: 'Paid' }))
    );
    setSelectedBillIds([]);
  };

  const overdueBills = useMemo(() => {
    return essentialBills.filter(b => b.status === 'Pending' && isOverdue(b));
  }, [essentialBills]);

  // Completed Recent Transactions (Income & Paid Expenses only - pending bills stay in Essential Bills)
  const recentTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isSameMonth(d, selectedMonth) && (t.type === 'Income' || t.status === 'Paid');
    });
  }, [transactions, selectedMonth]);

  // Income (Credit), Expenses (Debit), Balance for selected month
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    recentTransactions.forEach(t => {
      if (t.type === 'Income') inc += Number(t.amount);
      else exp += Number(t.amount);
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: inc - exp
    };
  }, [recentTransactions]);

  const recentIncomeTransactions = useMemo(() => {
    return recentTransactions.filter(t => t.type === 'Income');
  }, [recentTransactions]);

  const recentExpenseTransactions = useMemo(() => {
    return recentTransactions.filter(t => t.type === 'Expense');
  }, [recentTransactions]);

  // Overall Total Balance (across all completed transactions)
  const overallBalance = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      if (t.type === 'Income' || t.status === 'Paid') {
        if (t.type === 'Income') inc += Number(t.amount);
        else exp += Number(t.amount);
      }
    });
    return inc - exp;
  }, [transactions]);

  // Category breakdown for pie chart
  const categoryPieData = useMemo(() => {
    const map = {};
    recentTransactions.forEach(t => {
      if (t.type === 'Expense') {
        const catName = t.category?.name || 'Uncategorized';
        map[catName] = (map[catName] || 0) + Number(t.amount);
      }
    });

    return Object.keys(map).map(catName => {
      const catObj = categories.find(c => c.name === catName);
      return {
        name: catName,
        value: map[catName],
        color: catObj?.color || '#8884d8'
      };
    }).sort((a, b) => b.value - a.value);
  }, [recentTransactions, categories]);

  // Daily breakdown bar chart data for selected month
  const dailyHistory = useMemo(() => {
    const totalDays = getDaysInMonth(selectedMonth);
    const monthStart = startOfMonth(selectedMonth);
    const days = [];

    for (let i = 0; i < totalDays; i++) {
      const currentDayDate = addDays(monthStart, i);
      const dayNum = i + 1;
      const dayLabel = String(dayNum);

      let inc = 0;
      let exp = 0;

      recentTransactions.forEach(t => {
        const d = new Date(t.date);
        if (isSameDay(d, currentDayDate)) {
          if (t.type === 'Income') inc += Number(t.amount);
          else exp += Number(t.amount);
        }
      });

      days.push({
        day: dayLabel,
        dateStr: format(currentDayDate, 'MMM d, yyyy'),
        Income: inc,
        Expense: exp
      });
    }

    return days;
  }, [recentTransactions, selectedMonth]);

  const paidBillsAmount = useMemo(() => {
    return essentialBills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + Number(b.amount), 0);
  }, [essentialBills]);

  const totalBillsAmount = useMemo(() => {
    return essentialBills.reduce((sum, b) => sum + Number(b.amount), 0);
  }, [essentialBills]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">
      
      {/* Interactive Month Selector with Full Month/Year Picker */}
      <div className="order-1">
        <MonthNavigator />
      </div>

      {/* Overdue Unpaid Essential Bill Alert Banner */}
      {overdueBills.length > 0 && (
        <div className="order-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-400 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-200 flex items-center gap-2">
                <span>⚠️ Unpaid Essential Bill Reminder ({overdueBills.length})</span>
              </h4>
              <p className="text-xs text-amber-400/90 mt-0.5">
                {overdueBills.map(b => `${b.notes || b.category?.name || 'Bill'} (${currency} ${Number(b.amount).toLocaleString()})`).join(', ')} past due date!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {overdueBills.map(b => (
              <button
                key={b._id}
                onClick={() => updateTransaction(b._id, { status: 'Paid' })}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Pay {b.notes || 'Bill'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Total Balance Card */}
      <div className="order-3 bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-2 text-secondary-foreground uppercase tracking-wider text-xs font-bold mb-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Total Balance
        </div>
        <h2 className={`text-4xl font-black tracking-tight ${overallBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
          {currency} {overallBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
      </div>

      {/* Credit / Debit Mini Cards */}
      <div className="order-4 grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-primary uppercase tracking-wider text-xs font-bold mb-1.5">
            <TrendingUp size={14} strokeWidth={3} />
            Credit (Income)
          </div>
          <p className="text-xl font-bold text-foreground">
            {currency} {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-orange-400 uppercase tracking-wider text-xs font-bold mb-1.5">
            <TrendingDown size={14} strokeWidth={3} />
            Debit (Expenses)
          </div>
          <p className="text-xl font-bold text-foreground">
            {currency} {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Crypto Portfolio Quick Snapshot */}
      {cryptoSummary && (
        <div 
          onClick={() => setActiveView('Crypto')}
          className="order-5 group relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-card to-primary/10 border border-amber-500/30 hover:border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-sm cursor-pointer transition-all duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-inner">
                <Coins size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground group-hover:text-amber-400 transition-colors">
                    Crypto & Investment Portfolio
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Live
                  </span>
                </div>
                <p className="text-xs text-secondary-foreground mt-0.5">
                  {cryptoHoldings.length} Active Holding{cryptoHoldings.length === 1 ? '' : 's'} · Real-time market valuation
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-5">
              <div className="text-left sm:text-right">
                <p className="text-xs text-secondary-foreground">Current Valuation</p>
                <p className="font-mono font-extrabold text-lg text-foreground">
                  ${cryptoSummary.currentValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-secondary-foreground">Total Return</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${
                  cryptoSummary.totalProfitLossUsd >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {cryptoSummary.totalProfitLossUsd >= 0 ? '+' : ''}{cryptoSummary.totalReturnPercent.toFixed(2)}%
                </span>
              </div>

              <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ArrowRightIcon size={16} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fund Source Breakdown & Totals (Mobile: Order 8, Desktop: Order 6) */}
      <div className="order-8 md:order-6">
        <FundBreakdownCard monthlyOnly={true} />
      </div>

      {/* Charts Row (Order 7 on Mobile & Desktop) */}
      <div className="order-7 md:order-7 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Breakdown Pie Chart */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm min-h-[260px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-[15px] text-foreground">Where the money goes</h3>
            <p className="text-xs text-secondary-foreground mt-0.5">Top expense categories for {format(selectedMonth, 'MMM yyyy')}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {categoryPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-secondary-foreground">No expenses logged for this month</p>
            )}
          </div>
        </div>

        {/* Daily Activity Full-Month Candles */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm min-h-[260px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[15px] text-foreground">Daily Activity</h3>
              <p className="text-xs text-secondary-foreground mt-0.5">Full month candles for {format(selectedMonth, 'MMMM yyyy')}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                Expense
              </span>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyHistory} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barGap={1}>
                <XAxis 
                  dataKey="day" 
                  tickLine={false} 
                  axisLine={{ stroke: '#1e293b' }} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={dailyHistory.length > 20 ? 2 : 0}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 6 }}
                  content={<CustomDailyTooltip />}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={6} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* High-Visibility Activity Section: Credit & Debit Cards (Mobile: Order 6, Desktop: Order 8) */}
      <div className="order-6 md:order-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Left Card: Credit — Money In */}
          <div className="bg-[#0b1622] rounded-3xl border border-emerald-500/40 overflow-hidden shadow-xl shadow-emerald-950/30 flex flex-col transition-all hover:border-emerald-400/60">
            {/* Card Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-900/70 via-emerald-950/50 to-transparent border-b border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold shadow-sm shrink-0">
                  <ArrowDownRight size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide">Credit · Money In</h3>
                  <p className="text-xs text-emerald-300/90 font-medium">Total earned & credited</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="font-black text-base sm:text-lg text-emerald-300 font-mono">
                  +{currency} {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenAddModal && onOpenAddModal()}
                  className="w-7 h-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center transition-colors shadow-md"
                  title="Add income entry"
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* List of Income Transactions */}
            <div className="p-2.5 divide-y divide-[#1e293b] flex-1 flex flex-col justify-start min-h-[160px]">
              {recentIncomeTransactions.length > 0 ? (
                recentIncomeTransactions.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => setEditingItem(t)}
                    className="p-3 hover:bg-emerald-500/10 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <ArrowDownRight size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                            {t.notes || t.category?.name || 'Income'}
                          </p>
                          {t.receiptImage && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 text-[10px] font-bold border border-emerald-400/40 shrink-0">
                              <Camera size={10} />
                              <span>Photo</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 font-medium mt-0.5">
                          {format(new Date(t.date), 'MMM dd')} · {t.category?.name || 'Income'}
                        </p>
                      </div>
                    </div>

                    <span className="font-black text-sm sm:text-base text-emerald-400 font-mono shrink-0 whitespace-nowrap">
                      +{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs my-auto flex flex-col items-center justify-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
                    <ArrowDownRight size={18} />
                  </div>
                  <p className="font-bold text-sm text-white">No income logged for this month</p>
                  <button
                    type="button"
                    onClick={() => onOpenAddModal && onOpenAddModal()}
                    className="mt-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Log Income</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Card: Debit — Costs & Bills */}
          <div className="bg-[#1c0f15] rounded-3xl border border-rose-500/40 overflow-hidden shadow-xl shadow-rose-950/30 flex flex-col transition-all hover:border-rose-400/60">
            {/* Card Header */}
            <div className="p-4 bg-gradient-to-r from-rose-900/70 via-rose-950/50 to-transparent border-b border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/25 text-rose-300 border border-rose-400/30 flex items-center justify-center font-bold shadow-sm shrink-0">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide">Debit · Costs & Bills</h3>
                  <p className="text-xs text-rose-300/90 font-medium">Expenses, purchases & bills</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="font-black text-base sm:text-lg text-rose-300 font-mono">
                  -{currency} {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenAddModal && onOpenAddModal()}
                  className="w-7 h-7 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold flex items-center justify-center transition-colors shadow-md"
                  title="Add expense entry"
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* List of Expense Transactions */}
            <div className="p-2.5 divide-y divide-[#2a1b22] flex-1 flex flex-col justify-start min-h-[160px]">
              {recentExpenseTransactions.length > 0 ? (
                recentExpenseTransactions.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => setEditingItem(t)}
                    className="p-3 hover:bg-rose-500/10 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/20 flex items-center justify-center shrink-0">
                        <ArrowUpRight size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors truncate">
                            {t.notes || t.category?.name || 'Expense'}
                          </p>
                          {t.isRecurring && <RefreshCcw size={12} className="text-primary shrink-0" title="Recurring" />}
                          {t.receiptImage && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 text-[10px] font-bold border border-emerald-400/40 shrink-0">
                              <Camera size={10} />
                              <span>Photo</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 font-medium mt-0.5 flex items-center flex-wrap gap-2">
                          <span>{format(new Date(t.date), 'MMM dd')} · {t.category?.name || 'Expense'}</span>
                          {t.fundSource && (() => {
                            const resolved = resolveFundSource(t.fundSource, transactions, categories);
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#331722] text-rose-200 border border-rose-400/40">
                                {resolved}
                              </span>
                            );
                          })()}
                        </p>
                      </div>
                    </div>

                    <span className="font-black text-sm sm:text-base text-white font-mono shrink-0 whitespace-nowrap">
                      -{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs my-auto flex flex-col items-center justify-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center justify-center">
                    <ArrowUpRight size={18} />
                  </div>
                  <p className="font-bold text-sm text-white">No expenses logged for this month</p>
                  <button
                    type="button"
                    onClick={() => onOpenAddModal && onOpenAddModal()}
                    className="mt-1 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-rose-950/40"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Log Expense</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Essential Bills Section */}
      <div className="pt-2 space-y-4">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold mb-1">Essential bills</h3>
            <p className="text-sm text-secondary-foreground mb-1">
              {currency} {paidBillsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} paid of {currency} {totalBillsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[13px] text-secondary-foreground/70">Cycle: {format(selectedMonth, 'MMMM yyyy')}</p>
          </div>

          <button 
            onClick={onOpenAddBillModal || onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 shrink-0"
          >
            <Plus size={16} />
            <span>Add bill</span>
          </button>
        </div>

        {/* Multi-Select Toolbar for Pending Bills */}
        {pendingBills.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox"
                id="selectAllPendingOverview"
                checked={selectedBillIds.length > 0 && selectedBillIds.length === pendingBills.length}
                onChange={toggleSelectAllPending}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
              />
              <span className="text-xs font-semibold text-foreground">
                {selectedBillIds.length > 0 
                  ? `${selectedBillIds.length} of ${pendingBills.length} pending bills selected` 
                  : `Select all pending bills (${pendingBills.length})`}
              </span>
            </label>

            {selectedBillIds.length > 0 && (
              <button
                type="button"
                onClick={handleBatchPaySelected}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 animate-in fade-in zoom-in-95"
              >
                <CheckCircle2 size={16} />
                <span>Mark Selected as Paid ({selectedBillIds.length}) • {currency} {selectedTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </button>
            )}
          </div>
        )}

        {/* Essential Bills List */}
        {essentialBills.length > 0 ? (
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm divide-y divide-border space-y-2">
            {essentialBills.map(b => {
              const overdue = isOverdue(b);
              const isSelected = selectedBillIds.includes(b._id);
              const bDate = new Date(b.date);
              const dueDay = !isNaN(bDate.getTime()) ? bDate.getDate() : 1;
              return (
                <div 
                  key={b._id} 
                  onClick={() => setActiveBillAction(b)}
                  className={`pt-3 first:pt-0 flex items-center justify-between gap-4 p-3 rounded-xl cursor-pointer hover:bg-secondary/30 transition-all ${
                    isSelected ? 'bg-emerald-500/10 border border-emerald-500/30' : overdue ? 'bg-amber-500/5 border border-amber-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {b.status === 'Pending' ? (
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectBill(b._id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                        title="Select to pay"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={2.5} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                          {b.notes || b.category?.name || 'Bill'}
                        </p>
                        {b.isRecurring && <RefreshCcw size={12} className="text-primary" title="Recurring" />}
                        {overdue && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ⚠️ Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary-foreground flex items-center flex-wrap gap-1.5 mt-0.5">
                        <span>Due day {dueDay} · {b.status === 'Paid' ? 'paid this cycle' : 'unpaid'}</span>
                        {b.fundSource && (() => {
                          const resolved = resolveFundSource(b.fundSource, transactions, categories);
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
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="font-bold text-sm text-foreground">
                      {currency} {Number(b.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {b.status === 'Pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTransaction(b._id, { status: 'Paid' });
                        }}
                        className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black border-transparent shadow-emerald-500/20 transition-all"
                        title="Click to Mark as Paid"
                      >
                        <Clock size={14} />
                        <span>Mark as Paid</span>
                      </button>
                    )}
                    {b.status === 'Paid' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Paid</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center">
            <h4 className="text-base font-bold mb-2">No essential bills this month</h4>
            <p className="text-sm text-secondary-foreground mb-4">Add your fixed monthly obligations like rent, utilities, and internet.</p>
            <button 
              onClick={onOpenAddBillModal || onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              <Plus size={16} />
              <span>Add bill</span>
            </button>
          </div>
        )}
      </div>

      {/* Bill Action Quick Modal for Essential Bills */}
      {activeBillAction && (
        <BillActionModal
          bill={activeBillAction}
          onClose={() => setActiveBillAction(null)}
          onOpenEdit={(bill) => {
            setActiveBillAction(null);
            setEditingItem(bill);
          }}
        />
      )}

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

export default Overview;
