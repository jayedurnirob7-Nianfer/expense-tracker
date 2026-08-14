import React, { useState } from 'react';
import useStore from '../store/useStore';
import { X, Calendar as CalendarIcon, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

const AddTransactionModal = ({ onClose }) => {
  const { categories, transactions, addCategory, addTransaction } = useStore();
  const [type, setType] = useState('Expense'); // 'Expense' (Debit) or 'Income' (Credit)
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');

  // Fund / Paid From state - automatically includes all credited income transactions and categories
  const creditCategories = categories.filter(c => c.type?.toLowerCase() === 'income').map(c => c.name);
  const creditTransactionFunds = transactions
    .filter(t => t.type === 'Income')
    .map(t => t.notes?.trim() || t.category?.name)
    .filter(Boolean);

  const baseFunds = ['Salary', ...creditTransactionFunds, ...creditCategories];
  const [customFunds, setCustomFunds] = useState([]);
  const availableFunds = Array.from(new Set([...baseFunds, ...customFunds])).filter(Boolean);
  const [fundSource, setFundSource] = useState(availableFunds[0] || 'Salary');
  const [showAddFund, setShowAddFund] = useState(false);
  const [newFundName, setNewFundName] = useState('');

  // Inline category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

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
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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

          {/* Amount */}
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

          {/* Category Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Category</label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {showAddCategory ? 'Cancel' : '+ New category'}
              </button>
            </div>

            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 pr-10 text-white appearance-none outline-none focus:border-emerald-500 text-sm font-medium transition-colors cursor-pointer"
              >
                {currentCategories.map(cat => (
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

          {/* Fund / Paid From Selector (Only for Debits) */}
          {type === 'Expense' && (
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
          )}

          {/* Date & Note Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Date</label>
              <div className="relative">
                <DatePicker
                  selected={date}
                  onChange={(d) => setDate(d)}
                  popperPlacement="bottom-start"
                  customInput={
                    <button
                      type="button"
                      className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-3 py-3 pl-9 text-white text-xs font-medium flex items-center text-left hover:border-slate-600 transition-colors"
                    >
                      {format(date || new Date(), 'MMM d, yyyy')}
                    </button>
                  }
                />
                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Note</label>
              <input 
                type="text" 
                placeholder="Optional"
                className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-xs font-medium"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#23c55e] hover:bg-[#1ea850] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] text-center text-sm"
            >
              Save transaction
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddTransactionModal;
