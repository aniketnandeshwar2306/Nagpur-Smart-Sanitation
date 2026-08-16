import React, { useState } from 'react';
import type { CitizenTab } from './types/citizen.types';
import DashboardHome from './components/DashboardHome';
import ReportWaste from './components/ReportWaste';
import MyComplaints from './components/MyComplaints';
import LiveTruckTracker from './components/LiveTruckTracker';
import WeeklySchedule from './components/WeeklySchedule';
import RewardsPanel from './components/RewardsPanel';
import SegregationGuide from './components/SegregationGuide';
import { TRANSLATIONS, type Language } from './utils/i18n';
import './citizen.css';

export const CitizenDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CitizenTab | 'tracker'>('home');
  const [lang, setLang] = useState<Language>('en');

  const t = TRANSLATIONS[lang];

  const navItems: { id: CitizenTab | 'tracker'; label: string; icon: string }[] = [
    { id: 'home', label: t.tabs.home, icon: '🏠' },
    { id: 'report', label: t.tabs.report, icon: '📸' },
    { id: 'myReports', label: t.tabs.myReports, icon: '📋' },
    { id: 'tracker', label: t.tabs.tracker, icon: '🚛' },
    { id: 'schedule', label: t.tabs.schedule, icon: '📅' },
    { id: 'rewards', label: t.tabs.rewards, icon: '🌿' },
    { id: 'learn', label: t.tabs.learn, icon: '♻️' },
  ];

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col relative font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-teal-400 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-sky-500/20">
              N
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent leading-tight">
                {t.portalTitle}
              </h1>
              <p className="text-xs text-slate-400 font-medium">{t.portalSubtitle}</p>
            </div>
          </div>

          {/* Desktop Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-sky-500/20 to-emerald-500/20 text-sky-400 border border-sky-500/30 shadow-sm scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }
                  `}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Language Switcher & Ward Badge */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              {(['en', 'mr', 'hi'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all uppercase ${
                    lang === l
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'mr' ? 'मराठी' : 'हिंदी'}
                </button>
              ))}
            </div>

            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t.wardBadge}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-12">
        {activeTab === 'home' && (
          <DashboardHome
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'report' && <ReportWaste />}
        {activeTab === 'myReports' && <MyComplaints />}
        {activeTab === 'tracker' && <LiveTruckTracker />}
        {activeTab === 'schedule' && <WeeklySchedule />}
        {activeTab === 'rewards' && <RewardsPanel />}
        {activeTab === 'learn' && <SegregationGuide />}
      </main>

      {/* Mobile Bottom Navigation Bar (hidden on md+ screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around z-40">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 relative
                ${isActive
                  ? 'text-sky-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              {isActive && (
                <div className="absolute inset-0 bg-sky-500/10 rounded-2xl border border-sky-500/20 citizen-fade-in-scale" />
              )}
              <span className="text-lg relative z-10">{item.icon}</span>
              <span className="text-[9px] tracking-tight relative z-10 mt-0.5">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CitizenDashboard;
