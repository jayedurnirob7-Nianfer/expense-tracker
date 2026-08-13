import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';

const Bills = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      
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

      {/* Essential Bills Summary */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">Essential bills</h3>
          <p className="text-sm text-secondary-foreground mb-1">$0.00 paid of $0.00</p>
          <p className="text-[13px] text-secondary-foreground/70">Cycle: {format(new Date(), 'MMMM yyyy')} · resets on the 10th</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
          <Plus size={16} />
          <span>Add bill</span>
        </button>
      </div>

      {/* Bills List / Empty State */}
      <div className="bg-card rounded-2xl p-10 border border-border shadow-sm flex flex-col items-center justify-center text-center mt-2">
        <h4 className="text-base font-bold mb-1.5">No bills yet</h4>
        <p className="text-sm text-secondary-foreground">Add rent, utilities or subscriptions to track what must be paid.</p>
      </div>

    </div>
  );
};

export default Bills;
