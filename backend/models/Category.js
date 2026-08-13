const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  budget: { type: Number, default: 0 },
  color: { type: String, default: '#8884d8' },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
