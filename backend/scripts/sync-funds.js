const mongoose = require('mongoose');
require('dotenv').config();

async function syncFunds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const incomeTxs = await mongoose.connection.collection('transactions').find({ type: 'Income' }).toArray();
    const validFundNames = new Set();

    for (const t of incomeTxs) {
      if (t.notes && t.notes.trim()) {
        validFundNames.add(t.notes.trim().toLowerCase());
      }
      if (t.category) {
        const cat = await mongoose.connection.collection('categories').findOne({ _id: t.category });
        if (cat && cat.name) {
          validFundNames.add(cat.name.trim().toLowerCase());
        }
      }
    }

    console.log('Active Credit Income Fund Names in Ledger:', Array.from(validFundNames));

    const expenses = await mongoose.connection.collection('transactions').find({ type: 'Expense' }).toArray();
    for (const exp of expenses) {
      if (exp.fundSource) {
        const trimmed = exp.fundSource.trim().toLowerCase();
        if (!validFundNames.has(trimmed) && trimmed !== 'miscellaneous') {
          await mongoose.connection.collection('transactions').updateOne(
            { _id: exp._id },
            { $set: { fundSource: 'Miscellaneous' } }
          );
          console.log(`Updated transaction "${exp.notes}" from "${exp.fundSource}" to "Miscellaneous"`);
        }
      }
    }

    console.log('Sync finished successfully.');
  } catch (err) {
    console.error('Error syncing funds:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

syncFunds();
