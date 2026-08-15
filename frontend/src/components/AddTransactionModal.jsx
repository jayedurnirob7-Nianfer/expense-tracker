import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { X, Calendar as CalendarIcon, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

import { getAvailableFundOptions } from '../utils/funds';

const AddTransactionModal = ({ onClose, initialType = 'Expense' }) => {
  const { categories, transactions, addCategory, addTransaction } = useStore();
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isEssential, setIsEssential] = useState(false);

  // Fund / Paid From state - automatically includes active income funds and Miscellaneous
  const [customFunds, setCustomFunds] = useState([]);
  const availableFunds = getAvailableFundOptions(transactions, categories, customFunds);
  const [fundSource, setFundSource] = useState(availableFunds[0] || 'Salary');
  const [showAddFund, setShowAddFund] = useState(false);
  const [newFundName, setNewFundName] = useState('');

  // Inline category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentCategories = categories.filter(c => c.type?.toLowerCase() === type.toLowerCase());
  
  const currentCategory = selectedCategory 
    ? currentCategories.find(c => c._id === selectedCategory) 
    : currentCategories[0];

  const handleAddNewCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await addCategory({ name: newCatName.trim(), type, color: type === 'Income' ? '#10b981' : '#ef4444' });
    if (res.success) {
      setNewCatName('');
      setShowAddCategory(false);
    }
  };

  const handleAddNewFund = () => {
    if (!newFundName.trim()) return;
    const trimmed = newFundName.trim();
    if (!customFunds.includes(trimmed)) {
      setCustomFunds(prev => [...prev, trimmed]);
    }
    setFundSource(trimmed);
    setNewFundName('');
    setShowAddFund(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    const catId = currentCategory ? currentCategory._id : (currentCategories[0]?._id || '');

    await addTransaction({
      amount: Number(amount),
      date: date || new Date(),
      category: catId,
      type,
      notes: notes.trim(),
      fundSource: type === 'Expense' ? (fundSource || 'Salary') : undefined,
      isRecurring: false,
      isEssential: false,
      status: 'Paid'
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 min-h-[100dvh] w-full h-full bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#0e1621] border border-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">New transaction</h2>
            <p className="text-sm text-slate-400 mt-1">Log money in (credit) or out (debit).</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {/* Segmented Control Switcher */}
          <div className="bg-[#131d2b] p-1.5 rounded-2xl flex gap-1">
            <button
              type="button"
              onClick={() => {
                setType('Expense');
                setSelectedCategory('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all ${
                type === 'Expense' 
                  ? 'bg-[#ef4444] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight size={16} />
              <span>Debit</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setType('Income');
                setSelectedCategory('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all ${
                type === 'Income' 
                  ? 'bg-[#10b981] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight size={16} />
              <span>Credit</span>
            </button>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Description / Title</label>
            <input 
              type="text" 
              required
              placeholder="Rent, Grocery, Salary..."
              className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-medium"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Amount</label>
              <input 
                type="number" 
                step="0.01"
                required
                placeholder="0.00"
                className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-medium"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Date</label>
              <div className="relative">
                <DatePicker 
                  selected={date} 
                  onChange={(d) => setDate(d)}
                  dateFormat="MMM dd, yyyy"
                  className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm font-medium"
                />
                <CalendarIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Category</label>
              <button 
                type="button" 
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                {showAddCategory ? 'Cancel' : '+ New category'}
              </button>
            </div>

            {showAddCategory ? (
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="Category Name" 
                  className="flex-1 bg-[#131d2b] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={handleAddNewCategory}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Add
                </button>
              </div>
            ) : null}

            <div className="relative">
              <select 
                value={selectedCategory || (currentCategory?._id || '')}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors text-sm font-medium"
              >
                {currentCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Fund Source / Paid From (Only for Debit / Expense) */}
          {type === 'Expense' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Fund Source / Paid From
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowAddFund(!showAddFund)}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  {showAddFund ? 'Cancel' : '+ New fund'}
                </button>
              </div>

              {showAddFund ? (
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="e.g. Freelance, Savings, Crypto..." 
                    className="flex-1 bg-[#131d2b] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    value={newFundName}
                    onChange={(e) => setNewFundName(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddNewFund}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              ) : null}

              <div className="relative">
                <select 
                  value={fundSource}
                  onChange={(e) => setFundSource(e.target.value)}
                  className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors text-sm font-medium"
                >
                  {availableFunds.map(fund => (
                    <option key={fund} value={fund}>{fund} Fund</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#131d2b] hover:bg-[#1a2638] text-slate-300 rounded-xl font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-extrabold text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              Save Transaction
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
