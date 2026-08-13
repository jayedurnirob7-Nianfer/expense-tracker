import React, { useState } from 'react';
import useStore from '../store/useStore';
import { X, ChevronDown, Check } from 'lucide-react';

const AddBillModal = ({ onClose }) => {
  const { categories, addCategory, addTransaction } = useStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isEssential, setIsEssential] = useState(true);

  // Dropdown state & inline add category state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !amount) return;

    // Create a transaction date set to the due day of current month
    const now = new Date();
    const dayNum = Math.min(Math.max(parseInt(dueDay, 10) || 1, 1), 31);
    const billDate = new Date(now.getFullYear(), now.getMonth(), dayNum);

    const catId = currentCategory ? currentCategory._id : (expenseCategories[0]?._id || '');

    await addTransaction({
      amount: Number(amount),
      date: billDate,
      category: catId,
      type: 'Expense',
      notes: name,
      isRecurring: true,
      status: 'Pending',
      isEssential
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1621] border border-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-foreground">
        
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

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Name</label>
            <input 
              type="text" 
              required
              placeholder="Rent, Internet..."
              className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Amount & Due day */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Due day of month (1–31)</label>
              <input 
                type="number" 
                min="1" 
                max="31"
                required
                placeholder="1"
                className="w-full bg-[#131d2b] border border-[#1e293b] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-medium"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-white">Category</label>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {showAddCategory ? 'Cancel' : 'Edit  + New'}
                </button>
              </div>
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

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-full bg-[#131d2b] border border-[#1e293b] rounded-xl shadow-2xl z-20 overflow-hidden py-1 max-h-56 overflow-y-auto">
                  {expenseCategories.map(cat => (
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

          {/* Essential Toggle Box */}
          <div className="bg-[#131d2b] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-sm">Essential</p>
              <p className="text-xs text-slate-400 mt-0.5">Must be paid every month</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEssential(!isEssential)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                isEssential ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isEssential ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#23c55e] hover:bg-[#1ea850] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] text-center"
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
