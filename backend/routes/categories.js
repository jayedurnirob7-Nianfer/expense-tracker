const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

router.use(auth);

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().populate('parent');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a category
router.post('/', async (req, res) => {
  try {
    const { name, type, parent, budget, color } = req.body;
    const newCategory = new Category({ name, type, parent, budget, color });
    const saved = await newCategory.save();
    const populated = await Category.findById(saved._id).populate('parent');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('parent');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
