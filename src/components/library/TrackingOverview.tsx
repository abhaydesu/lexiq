import { useState, useEffect } from 'react';
import type { BookMetadata } from '../../lib/storage';
import { getReadingGoal, setReadingGoal } from '../../lib/storage';
import { ReadingCalendar } from './ReadingCalendar';
import { Pencil, BookOpen } from 'lucide-react';
import { GlossyButton } from '../common/GlossyButton';

interface TrackingOverviewProps {
  books: BookMetadata[];
  activity: Record<string, number>;
}

export function TrackingOverview({ books, activity }: TrackingOverviewProps) {
  const [goal, setGoal] = useState<number | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [pacingTab, setPacingTab] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
  
  const finishedCount = books.filter(b => b.status === 'finished').length;

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = (now.getTime() - startOfYear.getTime()) + ((startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const expectedPacing = goal ? (dayOfYear / 365) * goal : 0;
  const isOnTrack = finishedCount >= expectedPacing;

  const remainingBooks = Math.max(0, goal ? goal - finishedCount : 0);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const remainingDays = Math.max(1, Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const remainingWeeks = remainingDays / 7;
  const remainingMonths = remainingDays / 30.4375;

  const monthlyPacing = remainingMonths > 0 ? remainingBooks / remainingMonths : 0;
  const weeklyPacing = remainingWeeks > 0 ? remainingBooks / remainingWeeks : 0;

  useEffect(() => {
    getReadingGoal().then(g => {
      setGoal(g);
      if (g) setInputValue(g.toString());
    });
  }, []);

  const handleGoalSubmit = async () => {
    const newGoal = parseInt(inputValue, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      setGoal(newGoal);
      await setReadingGoal(newGoal);
    } else if (goal !== null) {
      setInputValue(goal.toString());
    }
    setIsEditingGoal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGoalSubmit();
    if (e.key === 'Escape' && goal !== null) {
      setIsEditingGoal(false);
      setInputValue(goal.toString());
    }
  };

  // Find active book or fallback to most recent
  const activeBook = books
    .filter(b => b.status === 'reading')
    .sort((a, b) => (b.lastRead || 0) - (a.lastRead || 0))[0] 
    || books.sort((a, b) => (b.lastRead || b.addedAt) - (a.lastRead || a.addedAt))[0];

  return (
    <div className="flex flex-col gap-6 mb-12 animate-fade-in w-full">
      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          
          {/* Continue Reading Widget */}
          {activeBook && (
            <div className="w-full bg-ink-surface/30 border border-ink-border/50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-stretch shadow-sm relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-ink-accent/5 rounded-full blur-3xl pointer-events-none group-hover:bg-ink-accent/10 transition-colors duration-700" />
              
              <div className="w-32 md:w-40 shrink-0 shadow-lg rounded-md overflow-hidden relative group-hover:-translate-y-1 transition-transform duration-300">
                {activeBook.coverImage ? (
                  <img src={activeBook.coverImage} alt={activeBook.name} className="w-full h-full object-cover aspect-[2/3]" />
                ) : (
                  <div className="w-full h-full aspect-[2/3] bg-ink-text/5 flex items-center justify-center">
                    <BookOpen size={32} className="text-ink-text-muted/30" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col flex-1 justify-center w-full relative z-10 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <span className="text-ink-accent text-xs">✦</span>
                  <span className="text-xs font-medium text-ink-accent uppercase tracking-wider">Continue Reading</span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-serif text-ink-text mb-2 line-clamp-2">{activeBook.name.replace(/\.[^/.]+$/, "")}</h3>
                
                <div className="mt-auto pt-6">
                  <div className="flex items-center justify-between mb-2 text-xs font-medium text-ink-text-muted">
                    <span>Progress</span>
                    <span>{Math.round(activeBook.progress || 0)}%</span>
                  </div>
                  <div className="w-full bg-ink-bg/50 rounded-full h-2 mb-6 overflow-hidden border border-ink-border/30">
                    <div 
                      className="bg-ink-accent h-full rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${Math.max(activeBook.progress || 0, 2)}%` }}
                    >
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                  
                  <GlossyButton
                    to={`/read/${activeBook.id}`}
                    text="Resume Reading"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Reading Goal Card */}
          <div className="w-full bg-ink-surface/50 border border-ink-border/50 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ink-accent/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-700 ease-out" />
            
            <div className="flex items-center justify-between mb-3">
              <h3 className="editorial-title text-xl font-medium text-ink-text">Reading Goal</h3>
              {goal !== null && !isEditingGoal && (
                <button 
                  onClick={() => setIsEditingGoal(true)}
                  title="Edit Goal"
                  className="btn-press bg-ink-bg border border-ink-border/50 text-ink-accent p-2 rounded-full shadow-sm hover:bg-ink-surface/80 transition-colors"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
            
            {goal !== null && !isEditingGoal && (
              <div className="flex bg-ink-bg/50 p-1 rounded-full border border-ink-border/50 backdrop-blur-md mb-4 w-full max-w-[280px] mx-auto md:mx-0">
                {(['yearly', 'monthly', 'weekly'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setPacingTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all duration-300 capitalize ${
                      pacingTab === tab ? 'bg-ink-surface text-ink-text shadow-sm border border-ink-border/50' : 'text-ink-text-muted hover:text-ink-text'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex flex-col items-center md:items-start justify-center flex-1 py-2">
              {(!goal || isEditingGoal) ? (
                <div className="flex flex-col items-center md:items-start w-full animate-fade-in">
                   <input
                     type="number"
                     placeholder="e.g. 12"
                     value={inputValue}
                     onChange={e => setInputValue(e.target.value)}
                     onKeyDown={handleKeyDown}
                     autoFocus
                     className="bg-transparent border-b-2 border-ink-accent/50 focus:border-ink-accent outline-none text-center md:text-left text-4xl font-serif text-ink-text w-24 mb-4 transition-colors"
                   />
                   <button 
                     onClick={handleGoalSubmit}
                     className="px-4 py-2 bg-ink-text text-ink-bg rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                   >
                     Set Goal
                   </button>
                 </div>
              ) : (
                <div className="flex flex-col items-center md:items-start animate-fade-in w-full">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-serif text-ink-accent tracking-tight">
                      {pacingTab === 'yearly' && finishedCount}
                      {pacingTab === 'monthly' && monthlyPacing.toFixed(1)}
                      {pacingTab === 'weekly' && weeklyPacing.toFixed(1)}
                    </span>
                    <span className="text-2xl text-ink-text-muted/60 font-sans">
                      {pacingTab === 'yearly' && `of ${goal}`}
                      {pacingTab === 'monthly' && `/ mo`}
                      {pacingTab === 'weekly' && `/ wk`}
                    </span>
                  </div>
                  
                  <span className="text-sm font-medium text-ink-text-muted mb-5">
                    {pacingTab === 'yearly' ? 'Books finished this year' : 'Required pacing'}
                  </span>
                  
                  <div className={`inline-flex px-4 py-1.5 rounded-full text-xs font-medium border ${
                    remainingBooks === 0 
                      ? 'bg-ink-accent/10 text-ink-accent border-ink-accent/20'
                      : isOnTrack 
                        ? 'bg-ink-accent/10 text-ink-accent border-ink-accent/20' 
                        : 'bg-ink-text-muted/10 text-ink-text-muted border-ink-border/50'
                  }`}>
                    {remainingBooks === 0 ? '🎉 Goal Completed!' : (isOnTrack ? '✨ You are on track!' : 'Slightly behind schedule')}
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Streaks & Activity Card */}
          <div className="w-full bg-ink-surface/50 border border-ink-border/50 rounded-3xl p-6 shadow-sm flex flex-col h-full min-h-[380px]">
            <ReadingCalendar activity={activity} />
          </div>
        </div>
        
      </div>
    </div>
  );
}
