import React from 'react';
import type { WorkerStats } from '../types';

interface WorkerHeaderProps {
  stats: WorkerStats;
  language: 'en' | 'mr' | 'hi';
  onLanguageChange: (lang: 'en' | 'mr' | 'hi') => void;
  onOpenSafetyChecklist: () => void;
  isOnline: boolean;
}

export const WorkerHeader: React.FC<WorkerHeaderProps> = ({
  stats,
  language,
  onLanguageChange,
  onOpenSafetyChecklist,
  isOnline
}) => {
  const getGreeting = () => {
    if (language === 'mr') return 'शुभ प्रभात, ';
    if (language === 'hi') return 'सुप्रभात, ';
    return 'Good Morning, ';
  };

  const getRoleTitle = () => {
    if (language === 'mr') return 'स्वच्छता दूत • नागपूर महानगरपालिका';
    if (language === 'hi') return 'स्वच्छता दूत • नागपुर नगर निगम';
    return 'Sanitation Field Officer • NMC Nagpur';
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top Row: Worker info & Utility controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Worker Avatar & Badge */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 shadow-md flex items-center justify-center text-slate-950 font-bold text-lg">
                <span>RR</span>
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
                title={isOnline ? 'Live GPS Connected' : 'Offline Mode'}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-100 text-base leading-tight">
                  <span className="text-slate-400 font-normal text-xs">{getGreeting()}</span>
                  {stats.worker_name}
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  {stats.worker_id}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {getRoleTitle()} • <span className="text-amber-400">{stats.zone_assigned}</span>
              </p>
            </div>
          </div>

          {/* Language & Safety Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  language === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('mr')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  language === 'mr'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  language === 'hi'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Safety SOP Button */}
            <button
              onClick={onOpenSafetyChecklist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all active:scale-95"
              title="Daily Safety & PPE Checklist"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="hidden sm:inline">
                {language === 'mr' ? 'सुरक्षा सूची' : language === 'hi' ? 'सुरक्षा चेकलिस्ट' : 'Safety SOP'}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Metric Strip */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/60 text-center">
          <div className="bg-slate-800/40 rounded-lg p-1.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {language === 'mr' ? 'पूर्ण' : language === 'hi' ? 'पूर्ण' : 'Done'}
            </span>
            <span className="text-sm font-bold text-emerald-400">
              {stats.completed_today}/{stats.total_assigned_today}
            </span>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-1.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {language === 'mr' ? 'प्रलंबित' : language === 'hi' ? 'लंबित' : 'Pending'}
            </span>
            <span className="text-sm font-bold text-amber-400">
              {stats.pending_today}
            </span>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-1.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {language === 'mr' ? 'वर्गीकरण' : language === 'hi' ? 'शुद्धता' : 'AI Purity'}
            </span>
            <span className="text-sm font-bold text-sky-400">
              {stats.avg_segregation_accuracy}%
            </span>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-1.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {language === 'mr' ? 'प्रोत्साहन' : language === 'hi' ? 'प्रोत्साहन' : 'Incentive'}
            </span>
            <span className="text-sm font-bold text-lime-400">
              ₹{stats.daily_incentive_earned_inr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
