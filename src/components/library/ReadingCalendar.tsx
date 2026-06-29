import { useState, useMemo } from 'react';
import { Share, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReadingCalendarProps {
  activity: Record<string, number>;
}

export function ReadingCalendar({ activity }: ReadingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Calculate streaks
  const { bestStreak, bestStreakStartDate } = useMemo(() => {
    const dates = Object.keys(activity).sort();
    let maxStreak = 0;
    let currStreak = 0;
    let bestStart = "";
    let tempStart = "";
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currStreak = 1;
        tempStart = dates[i];
      } else {
        const d1 = new Date(dates[i - 1]);
        const d2 = new Date(dates[i]);
        const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currStreak++;
        } else if (diffDays > 1) {
          currStreak = 1;
          tempStart = dates[i];
        }
      }
      
      if (currStreak > maxStreak) {
        maxStreak = currStreak;
        bestStart = tempStart;
      }
    }
    
    // Check if current streak extends to today or yesterday
    let activeStreak = 0;
    if (dates.length > 0) {
      const today = new Date();
      const lastDate = new Date(dates[dates.length - 1]);
      const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        activeStreak = currStreak;
      }
    }
    
    return { bestStreak: maxStreak, currentStreak: activeStreak, bestStreakStartDate: bestStart };
  }, [activity]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const setSpecificMonth = (m: number) => {
    setCurrentDate(new Date(year, m, 1));
  };

  const renderGrid = () => {
    const grid = [];
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Header
    const header = (
      <div key="header" className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-ink-text-muted/60">
            {d}
          </div>
        ))}
      </div>
    );
    grid.push(header);
    
    // Days
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square rounded-md bg-transparent" />);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasActivity = activity[dateStr] > 0;
      
      const now = new Date();
      const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const isToday = localTodayStr === dateStr;
      
      days.push(
        <div 
          key={i} 
          className={`aspect-square rounded-md flex items-center justify-center text-xs transition-all
            ${hasActivity ? 'bg-ink-accent text-white shadow-sm font-medium' : 'bg-ink-surface/50 text-ink-text-muted border border-ink-border/30'}
            ${isToday && !hasActivity ? 'border-ink-accent/50 text-ink-accent' : ''}
          `}
          title={hasActivity ? `${dateStr}: ${activity[dateStr].toFixed(1)} minutes` : dateStr}
        >
          {i}
        </div>
      );
    }
    
    grid.push(
      <div key="grid" className="grid grid-cols-7 gap-1">
        {days}
      </div>
    );
    
    return grid;
  };

  // Generate 5 months to show in pills around current month
  const getMonthPills = () => {
    const pills = [];
    for (let i = -2; i <= 2; i++) {
      let m = month + i;
      let y = year;
      if (m < 0) {
        m += 12;
        y -= 1;
      } else if (m > 11) {
        m -= 12;
        y += 1;
      }
      pills.push({ month: m, year: y, name: monthNames[m] });
    }
    return pills;
  };

  const formatInsightDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()} ${monthNames[d.getMonth()]}`;
  };

  return (
    <div className="flex flex-col animate-fade-in w-full h-full">
      {/* Top Section */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-medium text-ink-text-muted">Best reading streak</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-4xl font-serif text-ink-accent">{bestStreak}</span>
            <span className="text-xs font-medium text-ink-text-muted">day{bestStreak !== 1 ? 's' : ''} so far this year</span>
          </div>
        </div>
        <button className="p-2 rounded-full bg-ink-surface/50 border border-ink-border/50 text-ink-text hover:bg-ink-surface transition-colors shadow-sm">
          <Share size={16} />
        </button>
      </div>

      {/* Month Selection */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-ink-surface text-ink-text-muted transition-colors">
          <ChevronLeft size={14} />
        </button>
        
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 px-2">
          {getMonthPills().map((pill, idx) => (
            <button
              key={idx}
              onClick={() => setSpecificMonth(pill.month)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                pill.month === month && pill.year === year
                  ? 'bg-ink-accent text-white shadow-md' 
                  : 'bg-ink-surface/50 text-ink-text-muted hover:bg-ink-surface hover:text-ink-text'
              }`}
            >
              {pill.name}
            </button>
          ))}
        </div>
        
        <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-ink-surface text-ink-text-muted transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 mb-4 max-w-[280px] mx-auto w-full">
        {renderGrid()}
      </div>

      {/* Legend & Insight */}
      <div className="mt-auto">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-ink-accent" />
            <span className="text-[10px] font-medium text-ink-text-muted">Days read</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-ink-surface border border-ink-border/50" />
            <span className="text-[10px] font-medium text-ink-text-muted">No reading</span>
          </div>
        </div>

        {bestStreak > 0 && (
          <div className="bg-ink-surface/30 border border-ink-border/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-ink-accent text-xs">✦</span>
              <span className="text-xs font-medium text-ink-accent">Reader insight</span>
            </div>
            <p className="text-xs text-ink-text leading-relaxed">
              Longest reading streak began on <span className="font-medium">{formatInsightDate(bestStreakStartDate)}</span> and lasted <span className="font-medium">{bestStreak} day{bestStreak !== 1 ? 's' : ''}</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
