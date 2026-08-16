import React, { useEffect, useState } from 'react';
import type { ReportResponse, RewardProfile, ScheduleDay } from '../types/citizen.types';
import { fetchReports, fetchRewards, fetchSchedule } from '../api/citizenApi';

interface DashboardHomeProps {
  onNavigate: (tab: 'report' | 'schedule' | 'rewards' | 'learn') => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [rewards, setRewards] = useState<RewardProfile | null>(null);
  const [nextPickup, setNextPickup] = useState<ScheduleDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [reps, rew, sched] = await Promise.all([
          fetchReports(),
          fetchRewards(),
          fetchSchedule(),
        ]);
        setReports(reps);
        setRewards(rew);
        const todayOrNext = sched.find(s => s.is_today) || sched.find(s => s.waste_type !== '—') || null;
        setNextPickup(todayOrNext);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeReports = reports.filter(r => r.status !== 'resolved').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

  const wasteTypeIcon: Record<string, string> = {
    wet: '🥬', dry: '📦', hazardous: '☢️', 'e-waste': '🔌', mixed: '♻️', '—': '🚫',
  };

  const statusColor: Record<string, string> = {
    submitted: 'text-amber-400',
    in_progress: 'text-sky-400',
    resolved: 'text-emerald-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="citizen-fade-in space-y-5 pb-4">
      {/* Greeting */}
      <div className="px-1">
        <h2 className="text-2xl font-bold text-white">
          Namaste! 🙏
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Welcome to Nagpur SmartSanitation — your clean city partner.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 citizen-stagger">
        {/* Active Reports */}
        <button
          onClick={() => onNavigate('report')}
          className="bg-gradient-to-br from-amber-500/15 to-orange-600/10 border border-amber-500/20 rounded-2xl p-4 text-left transition-all hover:border-amber-400/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="text-2xl mb-2">🚨</div>
          <div className="text-3xl font-extrabold text-amber-400 citizen-count-pulse">{activeReports}</div>
          <div className="text-xs text-slate-400 mt-1">Active Reports</div>
        </button>

        {/* Resolved */}
        <button
          onClick={() => onNavigate('report')}
          className="bg-gradient-to-br from-emerald-500/15 to-green-600/10 border border-emerald-500/20 rounded-2xl p-4 text-left transition-all hover:border-emerald-400/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="text-2xl mb-2">✅</div>
          <div className="text-3xl font-extrabold text-emerald-400">{resolvedReports}</div>
          <div className="text-xs text-slate-400 mt-1">Resolved</div>
        </button>

        {/* GreenPoints */}
        <button
          onClick={() => onNavigate('rewards')}
          className="bg-gradient-to-br from-sky-500/15 to-cyan-600/10 border border-sky-500/20 rounded-2xl p-4 text-left transition-all hover:border-sky-400/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="text-2xl mb-2">🌿</div>
          <div className="text-3xl font-extrabold text-sky-400 citizen-count-pulse">
            {rewards?.total_points ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">GreenPoints</div>
        </button>

        {/* Streak */}
        <button
          onClick={() => onNavigate('rewards')}
          className="bg-gradient-to-br from-rose-500/15 to-pink-600/10 border border-rose-500/20 rounded-2xl p-4 text-left transition-all hover:border-rose-400/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="text-2xl mb-2">🔥</div>
          <div className="text-3xl font-extrabold text-rose-400">{rewards?.streak_days ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">Day Streak</div>
        </button>
      </div>

      {/* Next Pickup Card */}
      {nextPickup && (
        <button
          onClick={() => onNavigate('schedule')}
          className="w-full citizen-slide-up bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-emerald-500/10 border border-sky-500/20 rounded-2xl p-4 text-left transition-all hover:border-sky-400/40"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-sky-400 font-semibold uppercase tracking-wider mb-1">
                {nextPickup.is_today ? '📍 Today\'s Pickup' : '📅 Next Pickup'}
              </div>
              <div className="text-white font-bold text-lg">{nextPickup.day}</div>
              <div className="text-slate-400 text-sm">
                {wasteTypeIcon[nextPickup.waste_type] || '♻️'} {nextPickup.waste_type.charAt(0).toUpperCase() + nextPickup.waste_type.slice(1)} Waste
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-300">{nextPickup.time_window}</div>
              <div className="text-xs text-slate-500 mt-1">{nextPickup.zone}</div>
            </div>
          </div>
        </button>
      )}

      {/* Quick Action — Report */}
      <button
        onClick={() => onNavigate('report')}
        className="w-full citizen-pulse-glow bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold rounded-2xl py-4 px-6 flex items-center justify-center gap-3 text-lg shadow-lg shadow-sky-500/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="text-2xl">📸</span>
        Report Waste Now
      </button>

      {/* Recent Reports */}
      {reports.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Recent Reports
          </h3>
          <div className="space-y-2 citizen-stagger">
            {reports.slice(0, 3).map(r => (
              <div
                key={r.ticket_id}
                className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 flex items-center justify-between citizen-card-lift"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{wasteTypeIcon[r.waste_type] || '🗑️'}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{r.ticket_id}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[180px]">
                      {r.description || r.waste_type + ' waste'}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-semibold capitalize ${statusColor[r.status] || 'text-slate-400'}`}>
                  {r.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learn Segregation CTA */}
      <button
        onClick={() => onNavigate('learn')}
        className="w-full bg-gradient-to-r from-emerald-500/10 to-amber-500/10 border border-emerald-500/20 rounded-2xl p-4 text-left transition-all hover:border-emerald-400/40 flex items-center gap-4"
      >
        <span className="text-3xl">♻️</span>
        <div>
          <div className="font-bold text-white">Learn Waste Segregation</div>
          <div className="text-xs text-slate-400">Wet vs. Dry — quick quiz &amp; visual guide</div>
        </div>
        <svg className="w-5 h-5 text-slate-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default DashboardHome;
