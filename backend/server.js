const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const transactionsRoutes = require('./routes/transactions');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/settings', settingsRoutes);

// Seed function
const seedDefaultData = async () => {
  try {
    const Category = require('./models/Category');
    const Settings = require('./models/Settings');
    
    const count = await Category.countDocuments();
    if (count === 0) {
      const defaults = [
        { name: 'Salary', type: 'Income', color: '#10b981' },
        { name: 'Freelance', type: 'Income', color: '#3b82f6' },
        { name: 'Food & Dining', type: 'Expense', color: '#f59e0b', budget: 500 },
        { name: 'Housing & Utilities', type: 'Expense', color: '#ef4444', budget: 1200 },
        { name: 'Entertainment', type: 'Expense', color: '#8b5cf6', budget: 300 },
        { name: 'Transport', type: 'Expense', color: '#ec4899', budget: 200 },
      ];
      await Category.insertMany(defaults);
      console.log('Seeded default categories');
    }

    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({ currency: 'BDT', theme: 'dark' });
      console.log('Seeded default settings');
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  }
};

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense-tracker';
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('Connected to MongoDB');
    await seedDefaultData();
  } catch (err) {
    console.warn('Local MongoDB connection failed:', err.message);
    console.log('Starting in-memory MongoDB server fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('Connected to In-Memory MongoDB');
      await seedDefaultData();
    } catch (memErr) {
      console.error('Failed to start in-memory MongoDB:', memErr);
    }
  }
};

connectDB();

// For local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel Serverless Functions
module.exports = app;
