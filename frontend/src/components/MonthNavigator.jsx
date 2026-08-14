import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import { format, setMonth, setYear, getYear, getMonth } from 'date-fns';
import useStore from '../store/useStore';

const MonthNavigator = () => {
  const { selectedMonth, setSelectedMonth, prevMonth, nextMonth } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(getYear(selectedMonth || new Date()));
  const popoverRef = useRef(null);

  // Sync viewYear when selectedMonth changes
  useEffect(() => {
    if (selectedMonth) {
      setViewYear(getYear(selectedMonth));
    }
  }, [selectedMonth]);

  // Click outside listener to dismiss popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const months = [
    { fullName: 'January', index: 0 },
    { fullName: 'February', index: 1 },
    { fullName: 'March', index: 2 },
    { fullName: 'April', index: 3 },
    { fullName: 'May', index: 4 },
    { fullName: 'June', index: 5 },
    { fullName: 'July', index: 6 },
    { fullName: 'August', index: 7 },
    { fullName: 'September', index: 8 },
    { fullName: 'October', index: 9 },
    { fullName: 'November', index: 10 },
    { fullName: 'December', index: 11 },
  ];

  const handleSelectMonth = (monthIndex) => {
    let target = new Date(selectedMonth);
    target = setYear(target, viewYear);
    target = setMonth(target, monthIndex);
    setSelectedMonth(target);
    setIsOpen(false);
  };

  const handleCurrentMonthJump = () => {
    const now = new Date();
    setSelectedMonth(now);
    setViewYear(getYear(now));
    setIsOpen(false);
  };

  const isCurrentRealMonth = (monthIndex) => {
    const now = new Date();
    return getYear(now) === viewYear && getMonth(now) === monthIndex;
  };

  const isSelectedMonth = (monthIndex) => {
    return getYear(selectedMonth) === viewYear && getMonth(selectedMonth) === monthIndex;
  };

  return (
    <div className="relative">
      <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-sm flex items-center justify-between">
        <button 
          type="button"
          onClick={prevMonth}
          className="p-2 hover:bg-secondary rounded-xl text-secondary-foreground hover:text-foreground transition-colors"
          title="Previous Month"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Clickable Month Name */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl hover:bg-secondary/70 text-foreground transition-all group cursor-pointer focus:outline-none"
          title="Click to select month"
        >
          <Calendar size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-[15px] group-hover:text-emerald-400 transition-colors">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <ChevronDown size={15} className={`text-secondary-foreground group-hover:text-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
        </button>

        <button 
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-secondary rounded-xl text-secondary-foreground hover:text-foreground transition-colors"
          title="Next Month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Month Selection Popover Modal */}
      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-80 sm:w-96 bg-[#0e1621] border border-[#1e293b] rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-foreground"
        >
          {/* Year Switcher Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
            <button
              type="button"
              onClick={() => setViewYear(prev => prev - 1)}
              className="p-1.5 hover:bg-[#131d2b] rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Previous Year"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-wide">{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={() => setViewYear(prev => prev + 1)}
              className="p-1.5 hover:bg-[#131d2b] rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Next Year"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((m) => {
              const selected = isSelectedMonth(m.index);
              const isCurrent = isCurrentRealMonth(m.index);
              return (
                <button
                  key={m.index}
                  type="button"
                  onClick={() => handleSelectMonth(m.index)}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all relative flex flex-col items-center justify-center ${
                    selected
                      ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-[#131d2b] text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent hover:border-[#1e293b]'
                  }`}
                >
                  <span>{m.fullName}</span>
                  {isCurrent && !selected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Jump */}
          <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between">
            <button
              type="button"
              onClick={handleCurrentMonthJump}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Jump to This Month
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthNavigator;
