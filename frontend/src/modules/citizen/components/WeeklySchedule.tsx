import React, { useEffect, useState } from 'react';
import type { ScheduleDay } from '../types/citizen.types';
import { fetchSchedule } from '../api/citizenApi';

const wasteTypeConfig: Record<string, {
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardLightBg: string;
  cardDarkBg: string;
  cardBorder: string;
}> = {
  wet: {
    icon: '🥬',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-500/30',
    cardLightBg: 'bg-emerald-50/70',
    cardDarkBg: 'dark:bg-emerald-950/20',
    cardBorder: 'border-emerald-200 dark:border-emerald-800/40',
  },
  dry: {
    icon: '📦',
    badgeBg: 'bg-amber-100 dark:bg-amber-500/20',
    badgeText: 'text-amber-900 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-500/30',
    cardLightBg: 'bg-amber-50/70',
    cardDarkBg: 'dark:bg-amber-950/20',
    cardBorder: 'border-amber-200 dark:border-amber-800/40',
  },
  hazardous: {
    icon: '☢️',
    badgeBg: 'bg-rose-100 dark:bg-rose-500/20',
    badgeText: 'text-rose-900 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-500/30',
    cardLightBg: 'bg-rose-50/70',
    cardDarkBg: 'dark:bg-rose-950/20',
    cardBorder: 'border-rose-200 dark:border-rose-800/40',
  },
  mixed: {
    icon: '♻️',
    badgeBg: 'bg-sky-100 dark:bg-sky-500/20',
    badgeText: 'text-sky-900 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-500/30',
    cardLightBg: 'bg-sky-50/70',
    cardDarkBg: 'dark:bg-sky-950/20',
    cardBorder: 'border-sky-200 dark:border-sky-800/40',
  },
  '—': {
    icon: '🚫',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-600 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    cardLightBg: 'bg-slate-50',
    cardDarkBg: 'dark:bg-slate-900/40',
    cardBorder: 'border-slate-200 dark:border-slate-800',
  },
};

const WeeklySchedule: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSchedule();
        setSchedule(data);
      } catch (err) {
        console.error('Schedule load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-sky-400/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const todayIndex = schedule.findIndex((s) => s.is_today);

  return (
    <div className="citizen-fade-in space-y-6 max-w-6xl mx-auto pb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <span>📅</span> Weekly Pickup Timetable
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Official municipal waste collection schedule &amp; time windows for Dharampeth Ward 14.
        </p>
      </div>

      {/* Today's Highlight Banner */}
      {todayIndex >= 0 && (
        <div
          className={`rounded-3xl p-6 md:p-8 ${
            wasteTypeConfig[schedule[todayIndex].waste_type]?.cardLightBg || 'bg-white'
          } ${
            wasteTypeConfig[schedule[todayIndex].waste_type]?.cardDarkBg || 'dark:bg-slate-900'
          } border ${
            wasteTypeConfig[schedule[todayIndex].waste_type]?.cardBorder || 'border-slate-200'
          } flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              <span>Today&apos;s Collection • {schedule[todayIndex].day}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl">{wasteTypeConfig[schedule[todayIndex].waste_type]?.icon || '🗑️'}</span>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 capitalize">
                  {schedule[todayIndex].waste_type} Waste Collection
                </div>
                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                  Time Window: <span className="font-bold">{schedule[todayIndex].time_window}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left md:text-right self-start md:self-auto min-w-[210px] shadow-xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assigned Vehicle</div>
            <div className="text-lg font-bold text-slate-900 dark:text-sky-300 font-mono mt-0.5">
              {schedule[todayIndex].truck_id}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{schedule[todayIndex].zone}</div>
          </div>
        </div>
      )}

      {/* Full Week Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedule.map((day, idx) => {
          const conf = wasteTypeConfig[day.waste_type] || wasteTypeConfig['—'];
          const isToday = idx === todayIndex;
          const isPast = idx < todayIndex;

          return (
            <div
              key={day.day}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                isToday
                  ? `${conf.cardLightBg} ${conf.cardDarkBg} ${conf.cardBorder} ring-2 ring-sky-500/30`
                  : isPast
                  ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/40 opacity-70'
                  : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900 dark:text-slate-100">{day.day}</span>
                    {isToday && (
                      <span className="text-[10px] font-bold bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-sky-200 dark:border-sky-500/30">
                        Today
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                        Passed
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">{day.date}</span>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className={`w-12 h-12 rounded-2xl ${conf.badgeBg} ${conf.badgeBorder} border flex items-center justify-center text-2xl shrink-0`}>
                    {conf.icon}
                  </div>
                  <div>
                    <div className={`text-base font-bold capitalize ${conf.badgeText}`}>{day.waste_type} Waste</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{day.time_window}</div>
                  </div>
                </div>
              </div>

              {!isPast && day.waste_type !== '—' && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-mono font-medium">🚛 {day.truck_id}</span>
                  <span>📍 {day.zone}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ward Info Callout */}
      <div className="bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/30 rounded-2xl p-5 flex items-start gap-4">
        <span className="text-2xl">ℹ️</span>
        <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          This schedule applies to <strong className="text-slate-900 dark:text-slate-100 font-bold">Dharampeth Ward 14</strong>. Waste collection tippers operate 6 days a week. For missed pickups or special bulk disposal, call the NMC Control Room hotline at{' '}
          <strong className="text-sky-700 dark:text-sky-400 font-bold">1800-123-4567</strong>.
        </p>
      </div>
    </div>
  );
};

export default WeeklySchedule;
