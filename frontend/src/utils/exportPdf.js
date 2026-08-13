import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const exportTransactionsToPDF = (transactions, currency) => {
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
    if(t.type === 'Income') totalIncome += t.amount;
    else totalExpense += t.amount;

    const transactionData = [
      format(new Date(t.date), 'PP'),
      t.notes || '-',
      t.category?.name || '-',
      t.subcategory?.name || '-',
      t.type,
      `${t.type === 'Expense' ? '-' : '+'}${currency} ${t.amount}`
    ];
    tableRows.push(transactionData);
  });
  
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  const finalY = doc.lastAutoTable.finalY || 40;
  doc.setFontSize(12);
  doc.text(`Total Income: ${currency} ${totalIncome}`, 14, finalY + 10);
  doc.text(`Total Expense: ${currency} ${totalExpense}`, 14, finalY + 16);
  doc.text(`Net Balance: ${currency} ${totalIncome - totalExpense}`, 14, finalY + 22);
  
  doc.save(`expense-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
