/**
 * Resolves the fund source for a debit/expense transaction.
 * A fund source is ONLY valid if an actual Credit (Income) transaction exists for it in the ledger.
 * If no matching Credit transaction exists (e.g. Shipment was deleted or uncredited),
 * it returns 'Miscellaneous'.
 */
export const resolveFundSource = (fundSource, transactions = []) => {
  if (!fundSource || !fundSource.trim()) return 'Miscellaneous';

  const trimmed = fundSource.trim();
  if (trimmed.toLowerCase() === 'miscellaneous' || trimmed.toLowerCase() === 'misc') {
    return 'Miscellaneous';
  }

  const activeIncomeFunds = new Set();

  // Collect ONLY from actual Income (Credit) transactions present in the ledger
  transactions.forEach((t) => {
    if (t.type === 'Income') {
      if (t.notes?.trim()) activeIncomeFunds.add(t.notes.trim().toLowerCase());
      if (t.category?.name?.trim()) activeIncomeFunds.add(t.category.name.trim().toLowerCase());
    }
  });

  if (activeIncomeFunds.has(trimmed.toLowerCase())) {
    return trimmed;
  }

  return 'Miscellaneous';
};

/**
 * Returns available fund options for selection dropdowns.
 */
export const getAvailableFundOptions = (transactions = [], categories = [], currentCustomFunds = []) => {
  const creditTransactionFunds = transactions
    .filter((t) => t.type === 'Income')
    .map((t) => t.notes?.trim() || t.category?.name?.trim())
    .filter(Boolean);

  const baseFunds = [
    ...creditTransactionFunds,
    'Salary',
    'Miscellaneous',
    ...currentCustomFunds
  ];

  return Array.from(new Set(baseFunds)).filter(Boolean);
};

/**
 * Computes a complete fund-by-fund financial summary:
 * - How much came into each fund (Inflow / Credit)
 * - How much was spent from each fund (Outflow / Debit)
 * - Remaining balance for each fund
 * - Percentage of fund spent / burn rate
 */
export const computeFundBreakdown = (transactions = []) => {
  const fundMap = {};

  const ensureFund = (name) => {
    const key = name.trim();
    if (!fundMap[key]) {
      fundMap[key] = {
        name: key,
        inflow: 0,
        outflow: 0,
        incomes: [],
        expenses: [],
      };
    }
    return fundMap[key];
  };

  // Ensure default primary funds exist if there are transactions
  ensureFund('Salary');

  // Process all transactions
  transactions.forEach((t) => {
    const amount = Number(t.amount) || 0;

    if (t.type === 'Income') {
      // Income fund name from notes or category
      const fundName = t.notes?.trim() || t.category?.name?.trim() || 'Salary';
      const record = ensureFund(fundName);
      record.inflow += amount;
      record.incomes.push(t);
    } else if (t.type === 'Expense' && t.status === 'Paid') {
      // Expense paid from fundSource
      const rawFund = t.fundSource?.trim() || 'Salary';
      const resolvedFund = resolveFundSource(rawFund, transactions);
      const record = ensureFund(resolvedFund);
      record.outflow += amount;
      record.expenses.push(t);
    }
  });

  // Calculate remaining balances, percentages, and status
  const breakdown = Object.values(fundMap)
    .filter((f) => f.inflow > 0 || f.outflow > 0 || f.name === 'Salary')
    .map((f) => {
      const balance = f.inflow - f.outflow;
      const spentPercent = f.inflow > 0 ? Math.min(100, Math.round((f.outflow / f.inflow) * 100)) : (f.outflow > 0 ? 100 : 0);
      const isOverspent = balance < 0;
      const allItems = [...(f.incomes || []), ...(f.expenses || [])].sort((a, b) => {
        const timeA = new Date(a.date || 0).getTime();
        const timeB = new Date(b.date || 0).getTime();
        return timeB - timeA;
      });

      return {
        ...f,
        balance,
        spentPercent,
        isOverspent,
        items: allItems,
        totalTransactions: allItems.length,
      };
    })
    .sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow));

  return breakdown;
};
