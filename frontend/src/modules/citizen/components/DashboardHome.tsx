import React, { useEffect, useState } from 'react';
import type { ReportResponse, RewardProfile, ScheduleDay } from '../types/citizen.types';
import { fetchReports, fetchRewards, fetchSchedule } from '../api/citizenApi';

interface DashboardHomeProps {
  onNavigate: (tab: 'report' | 'myReports' | 'schedule' | 'rewards' | 'learn') => void;
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
    submitted: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    in_progress: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="citizen-fade-in space-y-6 pb-6">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Namaste, Nagpur Citizen! 🙏
          </h2>
          <p className="text-slate-400 text-sm md:text-base mt-1.5 max-w-xl">
            Welcome to Nagpur SmartSanitation. Report waste issues, track your pickup schedule, earn GreenPoints, and keep Nagpur clean.
          </p>
        </div>
        <button
          onClick={() => onNavigate('report')}
          className="citizen-pulse-glow bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-extrabold rounded-2xl py-3.5 px-6 flex items-center justify-center gap-3 text-base shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.03] active:scale-[0.98] self-start md:self-auto"
        >
          <span className="text-xl">📸</span>
          Report Waste Now
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 citizen-stagger">
        {/* Active Reports */}
        <button
          onClick={() => onNavigate('myReports')}
          className="bg-gradient-to-br from-amber-500/15 to-orange-600/10 border border-amber-500/20 rounded-2xl p-5 text-left transition-all hover:border-amber-400/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="text-3xl mb-2">🚨</div>
          <div className="text-3xl md:text-4xl font-extrabold text-amber-400 citizen-count-pulse">{activeReports}</div>
          <div className="text-xs md:text-sm text-slate-400 mt-1 font-medium">Active Reports</div>
        </button>

        {/* Resolved */}
        <button
          onClick={() => onNavigate('myReports')}
          className="bg-gradient-to-br from-emerald-500/15 to-green-600/10 border border-emerald-500/20 rounded-2xl p-5 text-left transition-all hover:border-emerald-400/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl md:text-4xl font-extrabold text-emerald-400">{resolvedReports}</div>
          <div className="text-xs md:text-sm text-slate-400 mt-1 font-medium">Resolved Issues</div>
        </button>

        {/* GreenPoints */}
        <button
          onClick={() => onNavigate('rewards')}
          className="bg-gradient-to-br from-sky-500/15 to-cyan-600/10 border border-sky-500/20 rounded-2xl p-5 text-left transition-all hover:border-sky-400/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="text-3xl mb-2">🌿</div>
          <div className="text-3xl md:text-4xl font-extrabold text-sky-400 citizen-count-pulse">
            {rewards?.total_points ?? 0}
          </div>
          <div className="text-xs md:text-sm text-slate-400 mt-1 font-medium">GreenPoints</div>
        </button>

        {/* Streak */}
        <button
          onClick={() => onNavigate('rewards')}
          className="bg-gradient-to-br from-rose-500/15 to-pink-600/10 border border-rose-500/20 rounded-2xl p-5 text-left transition-all hover:border-rose-400/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="text-3xl mb-2">🔥</div>
          <div className="text-3xl md:text-4xl font-extrabold text-rose-400">{rewards?.streak_days ?? 0}</div>
          <div className="text-xs md:text-sm text-slate-400 mt-1 font-medium">Day Streak</div>
        </button>
      </div>

      {/* Grid Row: Next Pickup & Learn CTA */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Next Pickup Card */}
        {nextPickup && (
          <button
            onClick={() => onNavigate('schedule')}
            className="w-full citizen-slide-up bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-emerald-500/10 border border-sky-500/20 rounded-2xl p-5 text-left transition-all hover:border-sky-400/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-sky-400 font-semibold uppercase tracking-wider mb-1">
                  {nextPickup.is_today ? '📍 Today\'s Pickup' : '📅 Next Pickup'}
                </div>
                <div className="text-[#1A2E22] dark:text-white font-bold text-xl">{nextPickup.day}</div>
                <div className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  {wasteTypeIcon[nextPickup.waste_type] || '♻️'} {nextPickup.waste_type.charAt(0).toUpperCase() + nextPickup.waste_type.slice(1)} Waste
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{nextPickup.time_window}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Truck: {nextPickup.truck_id}</div>
                <div className="text-xs text-slate-500">{nextPickup.zone}</div>
              </div>
            </div>
          </button>
        )}

        {/* Learn Segregation CTA */}
        <button
          onClick={() => onNavigate('learn')}
          className="w-full bg-gradient-to-r from-emerald-500/10 to-amber-500/10 border border-emerald-500/20 rounded-2xl p-5 text-left transition-all hover:border-emerald-400/40 flex items-center gap-4"
        >
          <span className="text-4xl">♻️</span>
          <div className="flex-1">
            <div className="font-bold text-[#1A2E22] dark:text-white text-base">Learn Waste Segregation</div>
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5">Wet vs. Dry guide &amp; interactive quiz game</div>
          </div>
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Recent Reports Section */}
      {reports.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📋</span> Recent Waste Reports
            </h3>
            <button onClick={() => onNavigate('myReports')} className="text-xs font-semibold text-sky-400 hover:underline">
              Track All Grievances &rarr;
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-3 citizen-stagger">
            {reports.slice(0, 6).map(r => (
              <div
                key={r.ticket_id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between citizen-card-lift"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{wasteTypeIcon[r.waste_type] || '🗑️'}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusColor[r.status] || 'text-slate-400'}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white font-mono">{r.ticket_id}</div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {r.description || r.waste_type.toUpperCase() + ' waste reported'}
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-700/30 flex justify-between">
                  <span>Severity: {r.severity}/5</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
