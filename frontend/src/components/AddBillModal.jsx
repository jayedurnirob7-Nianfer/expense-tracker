import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { X, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

import { getAvailableFundOptions } from '../utils/funds';

const AddBillModal = ({ onClose }) => {
  const { categories, transactions, addCategory, addTransaction } = useStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isEssential, setIsEssential] = useState(true);

  // Fund / Paid From state - automatically includes active income funds and Miscellaneous
  const [customFunds, setCustomFunds] = useState([]);
  const availableFunds = getAvailableFundOptions(transactions, categories, customFunds);
  const [fundSource, setFundSource] = useState(availableFunds[0] || 'Salary');
  const [showAddFund, setShowAddFund] = useState(false);
  const [newFundName, setNewFundName] = useState('');

  // Dropdown state & inline add category state
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

  const expenseCategories = categories.filter(c => c.type?.toLowerCase() === 'expense');

  // Default selection if not set
  const currentCategory = selectedCategory 
    ? expenseCategories.find(c => c._id === selectedCategory) 
    : expenseCategories[0];

  const handleAddNewCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await addCategory({ name: newCatName.trim(), type: 'Expense', color: '#3b82f6' });
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
    if (!name || !amount) return;

    const catId = currentCategory ? currentCategory._id : (expenseCategories[0]?._id || '');

    await addTransaction({
      amount: Number(amount),
      date: dueDate || new Date(),
      category: catId,
      type: 'Expense',
      notes: name,
      fundSource: fundSource || 'Salary',
      isRecurring: true,
      status: 'Pending',
      isEssential
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
            <h2 className="text-xl font-bold text-white tracking-tight">New bill</h2>
            <p className="text-sm text-slate-400 mt-1">Recurring monthly payment you need to cover.</p>
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
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Name</label>
            <input 
              type="text" 
              required
              placeholder="Rent, Internet..."
              className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Amount & Due date */}
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Due date</label>
              <div className="relative">
                <DatePicker
                  selected={dueDate}
                  onChange={(d) => setDueDate(d)}
                  popperPlacement="bottom-start"
                  customInput={
                    <button
                      type="button"
                      className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-3 py-3 pl-9 text-white text-xs font-medium flex items-center text-left hover:border-slate-600 transition-colors"
                    >
                      {format(dueDate || new Date(), 'MMM d, yyyy')}
                    </button>
                  }
                />
                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Category</label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {showAddCategory ? 'Cancel' : '+ New Category'}
              </button>
            </div>

            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 pr-10 text-white appearance-none outline-none focus:border-emerald-500 text-sm font-medium transition-colors cursor-pointer"
              >
                {expenseCategories.map(cat => (
                  <option key={cat._id} value={cat._id} className="bg-[#0e1621] text-white py-2">
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Inline New Category Input */}
            {showAddCategory && (
              <div className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  placeholder="New category name"
                  className="flex-1 bg-[#131d2b] border border-emerald-500/60 rounded-xl px-4 py-2 text-white placeholder-slate-500 text-sm outline-none"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())}
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-slate-700 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Fund / Paid From Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Paid From (Fund)</label>
              <button
                type="button"
                onClick={() => setShowAddFund(!showAddFund)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {showAddFund ? 'Cancel' : '+ New Fund'}
              </button>
            </div>

            <div className="relative">
              <select
                value={fundSource}
                onChange={(e) => setFundSource(e.target.value)}
                className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 pr-10 text-white appearance-none outline-none focus:border-emerald-500 text-sm font-medium transition-colors cursor-pointer"
              >
                {availableFunds.map((fund, idx) => (
                  <option key={idx} value={fund} className="bg-[#0e1621] text-white py-2">
                    {fund}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Inline New Fund Input */}
            {showAddFund && (
              <div className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  placeholder="New fund name (e.g. Freelance, Savings)"
                  className="flex-1 bg-[#131d2b] border border-emerald-500/60 rounded-xl px-4 py-2 text-white placeholder-slate-500 text-sm outline-none"
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewFund())}
                />
                <button
                  type="button"
                  onClick={handleAddNewFund}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-slate-700 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Essential Toggle Box */}
          <div className="bg-[#131d2b] border border-[#1e293b] rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-xs">Essential</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Must be paid every month</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEssential(!isEssential)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                isEssential ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isEssential ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#23c55e] hover:bg-[#1ea850] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] text-center text-sm"
            >
              Save bill
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddBillModal;
