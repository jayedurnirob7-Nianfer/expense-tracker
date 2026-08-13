import React from 'react';
import { ChevronLeft, ChevronRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

const DebitCredit = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Month Selector */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between">
        <button className="p-1 hover:bg-secondary rounded-lg text-secondary-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-[15px]">{format(new Date(), 'MMMM yyyy')}</span>
        <button className="p-1 hover:bg-secondary rounded-lg text-secondary-foreground hover:text-foreground transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Credit Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowDownRight size={18} className="text-primary" />
              <h3 className="font-bold text-[15px]">Credit — money in</h3>
            </div>
            <span className="font-bold text-[15px] text-primary">$0.00</span>
          </div>

          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center min-h-[140px]">
            <h4 className="text-[15px] font-bold mb-2">No income this month</h4>
            <p className="text-sm text-secondary-foreground">Add a transaction to see your numbers come alive.</p>
          </div>
        </div>

        {/* Debit Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowUpRight size={18} className="text-destructive" />
              <h3 className="font-bold text-[15px]">Debit — costs & bills</h3>
            </div>
            <span className="font-bold text-[15px] text-foreground">$0.00</span>
          </div>

          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center text-center min-h-[140px]">
            <h4 className="text-[15px] font-bold mb-2">No expenses this month</h4>
            <p className="text-sm text-secondary-foreground">Add a transaction to see your numbers come alive.</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DebitCredit;
