import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { Trash2, Plus, FileDown, DownloadCloud, UploadCloud, Check, Sun, Moon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, isSameMonth } from 'date-fns';

const SettingsView = () => {
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    settings, 
    updateSettings,
    toggleTheme,
    transactions,
    selectedMonth,
    exportBackup,
    restoreBackup,
    userProfile,
    fetchProfile,
    updateProfile
  } = useStore();
  
  const currency = settings?.currency || 'BDT';
  const isDark = settings?.theme === 'dark';
  const [newIncome, setNewIncome] = useState('');
  const [newExpense, setNewExpense] = useState('');
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editCategoryNames, setEditCategoryNames] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile().then(p => {
      if (p?.email) setRecoveryEmail(p.email);
    });
  }, [fetchProfile]);

  useEffect(() => {
    setLocalCurrency(settings?.currency || 'BDT');
  }, [settings]);

  const incomeCategories = categories.filter(c => c.type?.toLowerCase() === 'income');
  const expenseCategories = categories.filter(c => c.type?.toLowerCase() === 'expense');

  const handleAddCategory = async (type, name, setter) => {
    if (!name.trim()) return;
    const formattedType = type === 'income' ? 'Income' : 'Expense';
    await addCategory({ name: name.trim(), type: formattedType, color: type === 'income' ? '#10b981' : '#ef4444' });
    setter('');
  };

  const handleCategoryNameBlur = (catId, currentName) => {
    const newName = editCategoryNames[catId];
    if (newName !== undefined && newName.trim() !== '' && newName.trim() !== currentName) {
      updateCategory(catId, { name: newName.trim() });
    }
  };

  const handleCurrencyBlur = () => {
    if (localCurrency && localCurrency !== settings?.currency) {
      updateSettings({ currency: localCurrency });
    }
  };

  const downloadPDFStatement = () => {
    try {
      const doc = new jsPDF();
      const monthStr = format(selectedMonth, 'MMMM yyyy');
      
      doc.setFontSize(18);
      doc.text(`Expense Statement - ${monthStr}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 26);
      doc.text(`Currency Symbol: ${currency}`, 14, 31);

      const monthlyTxs = transactions.filter(t => isSameMonth(new Date(t.date), selectedMonth));
      const tableRows = monthlyTxs.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.type,
        t.category?.name || 'Uncategorized',
        t.notes || '-',
        `${currency} ${Number(t.amount).toFixed(2)}`,
        t.status
      ]);

      autoTable(doc, {
        startY: 36,
        head: [['Date', 'Type', 'Category', 'Notes', 'Amount', 'Status']],
        body: tableRows,
      });

      doc.save(`Statement_${format(selectedMonth, 'yyyy_MM')}.pdf`);
      setStatusMessage('PDF statement downloaded successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('PDF error:', err);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const res = await restoreBackup(json);
        if (res.success) {
          setStatusMessage('Backup restored successfully!');
        } else {
          setStatusMessage(`Restore failed: ${res.message}`);
        }
      } catch (err) {
        setStatusMessage('Invalid JSON backup file.');
      }
      setTimeout(() => setStatusMessage(''), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {statusMessage && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Check size={16} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Preferences */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6">
        <h3 className="text-lg font-semibold">Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-secondary-foreground mb-1.5">Currency symbol / code</label>
            <input 
              type="text" 
              value={localCurrency}
              onChange={(e) => setLocalCurrency(e.target.value.toUpperCase())}
              onBlur={handleCurrencyBlur}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary transition-colors font-medium"
              maxLength={5}
              placeholder="BDT"
            />
          </div>

          <div>
            <label className="block text-sm text-secondary-foreground mb-1.5">Theme Mode</label>
            <div className="flex bg-secondary/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => isDark && toggleTheme()}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                  !isDark ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-secondary-foreground hover:text-foreground'
                }`}
              >
                <Sun size={14} className="text-amber-500" />
                <span>Light</span>
              </button>
              
              <button
                type="button"
                onClick={() => !isDark && toggleTheme()}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                  isDark ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-secondary-foreground hover:text-foreground'
                }`}
              >
                <Moon size={14} className="text-primary" />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-1">Categories</h3>
        <p className="text-sm text-secondary-foreground mb-6">Rename inline, add or delete your custom categories.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Income Categories */}
          <div>
            <h4 className="text-xs font-bold tracking-wider text-secondary-foreground mb-3 uppercase">Income Categories</h4>
            <div className="space-y-2">
              {incomeCategories.map(cat => (
                <div key={cat._id} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={editCategoryNames[cat._id] !== undefined ? editCategoryNames[cat._id] : cat.name}
                    onChange={(e) => setEditCategoryNames({ ...editCategoryNames, [cat._id]: e.target.value })}
                    onBlur={() => handleCategoryNameBlur(cat._id, cat.name)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCategoryNameBlur(cat._id, cat.name)}
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
                    value={editCategoryNames[cat._id] !== undefined ? editCategoryNames[cat._id] : cat.name}
                    onChange={(e) => setEditCategoryNames({ ...editCategoryNames, [cat._id]: e.target.value })}
                    onBlur={() => handleCategoryNameBlur(cat._id, cat.name)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCategoryNameBlur(cat._id, cat.name)}
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

      {/* J.A.R.V.I.S. Security & Recovery Account Binding */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span>J.A.R.V.I.S. Security & Google Account</span>
          </h3>
          <p className="text-sm text-secondary-foreground mt-0.5">
            Bind your Google email address to enable 1-Click Google Sign-In and J.A.R.V.I.S. Emergency Password Recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-secondary-foreground mb-1.5 uppercase tracking-wider">
              Master Nirob's Recovery Email
            </label>
            <div className="flex gap-2">
              <input 
                type="email"
                placeholder="master.nirob@gmail.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!recoveryEmail.trim()) return;
                  setIsUpdatingProfile(true);
                  const res = await updateProfile({ email: recoveryEmail.trim() });
                  setIsUpdatingProfile(false);
                  if (res.success) {
                    setStatusMessage('Recovery email bound successfully to J.A.R.V.I.S.!');
                    setTimeout(() => setStatusMessage(''), 3000);
                  }
                }}
                disabled={isUpdatingProfile}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 shrink-0"
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Email'}
              </button>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-2xl p-4 border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Google Account Integration</p>
              <p className="text-[11px] text-secondary-foreground mt-0.5">
                {userProfile?.hasGoogleLinked ? 'Connected and bound for instant login' : 'Ready to authenticate via Google button on login'}
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${userProfile?.hasGoogleLinked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/50 text-slate-400'}`}>
              {userProfile?.hasGoogleLinked ? 'Linked' : 'Available'}
            </span>
          </div>
        </div>
      </section>

      {/* Backup & Export */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-1">Backup & Statements</h3>
        <p className="text-sm text-secondary-foreground mb-6">Download a PDF statement for the selected month, export a JSON backup, or restore from a file.</p>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={downloadPDFStatement}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <FileDown size={16} />
            <span>Download PDF Statement</span>
          </button>
          
          <button 
            onClick={exportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-secondary-foreground border border-border font-medium text-sm hover:bg-secondary hover:text-foreground transition-colors"
          >
            <DownloadCloud size={16} />
            <span>Export Backup (JSON)</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-secondary-foreground border border-border font-medium text-sm hover:bg-secondary hover:text-foreground transition-colors"
          >
            <UploadCloud size={16} />
            <span>Restore Backup</span>
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </section>
      
    </div>
  );
};

export default SettingsView;
