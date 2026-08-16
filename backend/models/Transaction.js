const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  tags: [{ type: String }],
  notes: { type: String, default: '' },
  isRecurring: { type: Boolean, default: false },
  isEssential: { type: Boolean, default: false },
  fundSource: { type: String, default: 'Salary' },
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Paid' },
  receiptImage: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
