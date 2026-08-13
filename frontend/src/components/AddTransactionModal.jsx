import React, { useState } from 'react';
import useStore from '../store/useStore';
import { X, Calendar as CalendarIcon, ChevronDown, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

const AddTransactionModal = ({ onClose }) => {
  const { categories, addCategory, addTransaction } = useStore();
  const [type, setType] = useState('Expense'); // 'Expense' (Debit) or 'Income' (Credit)
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');

  // Dropdown state & inline category state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
      isRecurring: false,
      status: 'Paid'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1621] border border-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-foreground">
        
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

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
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
            <label className="block text-sm font-semibold text-white mb-2">Amount</label>
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
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-white">Category</label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {showAddCategory ? 'Cancel' : '+ New category'}
              </button>
            </div>

            {/* Custom Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white flex justify-between items-center text-sm font-medium hover:border-slate-600 transition-colors"
              >
                <span>{currentCategory?.name || 'Food & Dining'}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {/* Dropdown Menu Popover */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-full bg-[#131d2b] border border-[#1e293b] rounded-xl shadow-2xl z-20 overflow-hidden py-1 max-h-56 overflow-y-auto">
                  {currentCategories.map(cat => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat._id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                        (currentCategory?._id === cat._id) 
                          ? 'bg-[#1e293b] text-white font-medium' 
                          : 'text-slate-300 hover:bg-[#1a2436] hover:text-white'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {(currentCategory?._id === cat._id) && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                  {currentCategories.length === 0 && (
                    <div className="px-4 py-3 text-xs text-slate-400">No categories found. Create one.</div>
                  )}
                </div>
              )}
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

          {/* Date & Note Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Date</label>
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
                      {format(date || new Date(), 'MMMM d, yyyy')}
                    </button>
                  }
                />
                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Note</label>
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
              className="w-full bg-[#23c55e] hover:bg-[#1ea850] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] text-center"
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
