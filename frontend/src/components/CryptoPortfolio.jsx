import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart as PieIcon, 
  History, 
  ShieldCheck, 
  ExternalLink, 
  DollarSign, 
  Download,
  AlertTriangle,
  X,
  Star,
  Zap,
  Tag,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import useStore from '../store/useStore';
import AddCryptoTradeModal from './AddCryptoTradeModal';
import { exportCryptoPortfolioToPDF } from '../utils/exportPdf';

const COLORS = [
  '#f59e0b', // Amber (BTC)
  '#6366f1', // Indigo (ETH)
  '#10b981', // Emerald (SOL/USDT)
  '#ec4899', // Pink (DOT/ADA)
  '#3b82f6', // Blue (XRP/LINK)
  '#8b5cf6', // Purple (AVAX/MATIC)
  '#14b8a6', // Teal (SUI/TON)
  '#f97316', // Orange
];

const CryptoPortfolio = () => {
  const { 
    cryptoHoldings = [], 
    cryptoSummary = null, 
    cryptoPrices = {}, 
    popularCrypto = [],
    cryptoLoading = false, 
    fetchCrypto, 
    deleteCryptoHolding,
    toggleCryptoFavorite,
    setActiveView,
    settings 
  } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInitialCoin, setSelectedInitialCoin] = useState('BTC');
  const [holdingToDelete, setHoldingToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('holdings'); // 'holdings' | 'history'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 5-Second Real-Time Auto-Sync Engine (Configurable: 5s, 15s, 30s)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5); // Default 5 seconds
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  const currency = settings?.currency || 'BDT';
  const exchangeRate = currency === 'BDT' ? 122.5 : 1.0;

  // Initial Fetch
  useEffect(() => {
    fetchCrypto();
  }, [fetchCrypto]);

  // Real-Time Auto-Sync Engine (Every 5 seconds)
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          fetchCrypto();
          return syncInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, syncInterval, fetchCrypto]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setHoldingToDelete(null);
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setSecondsRemaining(syncInterval);
    await fetchCrypto();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Holdings list sorted: Pinned/Favorites always first!
  const sortedHoldings = useMemo(() => {
    if (!Array.isArray(cryptoHoldings)) return [];
    return [...cryptoHoldings].sort((a, b) => {
      const aFav = a.isPinned || a.isFavorite ? 1 : 0;
      const bFav = b.isPinned || b.isFavorite ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;
      return (Number(b.currentValueUsd) || 0) - (Number(a.currentValueUsd) || 0);
    });
  }, [cryptoHoldings]);

  // Map of symbols user actually owns
  const holdingsMap = useMemo(() => {
    const map = {};
    sortedHoldings.forEach(h => {
      map[h.symbol] = h;
    });
    return map;
  }, [sortedHoldings]);

  // Dynamic Ticker Coins: Owned/Favorites appear FIRST!
  const prioritizedTickerCoins = useMemo(() => {
    const allPopular = popularCrypto && popularCrypto.length > 0 ? popularCrypto : [
      { symbol: 'BTC', name: 'Bitcoin' },
      { symbol: 'ETH', name: 'Ethereum' },
      { symbol: 'SOL', name: 'Solana' },
      { symbol: 'USDT', name: 'Tether USD' },
      { symbol: 'BNB', name: 'BNB' },
      { symbol: 'XRP', name: 'XRP' },
      { symbol: 'ADA', name: 'Cardano' },
      { symbol: 'DOGE', name: 'Dogecoin' },
    ];

    const ownedCoins = [];
    const otherCoins = [];

    allPopular.forEach(coin => {
      if (holdingsMap[coin.symbol]) {
        ownedCoins.push({ ...coin, isOwned: true, holding: holdingsMap[coin.symbol] });
      } else {
        otherCoins.push({ ...coin, isOwned: false });
      }
    });

    sortedHoldings.forEach(h => {
      if (!allPopular.some(c => c.symbol === h.symbol)) {
        ownedCoins.unshift({ symbol: h.symbol, name: h.name, isOwned: true, holding: h });
      }
    });

    return [...ownedCoins, ...otherCoins];
  }, [popularCrypto, sortedHoldings, holdingsMap]);

  const chartData = useMemo(() => {
    if (!sortedHoldings || sortedHoldings.length === 0) return [];
    return sortedHoldings
      .filter(h => Number(h.currentValueUsd || 0) > 0)
      .map((h, i) => ({
        name: h.symbol || 'ASSET',
        value: Number(h.currentValueUsd || 0),
        color: COLORS[i % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [sortedHoldings]);

  // Aggregate all trade transactions across holdings
  const allTrades = useMemo(() => {
    if (!sortedHoldings) return [];
    const trades = [];
    sortedHoldings.forEach(h => {
      if (h.trades && Array.isArray(h.trades)) {
        h.trades.forEach(t => {
          trades.push({
            ...t,
            symbol: h.symbol,
            coinName: h.name,
          });
        });
      }
    });
    return trades.sort((a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now()));
  }, [sortedHoldings]);

  const summary = cryptoSummary || {
    totalInvestedUsd: 0,
    currentValueUsd: 0,
    totalProfitLossUsd: 0,
    totalReturnPercent: 0,
  };

  const totalInvestedUsd = Number(summary.totalInvestedUsd || 0);
  const currentValueUsd = Number(summary.currentValueUsd || 0);
  const totalProfitLossUsd = Number(summary.totalProfitLossUsd || 0);
  const totalReturnPercent = Number(summary.totalReturnPercent || 0);

  const isProfitable = totalProfitLossUsd >= 0;

  const handleDownloadPDF = () => {
    exportCryptoPortfolioToPDF(summary, sortedHoldings, currency, exchangeRate);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">

      {/* 1. Top Header & 5-Sec Auto-Sync Bar */}
      <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-primary/15 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Coins size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Crypto & Investment Portfolio
                </h2>
                {sortedHoldings.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm shrink-0">
                    <Star size={11} className="fill-amber-300" />
                    <span>{sortedHoldings.length} Logged</span>
                  </span>
                )}
              </div>
              
              {/* Live 5s Sync Status indicator */}
              <div className="flex items-center flex-wrap gap-2.5 mt-1.5 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111a2e] border border-slate-700/60 font-mono shadow-inner">
                  <span className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
                  <span className="text-emerald-400 font-bold">
                    {autoSyncEnabled ? `⚡ ${syncInterval}s Sync: in ${secondsRemaining}s` : 'Sync Paused'}
                  </span>
                </div>

                {/* Interval Buttons: 5s (default), 15s, 30s */}
                <div className="flex items-center bg-[#111a2e] p-0.5 rounded-lg border border-slate-700/60 text-[11px] font-bold">
                  {[5, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => {
                        setSyncInterval(sec);
                        setSecondsRemaining(sec);
                        setAutoSyncEnabled(true);
                      }}
                      className={`px-2 py-0.5 rounded transition-all ${
                        syncInterval === sec && autoSyncEnabled
                          ? 'bg-emerald-500 text-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    autoSyncEnabled 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Toggle live market auto-sync"
                >
                  {autoSyncEnabled ? 'Live: ON' : 'Live: OFF'}
                </button>

                <span className="text-slate-500 text-xs">·</span>
                <span className="text-[11px] text-slate-300 font-mono">
                  1 USD ≈ {exchangeRate} {currency}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
              title="Download Portfolio PDF Report"
            >
              <Download size={15} className="text-amber-400" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {/* Manual Refresh button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Live Prices Now"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-emerald-400' : ''} />
              <span className="hidden sm:inline">Sync Now</span>
            </button>

            {/* Log Investment Button */}
            <button
              onClick={() => {
                setSelectedInitialCoin('BTC');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus size={16} />
              <span>+ Log Investment</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-gradient-to-br from-[#0e1626] via-[#0b1320] to-[#070d18] border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-1.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Portfolio Value
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              ${currentValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs font-bold text-emerald-400 font-mono">
            ≈ {currency} {(currentValueUsd * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* Total Invested */}
        <div className="bg-gradient-to-br from-[#0e1626] via-[#0b1320] to-[#070d18] border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-1.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Capital Invested
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              ${totalInvestedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            ≈ {currency} {(totalInvestedUsd * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* Total Profit / Loss */}
        <div className={`border rounded-3xl p-5 shadow-lg space-y-1.5 ${
          isProfitable 
            ? 'bg-gradient-to-br from-[#0d221c] via-[#0b1320] to-[#070d18] border-emerald-500/40' 
            : 'bg-gradient-to-br from-[#240e16] via-[#0b1320] to-[#070d18] border-rose-500/40'
        }`}>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Total Return (P&L)</span>
            {isProfitable ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
              isProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isProfitable ? '+' : ''}${totalProfitLossUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className={`text-xs font-bold font-mono ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfitable ? '+' : ''}{currency} {(totalProfitLossUsd * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* Total ROI */}
        <div className="bg-gradient-to-br from-[#0e1626] via-[#0b1320] to-[#070d18] border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-1.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            All-Time ROI
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
              isProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isProfitable ? '+' : ''}{totalReturnPercent.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-slate-300 font-semibold">
            {sortedHoldings.length} Active Holding{sortedHoldings.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* 3. MY HOLDINGS & TRADE HISTORY (USER REQUIREMENT: STAYS ABOVE LIVE MARKET UPDATE) */}
      <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        
        {/* Tab Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('holdings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'holdings'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              My Holdings ({sortedHoldings.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Trade History ({allTrades.length})
            </button>
          </div>
        </div>

        {/* Tab Content: Holdings List */}
        {activeTab === 'holdings' && (
          <div>
            {sortedHoldings.length > 0 ? (
              <div className="divide-y divide-slate-800 overflow-hidden border border-slate-800 rounded-2xl bg-[#0e1626]">
                {sortedHoldings.map((h) => {
                  const valUsd = Number(h.currentValueUsd || 0);
                  const valNative = Number(h.currentValueNative || (valUsd * exchangeRate) || 0);
                  const buyPrice = Number(h.avgBuyPriceUsd || 0);
                  const currentPrice = Number(h.currentPriceUsd || 0);
                  const pnlUsd = Number(h.profitLossUsd || 0);
                  const pnlPct = Number(h.profitLossPercent || 0);
                  const isHoldingProfitable = pnlUsd >= 0;
                  const liveChange = Number(h.change24h || 0);
                  const is24hUp = liveChange >= 0;
                  const isFav = h.isPinned || h.isFavorite;

                  return (
                    <div 
                      key={h._id} 
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-all ${
                        isFav ? 'bg-gradient-to-r from-amber-500/5 via-transparent to-transparent' : ''
                      }`}
                    >
                      {/* Left: Asset info + Star button */}
                      <div className="flex items-center gap-3.5">
                        <button
                          onClick={() => toggleCryptoFavorite(h._id)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 transition-colors"
                          title={isFav ? 'Pinned as favorite (First)' : 'Pin to top'}
                        >
                          <Star size={16} className={isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-600'} />
                        </button>

                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-sm shadow-inner shrink-0">
                          {h.symbol?.slice(0, 3) || 'CRY'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-base text-white">{h.name || h.symbol}</h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {h.symbol}
                            </span>
                            {isFav && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                TOP
                              </span>
                            )}
                            <span className={`text-[11px] font-bold flex items-center gap-0.5 ${is24hUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {is24hUp ? '▲' : '▼'} {Math.abs(liveChange).toFixed(2)}% (24h)
                            </span>
                          </div>

                          {/* PROMINENT BUYING RATE */}
                          <div className="flex items-center flex-wrap gap-2 mt-1 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold font-mono text-[11px]">
                              Buy Rate: ${buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                            
                            <span className="text-slate-400 font-mono text-[11px]">
                              Market: ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>

                            <span className="text-slate-500 font-mono text-[11px]">
                              ({h.totalQuantity} {h.symbol})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Valuation & Profit/Loss */}
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-left sm:text-right">
                          <p className="font-mono font-extrabold text-base text-white">
                            ${valUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-400 font-medium font-mono">
                            ≈ {currency} {valNative.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                          </p>
                        </div>

                        <div className="text-right min-w-[100px]">
                          <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                            isHoldingProfitable 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}>
                            {isHoldingProfitable ? '+' : ''}{pnlPct.toFixed(2)}%
                          </span>
                          <p className={`text-[11px] font-mono font-bold mt-0.5 ${
                            isHoldingProfitable ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isHoldingProfitable ? '+' : ''}${pnlUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInitialCoin(h.symbol);
                              setIsAddModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-black text-emerald-400 transition-colors text-xs font-bold"
                            title="Buy More"
                          >
                            <Plus size={14} />
                          </button>

                          <button
                            onClick={() => setHoldingToDelete(h)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Holding"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-3xl space-y-4 bg-[#0e1626]/40">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Coins size={28} />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-white">No crypto holdings logged yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Start tracking your crypto assets like Bitcoin, Ethereum, or Solana with real-time profit/loss tracking.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Log First Investment</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Trade History */}
        {activeTab === 'history' && (
          <div>
            {allTrades.length > 0 ? (
              <div className="divide-y divide-slate-800 overflow-hidden border border-slate-800 rounded-2xl bg-[#0e1626]">
                {allTrades.map((t, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        t.type === 'BUY' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                          : t.type === 'SELL' 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-primary/20 text-primary border border-primary/40'
                      }`}>
                        {t.type}
                      </span>
                      <div>
                        <p className="font-extrabold text-white text-sm">
                          {t.quantity} {t.symbol} @ ${Number(t.priceUsd || 0).toLocaleString()}
                        </p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {format(new Date(t.date || Date.now()), 'MMM dd, yyyy')} · {t.notes || 'Crypto Trade'}
                          {t.fundSource && (
                            <span className="ml-2 text-emerald-400 font-bold">
                              (Paid from {t.fundSource} fund)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-extrabold text-sm text-white">
                        ${Number(t.totalUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        ≈ {currency} {Number(t.totalNative || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No trade logs recorded yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. LIVE MARKET TICKERS & QUICK TRADE (BELOW MY HOLDINGS) */}
      <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              <span>Live Market Tickers & Quick Trade</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any coin to quickly log an investment into your ledger
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            5s Live Sync
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {prioritizedTickerCoins.map(coin => {
            const live = cryptoPrices[coin.symbol] || {};
            const currentPrice = Number(live.priceUsd || coin.priceUsd || 0);
            const change = Number(live.change24h || coin.change24h || 0);
            const isUp = change >= 0;
            const holding = coin.holding;
            const isOwned = !!holding;
            const buyRate = holding ? Number(holding.avgBuyPriceUsd || 0) : null;

            return (
              <div
                key={coin.symbol}
                onClick={() => {
                  setSelectedInitialCoin(coin.symbol);
                  setIsAddModalOpen(true);
                }}
                className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] text-left space-y-1.5 ${
                  isOwned
                    ? 'bg-gradient-to-br from-[#121c30] via-[#0d1628] to-[#0a1020] border-amber-500/40 shadow-lg shadow-amber-500/5 hover:border-amber-400'
                    : 'bg-[#111a2e] hover:bg-[#16233d] border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-white">{coin.symbol}</span>
                    {isOwned && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                        <Star size={9} className="fill-amber-300" />
                        OWNED
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? '+' : ''}{change.toFixed(2)}%
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Live Market</span>
                  <p className="font-mono font-extrabold text-sm text-white">
                    ${currentPrice > 1 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : currentPrice.toFixed(4)}
                  </p>
                </div>

                {buyRate !== null && (
                  <div className="pt-1.5 border-t border-slate-700/60 bg-black/20 -mx-1 px-2 py-1 rounded-lg">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-amber-300/90 font-bold">Your Buy Rate:</span>
                      <span className="font-mono font-extrabold text-amber-300">
                        ${buyRate > 1 ? buyRate.toLocaleString(undefined, { minimumFractionDigits: 2 }) : buyRate.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 hover:underline font-bold">
                    + Trade More
                  </span>
                  {isOwned && (
                    <span className="text-slate-400 text-[10px] font-mono">
                      {holding.totalQuantity} held
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. USER REQUIREMENT: ON THE LAST (Asset Distribution & Ledger Integration Banner at very bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Asset Distribution Pie Chart */}
        <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-5 shadow-lg lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1">
              <PieIcon size={16} className="text-emerald-400" />
              Asset Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-4">Portfolio weight by current valuation</p>
          </div>

          <div className="h-44 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    contentStyle={{ borderRadius: '12px', backgroundColor: '#0e1621', border: '1px solid #1e293b', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-500 py-8">
                No active assets to plot
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            {chartData.map((item) => {
              const pct = currentValueUsd > 0 ? ((item.value / currentValueUsd) * 100).toFixed(1) : 0;
              return (
                <div key={item.name} className="flex items-center gap-1.5 text-[11px] bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-white">{item.name}</span>
                  <span className="text-slate-400">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Security & Ledger Sync Banner (Screenshot 2 section moved to last) */}
        <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-5 shadow-lg lg:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-emerald-400" />
              Ledger Integration & Wealth Tracking
            </h3>
            <p className="text-xs text-slate-400">
              Your investment capital is automatically accounted for in your monthly expense statements.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#111a2e] rounded-2xl border border-slate-700/60 space-y-1">
              <span className="text-xs font-bold text-slate-300">Automatic Fund Debit</span>
              <p className="text-xs text-slate-400">
                When you log a buy trade with Salary Fund, it is automatically logged under <em>Savings & Invest</em>.
              </p>
            </div>
            <div className="p-3.5 bg-[#111a2e] rounded-2xl border border-slate-700/60 space-y-1">
              <span className="text-xs font-bold text-slate-300">Live 5-Second Polling</span>
              <p className="text-xs text-slate-400">
                Market prices refresh every 5s with instant profit & loss delta recalculations.
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Star size={16} className="text-amber-400 fill-amber-400 shrink-0" />
              <span>Logged coins automatically stay pinned to the <strong>first position</strong> for quick monitoring.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Log Modal */}
      {isAddModalOpen && (
        <AddCryptoTradeModal
          initialSymbol={selectedInitialCoin}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {holdingToDelete && (
        <div 
          className="fixed inset-0 min-h-[100dvh] w-full h-full bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setHoldingToDelete(null)}
        >
          <div 
            className="bg-[#0b1320] border border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                <AlertTriangle size={24} />
              </div>
              <button
                onClick={() => setHoldingToDelete(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-lg sm:text-xl text-white">
                Remove {holdingToDelete.name} ({holdingToDelete.symbol})?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Are you sure you want to remove this asset from your portfolio? All recorded trade history for this holding will be permanently deleted.
              </p>
            </div>

            <div className="bg-[#111a2e] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[11px] block">Holding Quantity</span>
                <span className="text-white font-bold">{holdingToDelete.totalQuantity} {holdingToDelete.symbol}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">Current Worth</span>
                <span className="text-emerald-400 font-bold">${Number(holdingToDelete.currentValueUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setHoldingToDelete(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = holdingToDelete._id;
                  setHoldingToDelete(null);
                  await deleteCryptoHolding(id);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-lg shadow-rose-500/25 flex items-center gap-2"
              >
                <Trash2 size={14} />
                <span>Yes, Remove Asset</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CryptoPortfolio;
