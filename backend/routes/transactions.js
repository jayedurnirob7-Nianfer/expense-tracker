const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

router.use(auth);

// Get all transactions with filtering
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, category, status } = req.query;
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) query.category = category;
    if (status) query.status = status;
    
    const transactions = await Transaction.find(query)
      .populate('category')
      .populate('subcategory')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a transaction
router.post('/', async (req, res) => {
  try {
    const newTx = new Transaction(req.body);
    const saved = await newTx.save();
    const populated = await Transaction.findById(saved._id).populate('category').populate('subcategory');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a transaction
router.put('/:id', async (req, res) => {
  try {
    const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('category')
      .populate('subcategory');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a transaction
router.delete('/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
