import React, { useState } from 'react';
import useStore from '../store/useStore';
import { X, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AddTransactionModal = ({ onClose }) => {
  const { categories, addTransaction } = useStore();
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date(),
    category: '',
    type: 'Expense',
    notes: '',
    isRecurring: false,
    status: 'Paid'
  });

  const parentCategories = categories.filter(c => !c.parent && c.type === formData.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) return;
    await addTransaction({
      ...formData,
      amount: Number(formData.amount)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border/50">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Add Transaction</h2>
          <button onClick={onClose} className="p-2 text-secondary-foreground hover:bg-secondary rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Toggle */}
          <div className="flex p-1 bg-secondary/50 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'Expense', category: ''})}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${formData.type === 'Expense' ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-secondary-foreground hover:text-foreground'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'Income', category: ''})}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${formData.type === 'Income' ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-secondary-foreground hover:text-foreground'}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground font-medium">$</span>
              <input 
                type="number" 
                step="0.01" 
                required
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-secondary/20 border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg font-medium"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Category</label>
            {parentCategories.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-sm">
                <AlertCircle size={16} />
                <span>No categories found. Please add one in Settings.</span>
              </div>
            ) : (
              <select 
                required
                className="w-full p-3 rounded-xl bg-secondary/20 border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="" disabled>Select a category</option>
                {parentCategories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Date</label>
            <div className="relative">
              <DatePicker
                selected={formData.date}
                onChange={(date) => setFormData({...formData, date})}
                className="w-full p-3 pl-10 rounded-xl bg-secondary/20 border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
                dateFormat="MMM d, yyyy"
                required
              />
              <CalendarIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Notes (Optional)</label>
            <input 
              type="text" 
              className="w-full p-3 rounded-xl bg-secondary/20 border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="What was this for?"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background bg-secondary transition-colors"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
              />
              <span className="group-hover:text-primary transition-colors">Recurring</span>
            </label>
            
            <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background bg-secondary transition-colors"
                checked={formData.status === 'Paid'}
                onChange={(e) => setFormData({...formData, status: e.target.checked ? 'Paid' : 'Pending'})}
              />
              <span className="group-hover:text-primary transition-colors">Mark as Paid</span>
            </label>
          </div>

          <div className="pt-6 mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-secondary-foreground hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={!formData.category || !formData.amount} className="px-5 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
