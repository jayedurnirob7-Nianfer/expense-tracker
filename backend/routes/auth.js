const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Setup first user
router.post('/setup', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(400).json({ message: 'User already set up' });
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    const user = new User({ password });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ message: 'No user found. Please run setup.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' } 
    );
    res.json({ token, isSetup: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-setup', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ isSetup: userCount > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
