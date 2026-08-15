import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  ChevronRight, 
  X, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Filter,
  Star,
  Search,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import useStore from '../store/useStore';
import { computeFundBreakdown } from '../utils/funds';
import { exportFundStatementToPDF } from '../utils/exportPdf';

const FundBreakdownCard = ({ monthlyOnly = true }) => {
  const { transactions, settings, selectedMonth } = useStore();
  const [selectedFundDetail, setSelectedFundDetail] = useState(null);
  const [timeScope, setTimeScope] = useState(monthlyOnly ? 'month' : 'all'); // 'month' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PINNED' | 'OVERSPENT' | 'ACTIVE'
  const [showAllCards, setShowAllCards] = useState(false);

  // Persistent Pinned/Favorite Funds (stored in localStorage)
  const [pinnedFunds, setPinnedFunds] = useState(() => {
    try {
      const saved = localStorage.getItem('nirob_pinned_funds');
      return saved ? JSON.parse(saved) : ['Salary'];
    } catch (e) {
      return ['Salary'];
    }
  });

  const currency = settings?.currency || 'BDT';

  const togglePinFund = (fundName, e) => {
    if (e) e.stopPropagation();
    setPinnedFunds(prev => {
      const exists = prev.includes(fundName);
      const updated = exists ? prev.filter(f => f !== fundName) : [...prev, fundName];
      try {
        localStorage.setItem('nirob_pinned_funds', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save pinned funds:', err);
      }
      return updated;
    });
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedFundDetail(null);
    };
    if (selectedFundDetail) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFundDetail]);

  const relevantTransactions = useMemo(() => {
    if (timeScope === 'month') {
      return transactions.filter(t => {
        const d = new Date(t.date);
        return isSameMonth(d, selectedMonth);
      });
    }
    return transactions;
  }, [transactions, timeScope, selectedMonth]);

  const rawFundBreakdown = useMemo(() => {
    return computeFundBreakdown(relevantTransactions);
  }, [relevantTransactions]);

  // Aggregate Totals across all funds
  const totals = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    rawFundBreakdown.forEach(f => {
      totalInflow += Number(f.inflow || 0);
      totalOutflow += Number(f.outflow || 0);
    });
    return {
      inflow: totalInflow,
      outflow: totalOutflow,
      balance: totalInflow - totalOutflow,
      count: rawFundBreakdown.length,
    };
  }, [rawFundBreakdown]);

  // Sort funds: PINNED / FAVORITES ALWAYS COME FIRST AT THE START
  const sortedAndFilteredFunds = useMemo(() => {
    let list = [...rawFundBreakdown];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(f => f.name.toLowerCase().includes(q));
    }

    // Filter by tab
    if (activeFilter === 'PINNED') {
      list = list.filter(f => pinnedFunds.includes(f.name));
    } else if (activeFilter === 'OVERSPENT') {
      list = list.filter(f => f.balance < 0);
    } else if (activeFilter === 'ACTIVE') {
      list = list.filter(f => f.inflow > 0);
    }

    // Sort: Pinned first, then by highest total inflow/balance
    return list.sort((a, b) => {
      const aPinned = pinnedFunds.includes(a.name) ? 1 : 0;
      const bPinned = pinnedFunds.includes(b.name) ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned; // Pinned to the top!
      return (Number(b.inflow) || 0) - (Number(a.inflow) || 0);
    });
  }, [rawFundBreakdown, pinnedFunds, searchQuery, activeFilter]);

  // Manage large volume: display 6 cards initially if > 6, with "Show All" toggle
  const visibleFunds = useMemo(() => {
    if (showAllCards || sortedAndFilteredFunds.length <= 6 || searchQuery.trim() || activeFilter !== 'ALL') {
      return sortedAndFilteredFunds;
    }
    return sortedAndFilteredFunds.slice(0, 6);
  }, [sortedAndFilteredFunds, showAllCards, searchQuery, activeFilter]);

  const handleDownloadPDF = (fund, e) => {
    if (e) e.stopPropagation();
    exportFundStatementToPDF(fund, timeScope, selectedMonth, currency);
  };

  return (
    <div className="bg-[#0b1320] border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      
      {/* Card Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
            <Wallet size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Fund Source Ledger & Totals
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {rawFundBreakdown.length} {rawFundBreakdown.length === 1 ? 'Fund' : 'Funds'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live inflow, spending & balance per income source · Click ★ to pin favorite funds first
            </p>
          </div>
        </div>

        {/* Controls: Time Scope Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center bg-[#111a2e] p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
            <button
              onClick={() => setTimeScope('month')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                timeScope === 'month'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {format(selectedMonth, 'MMM yyyy')}
            </button>
            <button
              onClick={() => setTimeScope('all')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                timeScope === 'all'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All-Time
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Overview Strip (Handles any number of funds: 1 to 20+) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#080e18] border border-slate-800/80">
        <div className="flex items-center justify-between sm:justify-start sm:gap-3 px-2">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Inflow</span>
            <span className="text-base sm:text-lg font-mono font-extrabold text-emerald-400">
              +{currency} {totals.inflow.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start sm:gap-3 px-2 sm:border-l sm:border-slate-800">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Spent</span>
            <span className="text-base sm:text-lg font-mono font-extrabold text-rose-400">
              -{currency} {totals.outflow.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start sm:gap-3 px-2 sm:border-l sm:border-slate-800">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Combined Balance</span>
            <span className={`text-base sm:text-lg font-mono font-extrabold ${totals.balance < 0 ? 'text-rose-400' : 'text-white'}`}>
              {currency} {totals.balance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar for 10-20+ Funds */}
      {rawFundBreakdown.length > 2 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeFilter === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              All ({rawFundBreakdown.length})
            </button>
            <button
              onClick={() => setActiveFilter('PINNED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 shrink-0 ${
                activeFilter === 'PINNED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300 bg-slate-800/50'
              }`}
            >
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>Pinned ({rawFundBreakdown.filter(f => pinnedFunds.includes(f.name)).length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeFilter === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300 bg-slate-800/50'
              }`}
            >
              Active Inflow ({rawFundBreakdown.filter(f => f.inflow > 0).length})
            </button>
            {rawFundBreakdown.some(f => f.balance < 0) && (
              <button
                onClick={() => setActiveFilter('OVERSPENT')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  activeFilter === 'OVERSPENT'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-rose-300 bg-slate-800/50'
                }`}
              >
                Overspent ({rawFundBreakdown.filter(f => f.balance < 0).length})
              </button>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px] sm:w-60">
            <input 
              type="text"
              placeholder="Search funds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111a2e] border border-slate-700/80 rounded-xl px-3.5 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fund Cards Grid with Favorite Pinning & Pixel-Perfect Alignment */}
      {visibleFunds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleFunds.map((fund) => {
            const isPinned = pinnedFunds.includes(fund.name);
            const isOverspent = fund.balance < 0;
            const isLow = fund.spentPercent >= 85 && !isOverspent;

            return (
              <div
                key={fund.name}
                onClick={() => setSelectedFundDetail(fund)}
                className={`group relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 flex flex-col justify-between h-full ${
                  isPinned
                    ? 'bg-gradient-to-br from-[#131d2e] via-[#0d1626] to-[#070d18] border-amber-500/40 shadow-amber-500/5 hover:border-amber-400'
                    : isOverspent
                    ? 'bg-gradient-to-br from-[#1f0f18] via-[#140c14] to-[#0d070d] border-rose-500/40 hover:border-rose-400'
                    : 'bg-gradient-to-br from-[#10192b] via-[#0c1424] to-[#080d19] border-slate-700/80 hover:border-slate-500'
                }`}
              >
                {/* Top Section */}
                <div>
                  {/* Top Row: Star Favorite Pin + Fund Title + Count Button */}
                  <div className="flex items-start justify-between gap-2 min-h-[46px] mb-3.5">
                    <div className="flex items-start gap-2 min-w-0 pr-1">
                      {/* Interactive Star / Favorite Pin Button */}
                      <button
                        type="button"
                        onClick={(e) => togglePinFund(fund.name, e)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-amber-400 transition-transform active:scale-90 shrink-0 mt-0.5"
                        title={isPinned ? 'Pinned at start (Click to unpin)' : 'Click to pin fund to start'}
                      >
                        <Star 
                          size={17} 
                          className={isPinned ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-amber-400'} 
                        />
                      </button>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-base text-white tracking-tight group-hover:text-emerald-400 transition-colors truncate">
                            {fund.name} Fund
                          </h4>
                          {isPinned && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 shadow-sm">
                              PINNED
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Source Account
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[11px] text-slate-300 font-bold bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 shrink-0 group-hover:border-emerald-500/40 group-hover:text-white transition-colors">
                      <span>{fund.totalTransactions} {fund.totalTransactions === 1 ? 'item' : 'items'}</span>
                      <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform text-emerald-400" />
                    </div>
                  </div>

                  {/* Middle Section: Clear Tabular Key-Value Metrics */}
                  <div className="space-y-2 mb-3.5 bg-black/25 p-3.5 rounded-2xl border border-white/5 shadow-inner">
                    {/* Total Inflow */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                        Total Received:
                      </span>
                      <span className="font-bold text-emerald-400 font-mono text-sm tracking-tight">
                        +{currency} {fund.inflow.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </span>
                    </div>

                    {/* Total Outflow */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                        Actually Spent:
                      </span>
                      <span className="font-bold text-rose-400 font-mono text-sm tracking-tight">
                        -{currency} {fund.outflow.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </span>
                    </div>

                    {/* Available Balance */}
                    <div className="pt-2 mt-1 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Available Balance:
                      </span>
                      <span className={`font-mono font-extrabold text-base tracking-tight ${isOverspent ? 'text-rose-400' : 'text-white'}`}>
                        {currency} {fund.balance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Progress / Burn Bar Section */}
                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">
                        Spent: <strong className="text-white font-mono">{fund.spentPercent}%</strong>
                      </span>
                      <span className={`text-[11px] font-bold font-mono ${
                        isOverspent 
                          ? 'text-rose-400' 
                          : isLow 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                      }`}>
                        {isOverspent 
                          ? `Exceeded by ${currency} ${Math.abs(fund.balance).toLocaleString()}` 
                          : `${100 - fund.spentPercent}% remaining`}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                          isOverspent 
                            ? 'bg-gradient-to-r from-rose-600 to-rose-400' 
                            : isLow 
                            ? 'bg-gradient-to-r from-amber-600 to-amber-400' 
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, fund.spentPercent))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Perfectly Aligned Baseline Footer */}
                <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                    <span>View Statement & Details</span>
                    <span className="text-sm">→</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDownloadPDF(fund, e)}
                    className="p-2 rounded-xl bg-slate-800/90 hover:bg-emerald-500 hover:text-black text-slate-300 transition-all border border-slate-700/60 shadow-sm"
                    title="Download Statement PDF"
                  >
                    <Download size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-3xl space-y-2 bg-[#090f1a]">
          <p className="text-sm font-bold text-white">No matching funds found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or filter tab.</p>
        </div>
      )}

      {/* Show More / Show Less Toggle Button (For 10-20+ funds) */}
      {sortedAndFilteredFunds.length > 6 && !searchQuery && activeFilter === 'ALL' && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowAllCards(!showAllCards)}
            className="px-5 py-2.5 rounded-2xl bg-[#111a2e] hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all shadow-md inline-flex items-center gap-2"
          >
            {showAllCards ? (
              <>
                <ChevronUp size={15} className="text-emerald-400" />
                <span>Show Less (Top 6 Funds)</span>
              </>
            ) : (
              <>
                <ChevronDown size={15} className="text-emerald-400" />
                <span>Show All ({sortedAndFilteredFunds.length} Funds)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Fund Drilldown Modal (Click anywhere outside on backdrop to close) */}
      {selectedFundDetail && (() => {
        const fundItems = selectedFundDetail.items || [
          ...(selectedFundDetail.incomes || []),
          ...(selectedFundDetail.expenses || [])
        ];

        const formattedPeriod = timeScope === 'month'
          ? (selectedMonth instanceof Date && !isNaN(selectedMonth.getTime()) ? format(selectedMonth, 'MMMM yyyy') : 'Current Month')
          : 'All Transactions in History';

        return (
          <div 
            className="fixed inset-0 min-h-[100dvh] w-full h-full bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto"
            onClick={() => setSelectedFundDetail(null)}
          >
            {/* Modal Container */}
            <div 
              className="bg-[#0b1320] border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-lg shadow-inner">
                    {(selectedFundDetail.name || 'F').charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg sm:text-xl text-white">
                      {selectedFundDetail.name} Fund Statement
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formattedPeriod}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download PDF button on Modal Header */}
                  <button
                    type="button"
                    onClick={(e) => handleDownloadPDF(selectedFundDetail, e)}
                    className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Download Statement PDF"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => setSelectedFundDetail(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal High-Contrast Metrics Box */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-[#060c16] rounded-2xl border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Received</span>
                  <span className="font-extrabold text-sm sm:text-base text-emerald-400">
                    +{currency} {Number(selectedFundDetail.inflow || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Spent</span>
                  <span className="font-extrabold text-sm sm:text-base text-rose-400">
                    -{currency} {Number(selectedFundDetail.outflow || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Remaining</span>
                  <span className={`font-extrabold text-sm sm:text-base ${(selectedFundDetail.balance || 0) < 0 ? 'text-rose-400' : 'text-white'}`}>
                    {currency} {Number(selectedFundDetail.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Scrollable Transaction Log */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[340px]">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider sticky top-0 bg-[#0b1320] py-1">
                  Itemized Transactions ({fundItems.length})
                </h5>
                {fundItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No transactions recorded under this fund.
                  </div>
                ) : (
                  fundItems.map((item, idx) => {
                    const isIncome = item.type === 'Income';
                    let itemDateStr = 'Recent';
                    if (item.date) {
                      const d = new Date(item.date);
                      if (!isNaN(d.getTime())) {
                        itemDateStr = format(d, 'MMM dd, yyyy');
                      }
                    }

                    return (
                      <div 
                        key={item._id || idx}
                        className="p-3 bg-[#111a2e] rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {isIncome ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              {item.notes || item.category?.name || 'Transaction'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {itemDateStr} · <span className="text-slate-300 font-medium">{item.category?.name || 'General'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`font-mono font-extrabold text-sm ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isIncome ? '+' : '-'}{currency} {Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            {item.status || 'Paid'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> or click outside to dismiss.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFundDetail(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Close Statement
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default FundBreakdownCard;
