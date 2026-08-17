import React, { useState } from 'react';
import useStore from '../store/useStore';
import { format } from 'date-fns';
import { Search, RefreshCcw, Camera, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import EditTransactionModal from './EditTransactionModal';
import { resolveFundSource } from '../utils/funds';

const TransactionList = () => {
  const { transactions, categories, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [previewGallery, setPreviewGallery] = useState(null); // { images, title, index }

  const filtered = transactions.filter(t => 
    (t.type === 'Income' || t.status === 'Paid') &&
    (t.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currency = settings.currency || 'BDT';

  // Calculate totals for filtered transactions
  let totalDebit = 0;
  let totalCredit = 0;
  filtered.forEach(t => {
    if (t.type === 'Income') totalCredit += Number(t.amount);
    else totalDebit += Number(t.amount);
  });

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Transactions Ledger</h2>
          <p className="text-xs text-secondary-foreground mt-0.5">Click any row to edit or safely delete</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/40 text-secondary-foreground text-xs uppercase tracking-wider border-b border-border">
              <th className="p-4 font-semibold w-1/2">Description</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold text-right text-rose-400">Debit</th>
              <th className="p-4 font-semibold text-right text-emerald-400">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length > 0 ? filtered.map((t) => (
              <tr 
                key={t._id} 
                onClick={() => setEditingItem(t)}
                className="hover:bg-secondary/30 cursor-pointer transition-colors group"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {t.notes || t.category?.name || 'Transaction'}
                    </span>
                    {t.isRecurring && <RefreshCcw size={12} className="text-primary shrink-0" title="Recurring" />}
                    {(() => {
                      const images = (t.receiptImages && t.receiptImages.length > 0)
                        ? t.receiptImages
                        : (t.receiptImage ? [t.receiptImage] : []);
                      if (images.length === 0) return null;
                      return (
                        <div 
                          className="flex items-center gap-1.5 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewGallery({ images, title: t.notes || t.category?.name || 'Receipt', index: 0 });
                          }}
                        >
                          <div className="relative group/thumb w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/40 bg-black/40 hover:scale-110 transition-transform cursor-pointer shadow-sm">
                            <img src={images[0]} alt="Receipt" className="w-full h-full object-cover" />
                            {images.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-emerald-500 text-black text-[8px] font-black px-0.5 rounded-tl leading-none">
                                +{images.length - 1}
                              </span>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 transition-colors" title="Click to view full photo">
                            <Camera size={10} />
                            <span>{images.length > 1 ? `${images.length} Photos` : 'Receipt'}</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-secondary-foreground mt-0.5">
                    {format(new Date(t.date), 'MMM dd, yyyy')}
                  </p>
                </td>

                <td className="p-4 text-xs font-medium">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span 
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-transparent"
                      style={{ backgroundColor: `${t.category?.color || '#8884d8'}20`, color: t.category?.color || '#8884d8' }}
                    >
                      {t.category?.name || 'Uncategorized'}
                    </span>
                    {t.type === 'Expense' && t.fundSource && (() => {
                      const resolved = resolveFundSource(t.fundSource, transactions, categories);
                      const isMisc = resolved.toLowerCase() === 'miscellaneous' || resolved.toLowerCase() === 'misc';
                      return (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          isMisc 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          Fund: {resolved}
                        </span>
                      );
                    })()}
                  </div>
                </td>

                <td className="p-4 text-right font-bold text-sm text-foreground whitespace-nowrap">
                  {t.type === 'Expense' ? (
                    <span>{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>

                <td className="p-4 text-right font-bold text-sm text-emerald-400 whitespace-nowrap">
                  {t.type === 'Income' ? (
                    <span>{currency} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="p-8 text-center text-secondary-foreground">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr className="bg-secondary/60 font-bold border-t-2 border-border text-sm">
              <td className="p-4 uppercase tracking-wider text-xs text-slate-300">Total</td>
              <td className="p-4"></td>
              <td className="p-4 text-right font-black text-rose-400 text-base border-t border-border">
                {currency} {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="p-4 text-right font-black text-emerald-400 text-base border-t border-border">
                {currency} {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {editingItem && (
        <EditTransactionModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
        />
      )}

      {/* Direct PC Gallery Lightbox */}
      {previewGallery && previewGallery.images?.length > 0 && (
        <div 
          className="fixed inset-0 min-h-[100dvh] w-full h-full bg-black/95 z-[160] flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in"
          onClick={() => setPreviewGallery(null)}
        >
          {/* Top Bar */}
          <div 
            className="w-full max-w-4xl flex items-center justify-between p-2 sm:p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">{previewGallery.title}</h3>
              <p className="text-xs text-slate-400">
                Photo {(previewGallery.index || 0) + 1} of {previewGallery.images.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={previewGallery.images[previewGallery.index || 0]}
                target="_blank"
                rel="noreferrer"
                download={`receipt_photo_${(previewGallery.index || 0) + 1}.jpg`}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Download photo"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Download</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewGallery(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Stage */}
          <div 
            className="relative w-full max-w-4xl flex-1 flex items-center justify-center overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {previewGallery.images.length > 1 && (
              <button
                type="button"
                onClick={() => setPreviewGallery(prev => ({
                  ...prev,
                  index: (prev.index || 0) > 0 ? prev.index - 1 : prev.images.length - 1
                }))}
                className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-xl"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img 
              src={previewGallery.images[previewGallery.index || 0]} 
              alt="Receipt Preview" 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150"
            />

            {previewGallery.images.length > 1 && (
              <button
                type="button"
                onClick={() => setPreviewGallery(prev => ({
                  ...prev,
                  index: (prev.index || 0) < prev.images.length - 1 ? (prev.index || 0) + 1 : 0
                }))}
                className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-xl"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {previewGallery.images.length > 1 && (
            <div 
              className="flex items-center gap-2 p-2 max-w-full overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {previewGallery.images.map((url, idx) => (
                <button
                  key={`gallery-thumb-${idx}`}
                  type="button"
                  onClick={() => setPreviewGallery(prev => ({ ...prev, index: idx }))}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    idx === (previewGallery.index || 0)
                      ? 'border-emerald-400 scale-105 shadow-lg shadow-emerald-500/20'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
