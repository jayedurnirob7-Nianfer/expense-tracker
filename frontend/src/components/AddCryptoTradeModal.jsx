import React, { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Calendar, FileText, Check, Search, Coins, ArrowRight, ShieldCheck } from 'lucide-react';
import useStore from '../store/useStore';
import { getAvailableFundOptions } from '../utils/funds';

const AddCryptoTradeModal = ({ onClose, initialSymbol = 'BTC' }) => {
  const { 
    addCryptoTrade, 
    popularCrypto, 
    cryptoPrices, 
    transactions, 
    categories, 
    settings 
  } = useStore();

  const [tradeType, setTradeType] = useState('BUY'); // 'BUY' | 'SELL' | 'STAKE_REWARD'
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustomCoin, setIsCustomCoin] = useState(false);

  const [quantity, setQuantity] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [totalUsd, setTotalUsd] = useState('');
  const [totalNative, setTotalNative] = useState('');

  const [fundSource, setFundSource] = useState('Salary');
  const [deductFromLedger, setDeductFromLedger] = useState(true);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currency = settings?.currency || 'BDT';
  const exchangeRate = currency === 'BDT' ? 122.5 : 1.0;
  const availableFunds = getAvailableFundOptions(transactions, categories);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Set initial coin
  useEffect(() => {
    if (popularCrypto && popularCrypto.length > 0) {
      const found = popularCrypto.find(c => c.symbol === initialSymbol) || popularCrypto[0];
      setSelectedCoin(found);
      const liveP = cryptoPrices[found.symbol]?.priceUsd || found.priceUsd || 0;
      if (liveP > 0) {
        setPriceUsd(liveP.toString());
      }
    }
  }, [popularCrypto, initialSymbol, cryptoPrices]);

  // Handle coin selection
  const handleSelectCoin = (coin) => {
    setSelectedCoin(coin);
    setIsCustomCoin(false);
    const liveP = cryptoPrices[coin.symbol]?.priceUsd || coin.priceUsd || 0;
    if (liveP > 0) {
      setPriceUsd(liveP.toString());
      if (quantity && parseFloat(quantity) > 0) {
        const tUsd = (parseFloat(quantity) * liveP).toFixed(2);
        setTotalUsd(tUsd);
        setTotalNative((parseFloat(tUsd) * exchangeRate).toFixed(2));
      }
    }
  };

  // Quantity input change
  const handleQuantityChange = (val) => {
    setQuantity(val);
    const numQty = parseFloat(val);
    const numPrice = parseFloat(priceUsd);
    if (!isNaN(numQty) && !isNaN(numPrice) && numQty > 0 && numPrice > 0) {
      const tUsd = (numQty * numPrice).toFixed(2);
      setTotalUsd(tUsd);
      setTotalNative((parseFloat(tUsd) * exchangeRate).toFixed(2));
    }
  };

  // Price USD change
  const handlePriceChange = (val) => {
    setPriceUsd(val);
    const numQty = parseFloat(quantity);
    const numPrice = parseFloat(val);
    if (!isNaN(numQty) && !isNaN(numPrice) && numQty > 0 && numPrice > 0) {
      const tUsd = (numQty * numPrice).toFixed(2);
      setTotalUsd(tUsd);
      setTotalNative((parseFloat(tUsd) * exchangeRate).toFixed(2));
    }
  };

  // Total USD change (reverse calculate quantity)
  const handleTotalUsdChange = (val) => {
    setTotalUsd(val);
    const numTotal = parseFloat(val);
    const numPrice = parseFloat(priceUsd);
    if (!isNaN(numTotal) && !isNaN(numPrice) && numPrice > 0) {
      setQuantity((numTotal / numPrice).toFixed(6));
      setTotalNative((numTotal * exchangeRate).toFixed(2));
    }
  };

  const filteredCoins = (popularCrypto || []).filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const symbol = isCustomCoin ? customSymbol.trim().toUpperCase() : selectedCoin?.symbol;
    const name = isCustomCoin ? (customName.trim() || symbol) : selectedCoin?.name;

    if (!symbol) {
      setError('Please select or specify a cryptocurrency symbol.');
      return;
    }

    const numQty = parseFloat(quantity);
    const numPrice = parseFloat(priceUsd);
    if (isNaN(numQty) || numQty <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price in USD.');
      return;
    }

    setLoading(true);

    const payload = {
      symbol,
      name,
      coingeckoId: selectedCoin?.coingeckoId || '',
      type: tradeType,
      quantity: numQty,
      priceUsd: numPrice,
      totalUsd: parseFloat(totalUsd) || (numQty * numPrice),
      totalNative: parseFloat(totalNative) || ((parseFloat(totalUsd) || (numQty * numPrice)) * exchangeRate),
      fundSource: fundSource || 'Salary',
      deductFromLedger: tradeType === 'BUY' ? deductFromLedger : false,
      notes,
      date: new Date(date)
    };

    const res = await addCryptoTrade(payload);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Failed to record crypto transaction.');
    }
  };

  return (
    <div 
      className="fixed inset-0 min-h-[100dvh] w-full h-full bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Log Crypto Investment</h3>
              <p className="text-xs text-secondary-foreground">Track purchases, staking, or sales with live prices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Trade Type Switcher */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-secondary/50 rounded-2xl border border-border">
            {[
              { id: 'BUY', label: '+ Buy Asset' },
              { id: 'SELL', label: '- Sell Asset' },
              { id: 'STAKE_REWARD', label: '★ Reward / Airdrop' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTradeType(tab.id)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  tradeType === tab.id
                    ? tab.id === 'BUY'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : tab.id === 'SELL'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-primary text-primary-foreground shadow-md'
                    : 'text-secondary-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Asset Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Select Cryptocurrency</label>
              <button
                type="button"
                onClick={() => setIsCustomCoin(!isCustomCoin)}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                {isCustomCoin ? 'Choose from top coins' : '+ Add custom coin/token'}
              </button>
            </div>

            {!isCustomCoin ? (
              <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Bitcoin, Solana, USDT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2 pl-9 text-xs text-foreground placeholder-secondary-foreground focus:outline-none focus:border-primary"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground" />
                </div>

                {/* Popular Coins Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                  {filteredCoins.map(coin => {
                    const isSelected = selectedCoin?.symbol === coin.symbol;
                    const live = cryptoPrices[coin.symbol]?.priceUsd || coin.priceUsd || 0;
                    return (
                      <button
                        key={coin.symbol}
                        type="button"
                        onClick={() => handleSelectCoin(coin)}
                        className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary shadow-sm'
                            : 'bg-card border-border hover:bg-secondary/40 text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs">{coin.symbol}</span>
                          <span className="text-[10px] opacity-70">{coin.icon}</span>
                        </div>
                        <span className="text-[10px] text-secondary-foreground truncate w-full">{coin.name}</span>
                        <span className="text-[10px] font-mono mt-1 text-foreground font-semibold">
                          ${live > 1 ? live.toLocaleString(undefined, { maximumFractionDigits: 2 }) : live.toFixed(4)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-secondary-foreground block mb-1">Coin Symbol (e.g. SUI)</label>
                  <input
                    type="text"
                    required
                    placeholder="BTC / ETH"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs uppercase font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-secondary-foreground block mb-1">Coin Name</label>
                  <input
                    type="text"
                    placeholder="Bitcoin"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Investment Calculations: Quantity & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Quantity Owned / Bought
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.05"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Buy Price ($ USD / Coin)
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="60000"
                value={priceUsd}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Total Value Displays */}
          <div className="bg-secondary/40 border border-border rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary-foreground">Total Investment ($ USD):</span>
              <div className="flex items-center gap-1">
                <span className="font-bold font-mono text-sm text-foreground">$</span>
                <input
                  type="number"
                  step="any"
                  value={totalUsd}
                  onChange={(e) => handleTotalUsdChange(e.target.value)}
                  className="w-28 bg-card border border-border rounded-lg px-2 py-1 text-right font-mono font-bold text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
              <span className="text-secondary-foreground">Converted ({currency}):</span>
              <span className="font-bold text-primary text-sm">
                {currency} {Number(totalNative || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Fund Source & Ledger Auto-Deduct */}
          {tradeType === 'BUY' && (
            <div className="bg-card border border-border rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  Paid From Which Fund?
                </label>
                <select
                  value={fundSource}
                  onChange={(e) => setFundSource(e.target.value)}
                  className="bg-secondary border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                >
                  {availableFunds.map(fund => (
                    <option key={fund} value={fund}>{fund} Fund</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-secondary-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={deductFromLedger}
                  onChange={(e) => setDeductFromLedger(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-0"
                />
                <span>
                  <strong>Record as Expense in Ledger:</strong> Deduct {currency} {Number(totalNative || 0).toLocaleString()} from <strong>{fundSource} Fund</strong> under <em>Savings & Invest</em>.
                </span>
              </label>
            </div>
          )}

          {/* Date & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Transaction Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Notes / Exchange</label>
              <input
                type="text"
                placeholder="Binance / Cold Wallet"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-secondary-foreground hover:bg-secondary text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              {loading ? 'Recording...' : `Record ${tradeType === 'BUY' ? 'Purchase' : tradeType === 'SELL' ? 'Sale' : 'Reward'}`}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddCryptoTradeModal;
