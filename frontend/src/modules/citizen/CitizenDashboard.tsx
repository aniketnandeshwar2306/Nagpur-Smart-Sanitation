import React, { useState } from 'react';
import type { CitizenTab } from './types/citizen.types';
import DashboardHome from './components/DashboardHome';
import ReportWaste from './components/ReportWaste';
import WeeklySchedule from './components/WeeklySchedule';
import RewardsPanel from './components/RewardsPanel';
import SegregationGuide from './components/SegregationGuide';
import './citizen.css';

export const CitizenDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CitizenTab>('home');

  const navItems: { id: CitizenTab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'report', label: 'Report', icon: '📸' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'rewards', label: 'Rewards', icon: '🌿' },
    { id: 'learn', label: 'Learn', icon: '♻️' },
  ];

  return (
    <div className="max-w-md mx-auto min-h-[85vh] bg-slate-950 text-slate-100 flex flex-col relative pb-20 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      {/* Top Bar Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-5 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md shadow-sky-500/20">
            N
          </div>
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent leading-tight">
              Nagpur SmartSanitation
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Citizen Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ward 14
          </span>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'home' && (
          <DashboardHome
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'report' && <ReportWaste />}
        {activeTab === 'schedule' && <WeeklySchedule />}
        {activeTab === 'rewards' && <RewardsPanel />}
        {activeTab === 'learn' && <SegregationGuide />}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around z-40 rounded-b-3xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 relative
                ${isActive
                  ? 'text-sky-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              {/* Active glow pill background */}
              {isActive && (
                <div className="absolute inset-0 bg-sky-500/10 rounded-2xl border border-sky-500/20 citizen-fade-in-scale" />
              )}
              <span className="text-xl relative z-10">{item.icon}</span>
              <span className="text-[10px] tracking-tight relative z-10 mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CitizenDashboard;
