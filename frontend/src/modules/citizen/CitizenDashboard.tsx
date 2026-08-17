import React from 'react';
import type { CitizenTab } from './types/citizen.types';
import DashboardHome from './components/DashboardHome';
import ReportWaste from './components/ReportWaste';
import MyComplaints from './components/MyComplaints';
import LiveTruckTracker from './components/LiveTruckTracker';
import WeeklySchedule from './components/WeeklySchedule';
import RewardsPanel from './components/RewardsPanel';
import SegregationGuide from './components/SegregationGuide';
import './citizen.css';

interface CitizenDashboardProps {
  activeTab?: string;
  onNavigate?: (tab: string) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  activeTab: propTab = 'overview',
  onNavigate,
}) => {
  // Map App.tsx route tabs to Citizen component tabs
  const getTab = (): CitizenTab | 'tracker' => {
    if (propTab === 'report') return 'report';
    if (propTab === 'myReports') return 'myReports';
    if (propTab === 'tracker') return 'tracker';
    if (propTab === 'schedule') return 'schedule';
    if (propTab === 'rewards') return 'rewards';
    if (propTab === 'learn') return 'learn';
    return 'home';
  };

  const currentTab = getTab();

  return (
    <div className="w-full min-h-screen text-[#1A2E22] dark:text-slate-100 flex flex-col relative font-sans eco-animate-fade">
      {/* Main Container without redundant top navbar */}
      <main className="flex-1 max-w-7xl mx-auto w-full py-4 md:py-6">
        {currentTab === 'home' && (
          <DashboardHome
            onNavigate={(tab) => onNavigate?.(tab)}
          />
        )}
        {currentTab === 'report' && <ReportWaste />}
        {currentTab === 'myReports' && <MyComplaints />}
        {currentTab === 'tracker' && <LiveTruckTracker />}
        {currentTab === 'schedule' && <WeeklySchedule />}
        {currentTab === 'rewards' && <RewardsPanel />}
        {currentTab === 'learn' && <SegregationGuide />}
      </main>
    </div>
  );
};

export default CitizenDashboard;
