import React from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';
import { format } from 'date-fns';

const Overview = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Month Selector */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between">
        <button className="p-1 hover:bg-secondary rounded-lg text-secondary-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-[15px]">{format(new Date(), 'MMMM yyyy')}</span>
        <button className="p-1 hover:bg-secondary rounded-lg text-secondary-foreground hover:text-foreground transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Total Balance */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-1">
        <div className="flex items-center gap-2 text-secondary-foreground uppercase tracking-wider text-xs font-bold mb-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Total Balance
        </div>
        <h2 className="text-4xl font-black tracking-tight text-foreground">$0.00</h2>
      </div>

      {/* Credit / Debit Mini Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-primary uppercase tracking-wider text-xs font-bold mb-1.5">
            <TrendingUp size={14} strokeWidth={3} />
            Credit
          </div>
          <p className="text-xl font-bold text-foreground">$0.00</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 text-warning text-orange-400 uppercase tracking-wider text-xs font-bold mb-1.5">
            <TrendingDown size={14} strokeWidth={3} />
            Debit
          </div>
          <p className="text-xl font-bold text-foreground">$0.00</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm min-h-[220px] flex flex-col">
          <h3 className="font-bold text-[15px] mb-0.5">Where the money goes</h3>
          <p className="text-xs text-secondary-foreground mb-4">Top expense categories this month</p>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-secondary-foreground">No expenses logged yet</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm min-h-[220px] flex flex-col">
          <h3 className="font-bold text-[15px] mb-0.5">Last 6 months</h3>
          <p className="text-xs text-secondary-foreground mb-4">Income vs expenses, ending this month</p>
          <div className="flex-1 flex items-end justify-between px-2 pt-10">
            {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(m => (
              <span key={m} className="text-xs text-secondary-foreground font-medium">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Debit / Credit Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowDownRight size={18} className="text-primary" />
              <h3 className="font-bold text-[15px]">Credit — money in</h3>
            </div>
            <span className="font-bold text-[15px] text-primary">$0.00</span>
          </div>
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center min-h-[140px]">
            <h4 className="text-[15px] font-bold mb-2">No income this month</h4>
            <p className="text-sm text-secondary-foreground">Add a transaction to see your numbers come alive.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowUpRight size={18} className="text-destructive" />
              <h3 className="font-bold text-[15px]">Debit — costs & bills</h3>
            </div>
            <span className="font-bold text-[15px] text-foreground">$0.00</span>
          </div>
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center min-h-[140px]">
            <h4 className="text-[15px] font-bold mb-2">No expenses this month</h4>
            <p className="text-sm text-secondary-foreground">Add a transaction to see your numbers come alive.</p>
          </div>
        </div>
      </div>

      {/* Essential Bills Section */}
      <div className="pt-2 space-y-4">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">Essential bills</h3>
            <p className="text-sm text-secondary-foreground mb-1">$0.00 paid of $0.00</p>
            <p className="text-[13px] text-secondary-foreground/70">Cycle: {format(new Date(), 'MMMM yyyy')} · resets on the 10th</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
            <Plus size={16} />
            <span>Add bill</span>
          </button>
        </div>
        <div className="bg-card rounded-2xl p-10 border border-border shadow-sm flex flex-col items-center justify-center text-center mt-2">
          <h4 className="text-base font-bold mb-1.5">No bills yet</h4>
          <p className="text-sm text-secondary-foreground">Add rent, utilities or subscriptions to track what must be paid.</p>
        </div>
      </div>

    </div>
  );
};

export default Overview;
