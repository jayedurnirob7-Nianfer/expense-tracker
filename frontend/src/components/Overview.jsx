import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, Plus, Trash2, RefreshCcw } from 'lucide-react';
import { format, isSameMonth, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import useStore from '../store/useStore';

const Overview = ({ onOpenAddModal, onOpenAddBillModal }) => {
  const { 
    transactions, 
    categories, 
    settings, 
    selectedMonth, 
    prevMonth, 
    nextMonth, 
    deleteTransaction, 
    updateTransaction 
  } = useStore();

  const currency = settings?.currency || 'BDT';

  // Transactions for the selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isSameMonth(d, selectedMonth);
    });
  }, [transactions, selectedMonth]);

  // Income, Expenses, Balance for selected month
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    monthlyTransactions.forEach(t => {
      if (t.type === 'Income') inc += Number(t.amount);
      else exp += Number(t.amount);
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: inc - exp
    };
  }, [monthlyTransactions]);

  // Overall Total Balance (across all months)
  const overallBalance = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      if (t.type === 'Income') inc += Number(t.amount);
      else exp += Number(t.amount);
    });
    return inc - exp;
  }, [transactions]);

  // Category breakdown for pie chart
  const categoryPieData = useMemo(() => {
    const map = {};
    monthlyTransactions.forEach(t => {
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
  }, [monthlyTransactions, categories]);

  // Last 6 months bar chart data
  const sixMonthHistory = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(selectedMonth, i);
      const label = format(monthDate, 'MMM');

      let inc = 0;
      let exp = 0;
      transactions.forEach(t => {
        const d = new Date(t.date);
        if (isSameMonth(d, monthDate)) {
          if (t.type === 'Income') inc += Number(t.amount);
          else exp += Number(t.amount);
        }
      });

      months.push({
        month: label,
        Income: inc,
        Expense: exp
      });
    }
    return months;
  }, [transactions, selectedMonth]);

  // Essential bills summary for selected month
  const bills = useMemo(() => {
    return monthlyTransactions.filter(t => t.isRecurring || t.type === 'Expense');
  }, [monthlyTransactions]);

  const paidBillsAmount = useMemo(() => {
    return bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + Number(b.amount), 0);
  }, [bills]);

  const totalBillsAmount = useMemo(() => {
    return bills.reduce((sum, b) => sum + Number(b.amount), 0);
  }, [bills]);

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

      {/* Total Balance Card */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-1">
        <div className="flex items-center gap-2 text-secondary-foreground uppercase tracking-wider text-xs font-bold mb-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Total Balance
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className={`text-4xl font-black tracking-tight ${overallBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
            {currency} {overallBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <span className="text-xs text-secondary-foreground">
            Monthly Net: {balance >= 0 ? '+' : ''}{currency} {balance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Credit / Debit Mini Cards */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Where the money goes */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm min-h-[260px] flex flex-col">
          <h3 className="font-bold text-[15px] mb-0.5">Where the money goes</h3>
          <p className="text-xs text-secondary-foreground mb-4">Top expense categories for {format(selectedMonth, 'MMM yyyy')}</p>
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
                  <Tooltip formatter={(val) => `${currency} ${Number(val).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-secondary-foreground">No expenses logged for this month</p>
            )}
          </div>
        </div>

        {/* Last 6 months */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm min-h-[260px] flex flex-col">
          <h3 className="font-bold text-[15px] mb-0.5">Last 6 months</h3>
          <p className="text-xs text-secondary-foreground mb-4">Income vs expenses history</p>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sixMonthHistory}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis hide />
                <Tooltip formatter={(val) => `${currency} ${Number(val).toLocaleString()}`} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transactions section for selected month */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Recent Transactions</h3>
            <p className="text-xs text-secondary-foreground">Showing activity for {format(selectedMonth, 'MMMM yyyy')}</p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus size={14} />
            <span>Add Transaction</span>
          </button>
        </div>

        {monthlyTransactions.length > 0 ? (
          <div className="divide-y divide-border">
            {monthlyTransactions.map((t) => (
              <div key={t._id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === 'Income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {t.type === 'Income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">{t.notes || t.category?.name || 'Transaction'}</p>
                      {t.isRecurring && <RefreshCcw size={12} className="text-primary" title="Recurring" />}
                    </div>
                    <p className="text-xs text-secondary-foreground">
                      {format(new Date(t.date), 'MMM dd, yyyy')} · {t.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`font-bold text-sm ${t.type === 'Income' ? 'text-green-500' : 'text-foreground'}`}>
                    {t.type === 'Income' ? '+' : '-'}{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>

                  <button 
                    onClick={() => updateTransaction(t._id, { status: t.status === 'Paid' ? 'Pending' : 'Paid' })}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${t.status === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                  >
                    {t.status}
                  </button>

                  <button 
                    onClick={() => deleteTransaction(t._id)}
                    className="p-1 text-secondary-foreground hover:text-destructive rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-secondary-foreground text-sm">
            No transactions found for {format(selectedMonth, 'MMMM yyyy')}.
          </div>
        )}
      </div>

      {/* Essential Bills Section */}
      <div className="pt-2 space-y-4">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">Essential bills</h3>
            <p className="text-sm text-secondary-foreground mb-1">
              {currency} {paidBillsAmount.toLocaleString()} paid of {currency} {totalBillsAmount.toLocaleString()}
            </p>
            <p className="text-[13px] text-secondary-foreground/70">Cycle: {format(selectedMonth, 'MMMM yyyy')}</p>
          </div>
          <button 
            onClick={onOpenAddBillModal || onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus size={16} />
            <span>Add bill</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default Overview;
