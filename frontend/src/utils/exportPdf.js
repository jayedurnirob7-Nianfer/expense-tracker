import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const exportTransactionsToPDF = (transactions, currency = 'BDT') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Expense Manager Report', 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 30);
  
  const tableColumn = ["Date", "Description", "Category", "Subcategory", "Type", "Amount"];
  const tableRows = [];
  
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if(t.type === 'Income') totalIncome += Number(t.amount);
    else totalExpense += Number(t.amount);

    const transactionData = [
      format(new Date(t.date), 'PP'),
      t.notes || '-',
      t.category?.name || '-',
      t.subcategory?.name || '-',
      t.type,
      `${t.type === 'Expense' ? '-' : '+'}${currency} ${Number(t.amount).toLocaleString()}`
    ];
    tableRows.push(transactionData);
  });
  
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] }
  });

  const finalY = doc.lastAutoTable?.finalY || 40;
  doc.setFontSize(12);
  doc.text(`Total Income: ${currency} ${totalIncome.toLocaleString()}`, 14, finalY + 10);
  doc.text(`Total Expense: ${currency} ${totalExpense.toLocaleString()}`, 14, finalY + 16);
  doc.text(`Net Balance: ${currency} ${(totalIncome - totalExpense).toLocaleString()}`, 14, finalY + 22);
  
  doc.save(`expense-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportFundStatementToPDF = (fundDetail, timeScope = 'month', selectedMonth = new Date(), currency = 'BDT') => {
  const doc = new jsPDF();
  const dateStr = timeScope === 'month' ? format(new Date(selectedMonth), 'MMMM yyyy') : 'All-Time';

  // Title & Header Box
  doc.setFillColor(15, 23, 42); // Dark slate
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${fundDetail.name.toUpperCase()} FUND FINANCIAL STATEMENT`, 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Period: ${dateStr}  |  Generated: ${format(new Date(), 'PPpp')}`, 14, 30);

  // Financial Summary Cards Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 46, 182, 30, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL INFLOW (CREDIT)', 22, 56);
  doc.text('TOTAL SPENT (DEBIT)', 82, 56);
  doc.text('AVAILABLE BALANCE', 142, 56);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`+${currency} ${Number(fundDetail.inflow || 0).toLocaleString()}`, 22, 68);

  doc.setTextColor(239, 68, 68); // Red
  doc.text(`-${currency} ${Number(fundDetail.outflow || 0).toLocaleString()}`, 82, 68);

  const isOverspent = (fundDetail.balance || 0) < 0;
  if (isOverspent) doc.setTextColor(239, 68, 68);
  else doc.setTextColor(15, 23, 42);
  doc.text(`${currency} ${Number(fundDetail.balance || 0).toLocaleString()}`, 142, 68);

  // Table of Inflow & Outflow Transactions
  const allItems = [
    ...(fundDetail.incomes || []).map(t => ({ ...t, displayType: 'Income (Credit)' })),
    ...(fundDetail.expenses || []).map(t => ({ ...t, displayType: 'Expense (Debit)' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const tableColumn = ["Date", "Description / Note", "Category", "Flow Type", "Amount"];
  const tableRows = allItems.map(t => [
    format(new Date(t.date), 'MMM dd, yyyy'),
    t.notes || t.category?.name || '-',
    t.category?.name || 'Uncategorized',
    t.displayType,
    `${t.type === 'Income' ? '+' : '-'}${currency} ${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 84,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const finalY = doc.lastAutoTable?.finalY || 84;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Expense Manager • Automated Fund Source Statement`, 14, Math.min(285, finalY + 12));

  doc.save(`${fundDetail.name.toLowerCase()}-fund-statement-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportCryptoPortfolioToPDF = (summary, holdings, currency = 'BDT', exchangeRate = 122.5) => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CRYPTO & INVESTMENT PORTFOLIO REPORT', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Valuation Date: ${format(new Date(), 'PPpp')}  |  1 USD ≈ ${exchangeRate} ${currency}`, 14, 30);

  // Summary Metrics Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 48, 182, 32, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('PORTFOLIO VALUE', 20, 58);
  doc.text('TOTAL INVESTED', 78, 58);
  doc.text('TOTAL RETURN (P&L)', 136, 58);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`$${Number(summary.currentValueUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 20, 68);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`≈ ${currency} ${Number((summary.currentValueUsd || 0) * exchangeRate).toLocaleString()}`, 20, 74);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`$${Number(summary.totalInvestedUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 78, 68);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`≈ ${currency} ${Number((summary.totalInvestedUsd || 0) * exchangeRate).toLocaleString()}`, 78, 74);

  const isProfit = (summary.totalProfitLossUsd || 0) >= 0;
  doc.setFontSize(12);
  if (isProfit) doc.setTextColor(16, 185, 129);
  else doc.setTextColor(239, 68, 68);
  doc.text(`${isProfit ? '+' : ''}$${Number(summary.totalProfitLossUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} (${(summary.totalReturnPercent || 0).toFixed(2)}%)`, 136, 68);

  // Table of Holdings
  const tableColumn = ["Asset", "Quantity", "Avg Buy Price", "Current Price", "Current Worth", "Profit / Loss"];
  const tableRows = (holdings || []).map(h => [
    `${h.name} (${h.symbol})`,
    `${h.totalQuantity}`,
    `$${Number(h.avgBuyPriceUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    `$${Number(h.currentPriceUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    `$${Number(h.currentValueUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    `${(h.profitLossUsd || 0) >= 0 ? '+' : ''}$${Number(h.profitLossUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} (${(h.profitLossPercent || 0).toFixed(2)}%)`
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 88,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`crypto-portfolio-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
