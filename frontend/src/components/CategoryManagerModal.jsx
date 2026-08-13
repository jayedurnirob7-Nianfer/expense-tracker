import React, { useState } from 'react';
import useStore from '../store/useStore';
import { X, Trash2, Plus, Settings } from 'lucide-react';

const CategoryManagerModal = ({ onClose }) => {
  const { categories, addCategory, deleteCategory, settings, updateSettings } = useStore();
  const [newCat, setNewCat] = useState({ name: '', type: 'Expense', color: '#8884d8', budget: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    await addCategory({
      ...newCat,
      budget: Number(newCat.budget) || 0
    });
    setNewCat({ name: '', type: 'Expense', color: '#8884d8', budget: '' });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Settings size={20} /> Settings & Categories</h2>
          <button onClick={onClose} className="p-1 text-secondary-foreground hover:bg-secondary rounded-lg transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-8 flex-1">
          {/* General Settings */}
          <section>
            <h3 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wider mb-3">General Settings</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-1">Currency Symbol</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary outline-none"
                  value={settings.currency}
                  onChange={(e) => updateSettings({ currency: e.target.value })}
                  placeholder="e.g. BDT, $, €"
                />
              </div>
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wider mb-3">Manage Categories</h3>
            
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6 bg-secondary/30 p-4 rounded-xl border border-border/50">
              <input 
                type="text" 
                required
                placeholder="Category Name" 
                className="flex-1 p-2 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
                value={newCat.name}
                onChange={(e) => setNewCat({...newCat, name: e.target.value})}
              />
              <select 
                className="p-2 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
                value={newCat.type}
                onChange={(e) => setNewCat({...newCat, type: e.target.value})}
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
              <input 
                type="number" 
                placeholder="Budget (Opt)" 
                className="w-full sm:w-28 p-2 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
                value={newCat.budget}
                onChange={(e) => setNewCat({...newCat, budget: e.target.value})}
              />
              <input 
                type="color" 
                className="h-10 w-10 p-0 rounded cursor-pointer border border-border bg-background"
                value={newCat.color}
                onChange={(e) => setNewCat({...newCat, color: e.target.value})}
              />
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-lg flex items-center justify-center transition">
                <Plus size={20} />
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(c => (
                <div key={c._id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-card hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{c.name}</p>
                      <p className="text-xs text-secondary-foreground">
                        {c.type} {c.budget > 0 && `• Budget: ${settings.currency}${c.budget}`}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteCategory(c._id)}
                    className="p-1.5 text-secondary-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full text-center p-4 text-secondary-foreground text-sm border border-dashed border-border rounded-xl">
                  No categories added. Create one above.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
