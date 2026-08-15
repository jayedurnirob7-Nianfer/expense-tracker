const express = require('express');
const router = express.Router();
const CryptoHolding = require('../models/CryptoHolding');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Settings = require('../models/Settings');

// Popular default cryptocurrency list with metadata & CoinGecko IDs
const POPULAR_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', icon: '◎' },
  { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin', icon: '⬡' },
  { symbol: 'XRP', name: 'XRP', coingeckoId: 'ripple', icon: '✕' },
  { symbol: 'USDT', name: 'Tether USD', coingeckoId: 'tether', icon: '₮' },
  { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', icon: '₳' },
  { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', icon: 'Ð' },
  { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2', icon: '▲' },
  { symbol: 'SUI', name: 'Sui', coingeckoId: 'sui', icon: '💧' },
  { symbol: 'TON', name: 'Toncoin', coingeckoId: 'the-open-network', icon: '💎' },
  { symbol: 'NEAR', name: 'NEAR Protocol', coingeckoId: 'near', icon: 'Ⓝ' },
  { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot', icon: '●' },
  { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink', icon: '⬡' },
  { symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network', icon: '⬡' },
];

// In-memory price cache to prevent rate-limiting
let priceCache = {
  timestamp: 0,
  data: {},
  usdToBdt: 122.5, // Standard fallback USD/BDT exchange rate
};

// Helper: Fetch live crypto prices from high-frequency public APIs (Binance primary + CoinGecko fallback)
const fetchLivePrices = async (symbols = []) => {
  const now = Date.now();
  // Cache for 3.5 seconds to support ultra-fast 5-second polling smoothly
  if (now - priceCache.timestamp < 3500 && Object.keys(priceCache.data).length > 0) {
    return priceCache.data;
  }

  // Primary: Binance Public 24hr Ticker API (High-rate, fast response)
  try {
    const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (binanceRes.ok) {
      const tickers = await binanceRes.json();
      const mapped = {};
      tickers.forEach(t => {
        if (t.symbol.endsWith('USDT')) {
          const sym = t.symbol.replace('USDT', '');
          mapped[sym] = {
            priceUsd: parseFloat(t.lastPrice),
            change24h: parseFloat(t.priceChangePercent),
          };
        }
      });
      priceCache = {
        timestamp: now,
        data: { ...priceCache.data, ...mapped },
        usdToBdt: priceCache.usdToBdt || 122.5
      };
      return priceCache.data;
    }
  } catch (bErr) {
    // console.warn('Binance ticker fallback:', bErr.message);
  }

  // Fallback: CoinGecko simple price API
  try {
    const ids = Array.from(new Set([
      'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'tether', 'cardano', 
      'dogecoin', 'avalanche-2', 'sui', 'the-open-network', 'near', 'polkadot', 'chainlink', 'matic-network'
    ])).join(',');

    const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(cgUrl, { 
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    
    if (res.ok) {
      const json = await res.json();
      const mapped = {};
      POPULAR_COINS.forEach(c => {
        if (json[c.coingeckoId]) {
          mapped[c.symbol] = {
            priceUsd: json[c.coingeckoId].usd,
            change24h: json[c.coingeckoId].usd_24h_change || 0,
          };
        }
      });
      priceCache = {
        timestamp: now,
        data: { ...priceCache.data, ...mapped },
        usdToBdt: priceCache.usdToBdt || 122.5
      };
      return priceCache.data;
    }
  } catch (err) {
    // console.warn('CoinGecko fallback:', err.message);
  }

  return priceCache.data;
};

// GET /api/crypto - List holdings and calculated live portfolio summary
router.get('/', async (req, res) => {
  try {
    // Sort with favorites/pinned first, then by totalInvested
    const holdings = await CryptoHolding.find().sort({ isPinned: -1, isFavorite: -1, totalInvestedUsd: -1 });
    const settings = await Settings.findOne() || { currency: 'BDT' };
    const exchangeRate = settings.currency === 'BDT' ? 122.5 : 1.0;

    const symbols = holdings.map(h => h.symbol);
    const livePrices = await fetchLivePrices(symbols);

    let totalInvestedUsd = 0;
    let currentValueUsd = 0;

    const enrichedHoldings = holdings.map(h => {
      const sym = h.symbol.toUpperCase();
      const market = livePrices[sym] || { 
        priceUsd: h.avgBuyPriceUsd || 0, 
        change24h: 0 
      };

      const holdingCurrentValUsd = h.totalQuantity * market.priceUsd;
      const profitLossUsd = holdingCurrentValUsd - h.totalInvestedUsd;
      const profitLossPercent = h.totalInvestedUsd > 0 
        ? ((profitLossUsd / h.totalInvestedUsd) * 100) 
        : 0;

      totalInvestedUsd += h.totalInvestedUsd;
      currentValueUsd += holdingCurrentValUsd;

      return {
        ...h.toObject(),
        currentPriceUsd: market.priceUsd,
        change24h: market.change24h,
        currentValueUsd: holdingCurrentValUsd,
        currentValueNative: holdingCurrentValUsd * exchangeRate,
        profitLossUsd,
        profitLossNative: profitLossUsd * exchangeRate,
        profitLossPercent,
        isFavorite: h.isFavorite ?? true,
        isPinned: h.isPinned ?? true,
      };
    });

    const totalProfitLossUsd = currentValueUsd - totalInvestedUsd;
    const totalReturnPercent = totalInvestedUsd > 0 
      ? ((totalProfitLossUsd / totalInvestedUsd) * 100) 
      : 0;

    const summary = {
      totalInvestedUsd,
      totalInvestedNative: totalInvestedUsd * exchangeRate,
      currentValueUsd,
      currentValueNative: currentValueUsd * exchangeRate,
      totalProfitLossUsd,
      totalProfitLossNative: totalProfitLossUsd * exchangeRate,
      totalReturnPercent,
      holdingsCount: holdings.length,
      exchangeRate,
      currency: settings.currency || 'BDT',
      lastSyncedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      summary,
      holdings: enrichedHoldings,
      popularCoins: POPULAR_COINS,
      livePrices,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/crypto/popular - List popular coins with live prices
router.get('/popular', async (req, res) => {
  try {
    const livePrices = await fetchLivePrices();
    const list = POPULAR_COINS.map(coin => ({
      ...coin,
      priceUsd: livePrices[coin.symbol]?.priceUsd || 0,
      change24h: livePrices[coin.symbol]?.change24h || 0,
    }));
    res.json({ success: true, coins: list, prices: livePrices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/crypto/trade - Log a Buy, Sell, or Staking trade
router.post('/trade', async (req, res) => {
  try {
    const { 
      symbol, 
      name, 
      coingeckoId, 
      type = 'BUY', 
      quantity, 
      priceUsd, 
      totalUsd, 
      totalNative, 
      fundSource = 'Salary', 
      deductFromLedger = false, 
      notes = '',
      date = new Date()
    } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid symbol and quantity are required' });
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const numQty = parseFloat(quantity);
    const numPrice = parseFloat(priceUsd) || (totalUsd ? parseFloat(totalUsd) / numQty : 0);
    const numTotalUsd = parseFloat(totalUsd) || (numQty * numPrice);
    const settings = await Settings.findOne() || { currency: 'BDT' };
    const exchangeRate = settings.currency === 'BDT' ? 122.5 : 1.0;
    const numTotalNative = parseFloat(totalNative) || (numTotalUsd * exchangeRate);

    let linkedTxId = null;

    // If user wants to automatically record an expense against their Salary/Fund
    if (deductFromLedger && type === 'BUY') {
      let investCat = await Category.findOne({ name: { $regex: /invest|saving/i } });
      if (!investCat) {
        investCat = await Category.create({ 
          name: 'Savings & Invest', 
          type: 'Expense', 
          color: '#6366f1' 
        });
      }

      const tx = new Transaction({
        amount: Math.round(numTotalNative),
        type: 'Expense',
        category: investCat._id,
        status: 'Paid',
        fundSource: fundSource || 'Salary',
        notes: `Crypto Buy: ${numQty} ${cleanSymbol} ($${numTotalUsd.toFixed(2)}) ${notes ? '· ' + notes : ''}`.trim(),
        date: new Date(date),
      });
      await tx.save();
      linkedTxId = tx._id;
    }

    let holding = await CryptoHolding.findOne({ symbol: cleanSymbol });
    if (!holding) {
      holding = new CryptoHolding({
        symbol: cleanSymbol,
        name: name || cleanSymbol,
        coingeckoId: coingeckoId || '',
        totalQuantity: 0,
        avgBuyPriceUsd: 0,
        totalInvestedUsd: 0,
        totalInvestedNative: 0,
        isFavorite: true,
        isPinned: true,
        trades: [],
      });
    } else {
      holding.isFavorite = true;
      holding.isPinned = true;
    }

    // Add trade record
    holding.trades.push({
      type,
      quantity: numQty,
      priceUsd: numPrice,
      totalUsd: numTotalUsd,
      totalNative: numTotalNative,
      currency: settings.currency || 'BDT',
      fundSource: fundSource || '',
      linkedTransactionId: linkedTxId,
      notes: notes || '',
      date: new Date(date),
    });

    // Recalculate holding quantity and average cost
    if (type === 'BUY' || type === 'TRANSFER_IN' || type === 'STAKE_REWARD') {
      const prevTotalCost = holding.totalInvestedUsd;
      const prevQty = holding.totalQuantity;
      const newQty = prevQty + numQty;
      const newTotalCost = type === 'STAKE_REWARD' ? prevTotalCost : (prevTotalCost + numTotalUsd);
      
      holding.totalQuantity = newQty;
      holding.totalInvestedUsd = newTotalCost;
      holding.totalInvestedNative = holding.totalInvestedNative + numTotalNative;
      holding.avgBuyPriceUsd = newQty > 0 ? (newTotalCost / newQty) : numPrice;
    } else if (type === 'SELL') {
      const prevQty = holding.totalQuantity;
      const newQty = Math.max(0, prevQty - numQty);
      // Reduce total invested proportionally to quantity sold
      const costBasisSold = prevQty > 0 ? (holding.totalInvestedUsd * (numQty / prevQty)) : 0;
      holding.totalQuantity = newQty;
      holding.totalInvestedUsd = Math.max(0, holding.totalInvestedUsd - costBasisSold);
      holding.totalInvestedNative = Math.max(0, holding.totalInvestedNative - (costBasisSold * exchangeRate));
    }

    await holding.save();

    res.status(201).json({
      success: true,
      message: `Successfully logged ${type} trade for ${cleanSymbol}`,
      holding,
      linkedTransactionId: linkedTxId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/crypto/holding/:id/favorite - Toggle favorite/pinned status
router.patch('/holding/:id/favorite', async (req, res) => {
  try {
    const holding = await CryptoHolding.findById(req.params.id);
    if (!holding) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    holding.isFavorite = !holding.isFavorite;
    holding.isPinned = holding.isFavorite;
    await holding.save();
    res.json({ success: true, isFavorite: holding.isFavorite, isPinned: holding.isPinned });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/crypto/holding/:id - Directly adjust holding
router.put('/holding/:id', async (req, res) => {
  try {
    const { totalQuantity, avgBuyPriceUsd, totalInvestedUsd, name } = req.body;
    const holding = await CryptoHolding.findById(req.params.id);
    if (!holding) {
      return res.status(404).json({ message: 'Crypto holding not found' });
    }

    if (totalQuantity !== undefined) holding.totalQuantity = parseFloat(totalQuantity);
    if (avgBuyPriceUsd !== undefined) holding.avgBuyPriceUsd = parseFloat(avgBuyPriceUsd);
    if (totalInvestedUsd !== undefined) holding.totalInvestedUsd = parseFloat(totalInvestedUsd);
    if (name) holding.name = name;

    await holding.save();
    res.json({ success: true, message: 'Holding updated', holding });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/crypto/holding/:id - Remove holding
router.delete('/holding/:id', async (req, res) => {
  try {
    const holding = await CryptoHolding.findByIdAndDelete(req.params.id);
    if (!holding) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    res.json({ success: true, message: `Deleted ${holding.symbol} holding` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
