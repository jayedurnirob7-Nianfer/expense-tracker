import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCcw, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import useStore from '../store/useStore';
import EditTransactionModal from './EditTransactionModal';
import MonthNavigator from './MonthNavigator';

const Bills = ({ onOpenAddBillModal }) => {
  const { 
    transactions, 
    settings, 
    selectedMonth, 
    prevMonth, 
    nextMonth, 
    updateTransaction 
  } = useStore();

  const [editingItem, setEditingItem] = useState(null);
  const [selectedBillIds, setSelectedBillIds] = useState([]);

  const currency = settings?.currency || 'BDT';

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

  // Monthly essential bills - ONLY recurring or essential bills
  const monthlyBills = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isSameMonth(d, selectedMonth) && (t.isRecurring || t.isEssential);
    });
  }, [transactions, selectedMonth]);

  const pendingBills = useMemo(() => {
    return monthlyBills.filter(b => b.status === 'Pending');
  }, [monthlyBills]);

  const overdueBills = useMemo(() => {
    return monthlyBills.filter(b => b.status === 'Pending' && isOverdue(b));
  }, [monthlyBills]);

  const paidTotal = useMemo(() => {
    return monthlyBills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + Number(b.amount), 0);
  }, [monthlyBills]);

  const totalAmount = useMemo(() => {
    return monthlyBills.reduce((sum, b) => sum + Number(b.amount), 0);
  }, [monthlyBills]);

  const selectedTotalAmount = useMemo(() => {
    return monthlyBills
      .filter(b => selectedBillIds.includes(b._id))
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  }, [monthlyBills, selectedBillIds]);

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

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      
      {/* Interactive Month Selector with Full Month/Year Picker */}
      <MonthNavigator />

      {/* Overdue Warning Banner */}
      {overdueBills.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-400 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-200">
                Unpaid Essential Bill Reminder ({overdueBills.length})
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

      {/* Essential Bills Summary Header */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold mb-1">Essential bills</h3>
          <p className="text-sm text-secondary-foreground mb-1">
            {currency} {paidTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} paid of {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[13px] text-secondary-foreground/70">Cycle: {format(selectedMonth, 'MMMM yyyy')}</p>
        </div>

        <button 
          onClick={onOpenAddBillModal}
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
              id="selectAllPendingBillsTab"
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

      {/* Bills List */}
      {monthlyBills.length > 0 ? (
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm divide-y divide-border space-y-2">
          {monthlyBills.map(b => {
            const overdue = isOverdue(b);
            const isSelected = selectedBillIds.includes(b._id);
            return (
              <div 
                key={b._id} 
                onClick={() => setEditingItem(b)}
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
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-foreground hover:text-primary transition-colors">{b.notes || b.category?.name || 'Bill'}</p>
                      {b.isRecurring && <RefreshCcw size={12} className="text-primary" title="Recurring" />}
                      {overdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          ⚠️ Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary-foreground flex items-center flex-wrap gap-1.5 mt-0.5">
                      <span>Due: {format(new Date(b.date), 'MMM dd, yyyy')} · {b.category?.name || 'Bill'}</span>
                      {b.fundSource && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Paid from: {b.fundSource}
                        </span>
                      )}
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
                      title="Click to Mark as Paid and Move to Transactions"
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
        <div className="bg-card rounded-2xl p-10 border border-border shadow-sm flex flex-col items-center justify-center text-center mt-2">
          <h4 className="text-base font-bold mb-1.5">No bills for {format(selectedMonth, 'MMMM yyyy')}</h4>
          <p className="text-sm text-secondary-foreground">Add rent, utilities or subscriptions to track what must be paid.</p>
        </div>
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

export default Bills;
