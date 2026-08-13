import React, { useMemo } from 'react';
import useStore from '../store/useStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Summary = () => {
  const { transactions, settings, categories } = useStore();

  const { totalIncome, totalExpense, balance, chartData } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const expenseByCategory = {};

    transactions.forEach(t => {
      if (t.type === 'Income') income += t.amount;
      else {
        expense += t.amount;
        const catName = t.category?.name || 'Uncategorized';
        expenseByCategory[catName] = (expenseByCategory[catName] || 0) + t.amount;
      }
    });

    const data = Object.keys(expenseByCategory).map(key => ({
      name: key,
      value: expenseByCategory[key],
      color: categories.find(c => c.name === key)?.color || '#8884d8'
    }));

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      chartData: data.sort((a, b) => b.value - a.value)
    };
  }, [transactions, categories]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-4 flex flex-col justify-between">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col">
          <span className="text-secondary-foreground text-sm font-medium mb-1">Total Balance</span>
          <span className={`text-4xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {settings.currency} {balance.toLocaleString()}
          </span>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex justify-between items-end">
          <div>
            <span className="text-secondary-foreground text-sm font-medium mb-1 block">Income</span>
            <span className="text-xl font-bold text-green-500">
              +{settings.currency} {totalIncome.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-secondary-foreground text-sm font-medium mb-1 block">Expenses</span>
            <span className="text-xl font-bold text-destructive">
              -{settings.currency} {totalExpense.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm md:col-span-2 flex flex-col items-center justify-center h-64">
        <h3 className="text-foreground font-semibold mb-2 self-start">Expenses by Category</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `${settings.currency} ${value.toLocaleString()}`} 
                contentStyle={{ borderRadius: '10px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--foreground)' }}/>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex items-center justify-center text-secondary-foreground text-sm">
            No expenses recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
