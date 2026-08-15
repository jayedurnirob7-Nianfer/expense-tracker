import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { 
  Trash2, 
  Plus, 
  FileDown, 
  DownloadCloud, 
  UploadCloud, 
  Check, 
  Sun, 
  Moon, 
  ArrowLeft,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
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
    updateProfile,
    changePassword,
    setActiveView
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
  const [statusError, setStatusError] = useState('');
  const fileInputRef = useRef(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

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
    if (localCurrency.trim() && localCurrency.trim() !== settings?.currency) {
      updateSettings({ currency: localCurrency.trim() });
      setStatusMessage('Currency updated successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErr('');
    setPasswordMsg('');

    if (!newPassword || newPassword.length < 4) {
      setPasswordErr('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErr('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);

    if (res.success) {
      setPasswordMsg('Master password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 4000);
    } else {
      setPasswordErr(res.message || 'Failed to update password');
    }
  };

  const downloadPDFStatement = () => {
    const doc = new jsPDF();
    
    // Header styling
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTHLY STATEMENT', 14, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Expense Ledger - Statement of Account`, 14, 30);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 140, 30);

    const monthStr = format(selectedMonth, 'MMMM yyyy');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Period: ${monthStr}`, 14, 52);

    const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return isSameMonth(d, selectedMonth);
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const expense = monthlyTransactions
      .filter(t => t.type === 'Expense' && t.status === 'Paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pending = monthlyTransactions
      .filter(t => t.type === 'Expense' && t.status === 'Pending')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 58, 182, 28, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL INCOME', 20, 68);
    doc.text('PAID EXPENSES', 80, 68);
    doc.text('NET CASHFLOW', 140, 68);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`+${currency} ${income.toLocaleString()}`, 20, 78);

    doc.setTextColor(239, 68, 68); // rose-500
    doc.text(`-${currency} ${expense.toLocaleString()}`, 80, 78);

    const balance = income - expense;
    doc.setTextColor(balance >= 0 ? 16 : 239, balance >= 0 ? 185 : 68, balance >= 0 ? 129 : 68);
    doc.text(`${balance >= 0 ? '+' : '-'}${currency} ${Math.abs(balance).toLocaleString()}`, 140, 78);

    // Transactions Table
    const tableData = monthlyTransactions.map(t => [
      format(new Date(t.date), 'MMM dd, yyyy'),
      t.category?.name || 'General',
      t.notes || '-',
      t.status || 'Paid',
      `${t.type === 'Income' ? '+' : '-'}${currency} ${Number(t.amount).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 94,
      head: [['Date', 'Category', 'Notes', 'Status', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      }
    });

    doc.save(`statement_${format(selectedMonth, 'yyyy_MM')}.pdf`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const res = await restoreBackup(data);
        if (res.success) {
          setStatusMessage('Backup restored successfully!');
          setTimeout(() => setStatusMessage(''), 3000);
        } else {
          alert(res.message || 'Failed to restore backup');
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">

      {statusMessage && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in">
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

      {/* Master Password & Security Management */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Change Master Password</h3>
            <p className="text-sm text-secondary-foreground">Update your master security key used to encrypt and unlock your ledger.</p>
          </div>
        </div>

        {passwordMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in font-medium">
            <Check size={16} />
            <span>{passwordMsg}</span>
          </div>
        )}

        {passwordErr && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in font-medium">
            <AlertCircle size={16} />
            <span>{passwordErr}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-secondary-foreground mb-1.5 uppercase tracking-wider">
              Current Password (Optional if newly bound)
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary-foreground mb-1.5 uppercase tracking-wider">
                New Master Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 pl-10 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-foreground mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 pl-10 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-foreground" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-secondary-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showPassword ? 'Hide password text' : 'Show password text'}</span>
            </button>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Security & Recovery Account Binding */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span>Recovery Email & Single Sign-On</span>
          </h3>
          <p className="text-sm text-secondary-foreground mt-0.5">
            Bind your email address to enable Google Sign-In authorization and emergency password recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-secondary-foreground mb-1.5 uppercase tracking-wider">
              Recovery Email Address
            </label>
            <div className="flex gap-2">
              <input 
                type="email"
                placeholder="yourname@gmail.com"
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
                    setStatusMessage('Recovery email saved successfully!');
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
