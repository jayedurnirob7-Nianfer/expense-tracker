const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['BUY', 'SELL', 'TRANSFER_IN', 'STAKE_REWARD'], 
    default: 'BUY' 
  },
  quantity: { type: Number, required: true },
  priceUsd: { type: Number, required: true },
  totalUsd: { type: Number, required: true },
  totalNative: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  fundSource: { type: String, default: '' },
  linkedTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
  notes: { type: String, default: '' },
  date: { type: Date, default: Date.now },
}, { _id: true, timestamps: true });

const cryptoHoldingSchema = new mongoose.Schema({
  symbol: { 
    type: String, 
    required: true, 
    uppercase: true, 
    trim: true,
    unique: true 
  }, // e.g. BTC, ETH, SOL, USDT
  name: { type: String, required: true, trim: true }, // e.g. Bitcoin, Ethereum
  coingeckoId: { type: String, default: '' }, // e.g. bitcoin, ethereum, solana
  category: { type: String, enum: ['Crypto', 'Stock', 'Commodity', 'Gold'], default: 'Crypto' },
  totalQuantity: { type: Number, required: true, default: 0 },
  avgBuyPriceUsd: { type: Number, required: true, default: 0 },
  totalInvestedUsd: { type: Number, required: true, default: 0 },
  totalInvestedNative: { type: Number, default: 0 },
  isFavorite: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: true },
  trades: [tradeSchema],
}, { timestamps: true });

module.exports = mongoose.model('CryptoHolding', cryptoHoldingSchema);
