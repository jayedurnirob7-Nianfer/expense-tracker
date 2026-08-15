import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { X, CheckCircle2, Pencil, Trash2, Lock, Loader2, Ban } from 'lucide-react';
import api from '../api';

const BillActionModal = ({ bill, onClose, onOpenEdit }) => {
  const { settings, updateTransaction, deleteTransaction } = useStore();
  const currency = settings?.currency || 'BDT';

  const [promptMode, setPromptMode] = useState(null); // 'edit' | 'delete' | 'unpay' | 'discontinue' | null
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!bill) return null;

  const isPaid = bill.status === 'Paid';
  const billDate = new Date(bill.date);
  const dueDay = !isNaN(billDate.getTime()) ? billDate.getDate() : 1;
  const categoryName = bill.category?.name || 'Rent & Bills';
  const billTitle = bill.notes || bill.category?.name || 'Essential Bill';

  const handleTogglePaid = async () => {
    if (isPaid) {
      // Unpaying a paid bill requires password protection
      setPromptMode('unpay');
      setPasswordInput('');
      setPasswordError('');
      return;
    }
    // Marking as paid directly
    await updateTransaction(bill._id, { status: 'Paid' });
    onClose();
  };

  const handleVerifyPassword = async (e) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError('Please enter master password');
      return;
    }

    setIsVerifying(true);
    setPasswordError('');

    try {
      const res = await api.post('/auth/login', { password: passwordInput });
      if (res.data?.token || res.status === 200) {
        if (promptMode === 'edit') {
          onClose();
          onOpenEdit(bill);
        } else if (promptMode === 'delete') {
          await deleteTransaction(bill._id);
          onClose();
        } else if (promptMode === 'unpay') {
          await updateTransaction(bill._id, { status: 'Pending' });
          onClose();
        } else if (promptMode === 'discontinue') {
          await updateTransaction(bill._id, { isEssential: false, isRecurring: false });
          onClose();
        }
      } else {
        setPasswordError('Invalid password. Action denied.');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Incorrect password. Action denied.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 min-h-[100dvh] w-full h-full bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#0e1621] border border-[#1e293b] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-foreground p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white tracking-tight truncate">
              {billTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {currency} {Number(bill.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} · due day {dueDay} · {categoryName}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-full transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Actions or Password Verification Form */}
        <div className="mt-6">
          {promptMode ? (
            <form onSubmit={handleVerifyPassword} className="bg-[#131d2b] border border-[#1e293b] rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Lock size={15} />
                <span>
                  {promptMode === 'edit'
                    ? 'Password Required to Edit Bill'
                    : promptMode === 'delete'
                    ? 'Password Required to Delete Bill'
                    : promptMode === 'discontinue'
                    ? 'Password Required to Discontinue Bill'
                    : 'Password Required to Mark as Unpaid'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Please enter your master password to{' '}
                {promptMode === 'edit'
                  ? 'edit'
                  : promptMode === 'delete'
                  ? 'permanently remove'
                  : promptMode === 'discontinue'
                  ? 'stop recurring in future months'
                  : 'mark as unpaid'}{' '}
                this bill.
              </p>
              
              <input 
                type="password"
                placeholder="Enter master password..."
                className="w-full bg-[#0e1621] border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-slate-500 outline-none focus:border-amber-400 transition-colors"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                autoFocus
              />

              {passwordError && (
                <p className="text-[11px] text-red-400 font-semibold">{passwordError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 ${
                    promptMode === 'delete'
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                      : promptMode === 'unpay' || promptMode === 'discontinue'
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  }`}
                >
                  {isVerifying && <Loader2 size={13} className="animate-spin" />}
                  <span>
                    {isVerifying
                      ? 'Verifying...'
                      : promptMode === 'edit'
                      ? 'Authorize Edit'
                      : promptMode === 'delete'
                      ? 'Authorize Delete'
                      : promptMode === 'discontinue'
                      ? 'Authorize Discontinue'
                      : 'Authorize Unpay'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromptMode(null);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {/* Mark Unpaid / Mark Paid Button */}
              <button
                type="button"
                onClick={handleTogglePaid}
                className="w-full bg-[#182334] hover:bg-[#1f2e44] text-slate-200 hover:text-white font-semibold py-3 px-4 rounded-2xl text-sm flex items-center justify-center gap-2.5 border border-slate-700/50 transition-all active:scale-[0.99] shadow-sm"
              >
                <CheckCircle2 size={18} className={isPaid ? 'text-slate-400' : 'text-emerald-400'} />
                <span>{isPaid ? 'Mark unpaid' : 'Mark paid'}</span>
              </button>

              {/* Edit Bill Button */}
              <button
                type="button"
                onClick={() => {
                  setPromptMode('edit');
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="w-full bg-[#182334] hover:bg-[#1f2e44] text-slate-200 hover:text-white font-semibold py-3 px-4 rounded-2xl text-sm flex items-center justify-center gap-2.5 border border-slate-700/50 transition-all active:scale-[0.99] shadow-sm"
              >
                <Pencil size={16} className="text-slate-300" />
                <span>Edit bill</span>
              </button>

              {/* Discontinue Recurring Button */}
              <button
                type="button"
                onClick={() => {
                  setPromptMode('discontinue');
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="w-full bg-[#182334] hover:bg-[#1f2e44] text-amber-300 hover:text-amber-200 font-semibold py-3 px-4 rounded-2xl text-sm flex items-center justify-center gap-2.5 border border-amber-500/20 hover:border-amber-500/40 transition-all active:scale-[0.99] shadow-sm"
              >
                <Ban size={16} className="text-amber-400" />
                <span>Discontinue recurring</span>
              </button>

              {/* Remove Bill Button */}
              <button
                type="button"
                onClick={() => {
                  setPromptMode('delete');
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="w-full text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 font-semibold py-2.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={16} className="text-rose-500" />
                <span>Remove bill</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillActionModal;
