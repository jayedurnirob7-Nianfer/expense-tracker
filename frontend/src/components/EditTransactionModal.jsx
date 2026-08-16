import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { X, Calendar as CalendarIcon, ChevronDown, Check, Trash2, Lock, ShieldAlert, Camera, Image as ImageIcon, Upload, Maximize2, Download, ExternalLink } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import api from '../api';
import { compressImage, uploadToImgBB } from '../utils/imageCompressor';

import { resolveFundSource, getAvailableFundOptions } from '../utils/funds';

const EditTransactionModal = ({ item, onClose }) => {
  const { categories, transactions, addCategory, updateTransaction, deleteTransaction } = useStore();

  const [type, setType] = useState(item.type || 'Expense');
  const [notes, setNotes] = useState(item.notes || '');
  const [amount, setAmount] = useState(item.amount !== undefined ? String(item.amount) : '');
  const [selectedCategory, setSelectedCategory] = useState(item.category?._id || item.category || '');
  const [date, setDate] = useState(item.date ? new Date(item.date) : new Date());
  const [status, setStatus] = useState(item.status || 'Paid');
  const [isEssential, setIsEssential] = useState(item.isEssential !== undefined ? Boolean(item.isEssential) : Boolean(item.isRecurring));
  const [receiptImage, setReceiptImage] = useState(item.receiptImage || '');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [showLightbox, setShowLightbox] = useState(false);

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fund / Paid From state - automatically includes active income funds and Miscellaneous
  const [customFunds, setCustomFunds] = useState([]);
  const availableFunds = getAvailableFundOptions(transactions, categories, customFunds);
  const resolvedItemFund = item.fundSource ? resolveFundSource(item.fundSource, transactions, categories) : availableFunds[0] || 'Salary';
  const [fundSource, setFundSource] = useState(resolvedItemFund);
  const [showAddFund, setShowAddFund] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  
  // Category inline addition state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Password protected actions state (Delete & Unpay/Pending)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(null); // 'delete' or 'unpay'
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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
    const res = await addCategory({ name: newCatName.trim(), type, color: type === 'Income' ? '#10b981' : '#3b82f6' });
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

  const handleSaveClick = async (e) => {
    e.preventDefault();
    if (!amount) return;

    // Check if user is attempting to unpay a previously Paid bill
    const isUnpaying = (item.status === 'Paid' && status === 'Pending');

    if (isUnpaying) {
      setShowPasswordPrompt('unpay');
      return;
    }

    await performSave();
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setIsProcessingImage(true);

    try {
      const cdnImageUrl = await uploadToImgBB(file);
      setReceiptImage(cdnImageUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
      setImageError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setReceiptImage('');
    setImageError('');
  };

  const performSave = async () => {
    const catId = currentCategory ? currentCategory._id : (currentCategories[0]?._id || '');

    await updateTransaction(item._id, {
      notes: notes.trim(),
      amount: Number(amount),
      category: catId,
      type,
      date: date || new Date(),
      fundSource: type === 'Expense' ? (fundSource || 'Salary') : undefined,
      status,
      isEssential,
      receiptImage: receiptImage || ''
    });

    onClose();
  };

  const handleVerifyPasswordAction = async () => {
    if (!passwordInput) {
      setPasswordError('Please enter master password');
      return;
    }
    setIsVerifying(true);
    setPasswordError('');

    try {
      const res = await api.post('/auth/login', { password: passwordInput });
      if (res.data?.token || res.status === 200) {
        if (showPasswordPrompt === 'delete') {
          await deleteTransaction(item._id);
          onClose();
        } else if (showPasswordPrompt === 'unpay') {
          await performSave();
        }
      } else {
        setPasswordError('Invalid password. Action denied.');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Incorrect password. Action denied.');
    } finally {
      setIsVerifying(false);
    }
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
            <h2 className="text-xl font-bold text-white tracking-tight">
              Edit {item.isRecurring ? 'Bill' : 'Transaction'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Update details, fund source or safely remove item.</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveClick} className="p-6 pt-4 space-y-4">
          
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
          </div>

          {/* Payment Status Switcher - ONLY for Essential Bills */}
          {(item.isRecurring || item.isEssential) && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Payment Status</label>
                {item.status === 'Paid' && status === 'Pending' && (
                  <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                    <Lock size={10} /> Password Required to Unpay
                  </span>
                )}
              </div>
              <div className="bg-[#131d2b] p-1 rounded-xl flex gap-1 border border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setStatus('Paid')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                    status === 'Paid' 
                      ? 'bg-emerald-500 text-black shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Pending')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                    status === 'Pending' 
                      ? 'bg-amber-500 text-black shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending / Unpaid
                </button>
              </div>
            </div>
          )}

          {/* Category Selector with Inline Creation */}
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
                  className="flex-1 bg-[#131d2b] border border-emerald-500/60 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs outline-none"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())}
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="px-3.5 py-2 bg-[#1e293b] hover:bg-slate-700 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Paid From (Fund) Selector (For Debits / Bills) */}
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
                    className="flex-1 bg-[#131d2b] border border-emerald-500/60 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs outline-none"
                    value={newFundName}
                    onChange={(e) => setNewFundName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewFund())}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewFund}
                    className="px-3.5 py-2 bg-[#1e293b] hover:bg-slate-700 text-white rounded-xl font-semibold text-xs transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Essential toggle for bills */}
          {item.isRecurring && (
            <div className="bg-[#131d2b] border border-[#1e293b] rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-xs">Essential Bill</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Recurring monthly obligation</p>
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
          )}

          {/* Receipt / Voucher Photo Attachment */}
          <div className="pt-1">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera size={14} className="text-emerald-400" />
                <span>Attached Receipt / Photo</span>
              </label>
              {receiptImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            {/* Hidden native file inputs for Camera and File Picker */}
            <input 
              type="file" 
              ref={cameraInputRef} 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageSelect} 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleImageSelect} 
              className="hidden" 
            />

            {imageError && (
              <p className="text-xs text-rose-400 mb-2">{imageError}</p>
            )}

            {isProcessingImage ? (
              <div className="w-full py-6 rounded-2xl bg-[#131d2b] border border-dashed border-[#1e293b] flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Uploading to cloud CDN...</span>
              </div>
            ) : receiptImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#131d2b] group">
                <div 
                  onClick={() => setShowLightbox(true)}
                  className="cursor-pointer relative overflow-hidden flex items-center justify-center bg-black/40 max-h-52"
                  title="Click to view full screen"
                >
                  <img 
                    src={receiptImage} 
                    alt="Receipt / Voucher" 
                    className="w-full max-h-52 object-contain hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity text-white text-xs font-semibold backdrop-blur-[2px]">
                    <Maximize2 size={16} />
                    <span>View Fullscreen</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#0e1621]/90 backdrop-blur border-t border-[#1e293b] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowLightbox(true)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Maximize2 size={13} />
                    <span>Expand Photo</span>
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-[#1a2638] hover:bg-[#223249] text-white text-xs font-medium transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-[#1a2638] hover:bg-[#223249] text-white text-xs font-medium transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-3 rounded-2xl bg-[#131d2b] hover:bg-[#1a2638] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-white flex flex-col sm:flex-row items-center justify-center gap-2 transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                    <Camera size={16} />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-bold text-white leading-tight">Camera</p>
                    <p className="text-[10px] text-slate-400">Take photo</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-3 rounded-2xl bg-[#131d2b] hover:bg-[#1a2638] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-white flex flex-col sm:flex-row items-center justify-center gap-2 transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Upload size={16} />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-bold text-white leading-tight">Upload</p>
                    <p className="text-[10px] text-slate-400">From gallery</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Password Prompt UI (for Delete or Unpay) */}
          {showPasswordPrompt ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <ShieldAlert size={16} />
                <span>
                  {showPasswordPrompt === 'delete' ? 'Password Required to Delete Item' : 'Password Required to Mark as Unpaid'}
                </span>
              </div>
              <input 
                type="password"
                placeholder="Enter master password..."
                className="w-full bg-[#131d2b] border border-amber-500/40 rounded-xl px-3 py-2.5 text-white text-xs placeholder-slate-500 outline-none focus:border-amber-400"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleVerifyPasswordAction())}
                autoFocus
              />
              {passwordError && <p className="text-[11px] text-red-400 font-semibold">{passwordError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleVerifyPasswordAction}
                  disabled={isVerifying}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Authorize Action'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordPrompt(null);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-3 space-y-2">
              <button
                type="submit"
                className="w-full bg-[#23c55e] hover:bg-[#1ea850] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] text-center text-sm"
              >
                Save Changes
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordPrompt('delete');
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete {item.isRecurring ? 'Bill' : 'Transaction'}</span>
              </button>
            </div>
          )}

        </form>

      </div>

      {/* Full-Screen Lightbox Modal */}
      {showLightbox && receiptImage && (
        <div 
          className="fixed inset-0 min-h-[100dvh] w-full h-full bg-black/95 z-[120] flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowLightbox(false)}
        >
          {/* Lightbox Top Bar */}
          <div 
            className="w-full max-w-4xl flex items-center justify-between p-4 text-white mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-base text-white">{notes || item.category?.name || 'Receipt Photo'}</h3>
              <p className="text-xs text-slate-400">{format(new Date(date), 'MMMM dd, yyyy')}</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={receiptImage}
                download={`receipt_${format(new Date(date), 'yyyy-MM-dd')}.jpg`}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Download full photo"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Download</span>
              </a>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lightbox Image Container */}
          <div 
            className="max-w-4xl max-h-[85vh] overflow-auto flex items-center justify-center p-2 rounded-2xl bg-black/50 border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={receiptImage} 
              alt="Full Resolution Receipt" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default EditTransactionModal;
