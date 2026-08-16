import React, { useEffect, useState } from 'react';
import type { ScheduleDay } from '../types/citizen.types';
import { fetchSchedule } from '../api/citizenApi';

const wasteTypeConfig: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  wet:       { icon: '🥬', color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  dry:       { icon: '📦', color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
  hazardous: { icon: '☢️', color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30' },
  mixed:     { icon: '♻️', color: 'text-sky-400',    bg: 'bg-sky-500/15',    border: 'border-sky-500/30' },
  '—':       { icon: '🚫', color: 'text-slate-500',  bg: 'bg-slate-800/40',  border: 'border-slate-700/30' },
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
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  const todayIndex = schedule.findIndex(s => s.is_today);

  return (
    <div className="citizen-fade-in space-y-5 pb-4">
      <div className="px-1">
        <h2 className="text-xl font-bold text-white">📅 Weekly Pickup Schedule</h2>
        <p className="text-slate-400 text-sm mt-1">Your ward's garbage collection timetable.</p>
      </div>

      {/* Today's Highlight */}
      {todayIndex >= 0 && (
        <div className={`citizen-today-ring citizen-slide-up rounded-2xl p-5 ${wasteTypeConfig[schedule[todayIndex].waste_type]?.bg || 'bg-slate-800/40'} border ${wasteTypeConfig[schedule[todayIndex].waste_type]?.border || 'border-slate-700/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
                Today — {schedule[todayIndex].day}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">{wasteTypeConfig[schedule[todayIndex].waste_type]?.icon || '🗑️'}</span>
                <div>
                  <div className="text-lg font-bold text-white capitalize">{schedule[todayIndex].waste_type} Waste</div>
                  <div className="text-sm text-slate-400">{schedule[todayIndex].time_window}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">{schedule[todayIndex].truck_id}</div>
              <div className="text-xs text-slate-500">{schedule[todayIndex].zone}</div>
            </div>
          </div>
        </div>
      )}

      {/* Full Week */}
      <div className="space-y-2 citizen-stagger">
        {schedule.map((day, idx) => {
          const conf = wasteTypeConfig[day.waste_type] || wasteTypeConfig['—'];
          const isToday = idx === todayIndex;
          const isPast = idx < todayIndex;

          return (
            <div
              key={day.day}
              className={`
                rounded-xl p-4 border transition-all citizen-card-lift
                ${isToday
                  ? `${conf.bg} ${conf.border} ring-1 ring-sky-400/30`
                  : isPast
                    ? 'bg-slate-800/30 border-slate-800/40 opacity-60'
                    : `bg-slate-800/50 border-slate-700/40 hover:border-slate-600/60`
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${conf.bg} ${conf.border} border flex items-center justify-center text-lg`}>
                    {conf.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isToday ? 'text-white' : 'text-slate-300'}`}>
                        {day.day}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Today
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[10px] font-bold bg-slate-700/50 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Done
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{day.date}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-medium capitalize ${conf.color}`}>{day.waste_type}</div>
                  <div className="text-xs text-slate-500">{day.time_window}</div>
                </div>
              </div>

              {/* Expanded details for upcoming days */}
              {!isPast && day.waste_type !== '—' && (
                <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between text-xs text-slate-500">
                  <span>🚛 {day.truck_id}</span>
                  <span>📍 {day.zone}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl p-4 flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <p className="text-xs text-slate-400 leading-relaxed">
          Schedule is for <strong className="text-slate-300">Dharampeth Ward</strong>. Timings may vary during festivals or public holidays.
          Contact NMC helpline <strong className="text-sky-400">1800-123-4567</strong> for changes.
        </p>
      </div>
    </div>
  );
};

export default WeeklySchedule;
