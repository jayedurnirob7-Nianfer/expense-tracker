const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  currency: { type: String, default: 'BDT' },
  theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
