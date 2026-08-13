import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, RefreshCcw, CheckCircle2, Clock } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import useStore from '../store/useStore';

const Bills = ({ onOpenAddBillModal }) => {
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

  const monthlyBills = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isSameMonth(d, selectedMonth) && (t.isRecurring || t.type === 'Expense');
    });
  }, [transactions, selectedMonth]);

  const paidTotal = useMemo(() => {
    return monthlyBills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + Number(b.amount), 0);
  }, [monthlyBills]);

  const totalAmount = useMemo(() => {
    return monthlyBills.reduce((sum, b) => sum + Number(b.amount), 0);
  }, [monthlyBills]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      
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

      {/* Essential Bills Summary */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">Essential bills</h3>
          <p className="text-sm text-secondary-foreground mb-1">
            {currency} {paidTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} paid of {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[13px] text-secondary-foreground/70">Cycle: {format(selectedMonth, 'MMMM yyyy')}</p>
        </div>
        <button 
          onClick={onOpenAddBillModal}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <Plus size={16} />
          <span>Add bill</span>
        </button>
      </div>

      {/* Bills List */}
      {monthlyBills.length > 0 ? (
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm divide-y divide-border space-y-2">
          {monthlyBills.map(b => (
            <div key={b._id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateTransaction(b._id, { status: b.status === 'Paid' ? 'Pending' : 'Paid' })}
                  className={`p-2 rounded-xl border transition-colors ${b.status === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                  title={b.status === 'Paid' ? 'Mark as Pending' : 'Mark as Paid'}
                >
                  {b.status === 'Paid' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground">{b.notes || b.category?.name || 'Bill'}</p>
                    {b.isRecurring && <RefreshCcw size={12} className="text-primary" title="Recurring" />}
                  </div>
                  <p className="text-xs text-secondary-foreground">
                    Due/Paid: {format(new Date(b.date), 'MMM dd, yyyy')} · {b.category?.name || 'Bill'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-sm text-foreground">
                  {currency} {Number(b.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${b.status === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                  {b.status}
                </span>
                <button
                  onClick={() => deleteTransaction(b._id)}
                  className="p-1.5 text-secondary-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-10 border border-border shadow-sm flex flex-col items-center justify-center text-center mt-2">
          <h4 className="text-base font-bold mb-1.5">No bills for {format(selectedMonth, 'MMMM yyyy')}</h4>
          <p className="text-sm text-secondary-foreground">Add rent, utilities or subscriptions to track what must be paid.</p>
        </div>
      )}

    </div>
  );
};

export default Bills;
