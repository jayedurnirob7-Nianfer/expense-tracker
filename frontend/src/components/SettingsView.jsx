import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Cloud, Trash2, Plus, FileDown, UploadCloud, DownloadCloud } from 'lucide-react';

const SettingsView = () => {
  const { categories, addCategory, deleteCategory, currency, updateSettings } = useStore();
  
  const [newIncome, setNewIncome] = useState('');
  const [newExpense, setNewExpense] = useState('');
  const [localCurrency, setLocalCurrency] = useState(currency);

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleAddCategory = async (type, name, setter) => {
    if (!name.trim()) return;
    await addCategory({ name: name.trim(), type, color: '#34d399' });
    setter('');
  };

  const handleCurrencyBlur = () => {
    if (localCurrency !== currency) {
      updateSettings({ currency: localCurrency });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Cloud Sync */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-1">Cloud sync</h3>
        <p className="text-sm text-secondary-foreground mb-4">Sign in with Google to back your data up to the cloud and use it on every device.</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium hover:bg-primary/30 transition-colors">
          <Cloud size={16} />
          <span>Continue with Google</span>
        </button>
      </section>

      {/* Preferences */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Preferences</h3>
        <div>
          <label className="block text-sm text-secondary-foreground mb-1.5">Currency code</label>
          <input 
            type="text" 
            value={localCurrency}
            onChange={(e) => setLocalCurrency(e.target.value.toUpperCase())}
            onBlur={handleCurrencyBlur}
            className="w-full max-w-xs bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary transition-colors"
            maxLength={3}
          />
        </div>
      </section>

      {/* Categories */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-1">Categories</h3>
        <p className="text-sm text-secondary-foreground mb-6">Rename inline, add or delete your own.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Income Categories */}
          <div>
            <h4 className="text-xs font-bold tracking-wider text-secondary-foreground mb-3 uppercase">Income Categories</h4>
            <div className="space-y-2">
              {incomeCategories.map(cat => (
                <div key={cat._id} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    defaultValue={cat.name}
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button onClick={() => deleteCategory(cat._id)} className="p-2.5 text-secondary-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="text" 
                  value={newIncome}
                  onChange={(e) => setNewIncome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('income', newIncome, setNewIncome)}
                  placeholder="New income category"
                  className="flex-1 bg-background border border-border border-dashed rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:border-solid transition-colors placeholder:text-secondary-foreground/50"
                />
                <button onClick={() => handleAddCategory('income', newIncome, setNewIncome)} className="p-2.5 text-secondary-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <h4 className="text-xs font-bold tracking-wider text-secondary-foreground mb-3 uppercase">Expense Categories</h4>
            <div className="space-y-2">
              {expenseCategories.map(cat => (
                <div key={cat._id} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    defaultValue={cat.name}
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button onClick={() => deleteCategory(cat._id)} className="p-2.5 text-secondary-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="text" 
                  value={newExpense}
                  onChange={(e) => setNewExpense(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('expense', newExpense, setNewExpense)}
                  placeholder="New expense category"
                  className="flex-1 bg-background border border-border border-dashed rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:border-solid transition-colors placeholder:text-secondary-foreground/50"
                />
                <button onClick={() => handleAddCategory('expense', newExpense, setNewExpense)} className="p-2.5 text-secondary-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Backup */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-1">Backup</h3>
        <p className="text-sm text-secondary-foreground mb-6">Download a PDF statement for the selected month, export a JSON copy of everything, or restore from a previous file.</p>
        
        <div className="flex flex-wrap items-center gap-4">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
            <FileDown size={16} />
            <span>Download PDF</span>
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-secondary-foreground font-medium text-sm hover:bg-secondary hover:text-foreground transition-colors">
            <DownloadCloud size={16} />
            <span>Export backup</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-secondary-foreground font-medium text-sm hover:bg-secondary hover:text-foreground transition-colors">
            <UploadCloud size={16} />
            <span>Restore backup</span>
          </button>
        </div>
      </section>
      
    </div>
  );
};

export default SettingsView;
