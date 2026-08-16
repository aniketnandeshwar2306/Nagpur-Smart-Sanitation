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
    <div className="citizen-fade-in space-y-6 max-w-6xl mx-auto pb-6">
      <div>
        <h2 className="text-2xl font-bold text-white">📅 Weekly Pickup Timetable</h2>
        <p className="text-slate-400 text-sm mt-1">Official municipal garbage collection schedule for Dharampeth Ward 14.</p>
      </div>

      {/* Today's Highlight Banner */}
      {todayIndex >= 0 && (
        <div className={`citizen-today-ring citizen-slide-up rounded-3xl p-6 md:p-8 ${wasteTypeConfig[schedule[todayIndex].waste_type]?.bg || 'bg-slate-800/40'} border ${wasteTypeConfig[schedule[todayIndex].waste_type]?.border || 'border-slate-700/30'} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl`}>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">
              📍 Today's Collection Day — {schedule[todayIndex].day}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{wasteTypeConfig[schedule[todayIndex].waste_type]?.icon || '🗑️'}</span>
              <div>
                <div className="text-2xl font-black text-white capitalize">{schedule[todayIndex].waste_type} Waste Collection</div>
                <div className="text-base text-slate-300 font-medium mt-0.5">Time Window: {schedule[todayIndex].time_window}</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-right self-start md:self-auto min-w-[200px]">
            <div className="text-xs text-slate-400">Assigned Vehicle</div>
            <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">{schedule[todayIndex].truck_id}</div>
            <div className="text-xs text-slate-500 mt-1">{schedule[todayIndex].zone}</div>
          </div>
        </div>
      )}

      {/* Full Week Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 citizen-stagger">
        {schedule.map((day, idx) => {
          const conf = wasteTypeConfig[day.waste_type] || wasteTypeConfig['—'];
          const isToday = idx === todayIndex;
          const isPast = idx < todayIndex;

          return (
            <div
              key={day.day}
              className={`
                rounded-2xl p-5 border transition-all citizen-card-lift flex flex-col justify-between
                ${isToday
                  ? `${conf.bg} ${conf.border} ring-2 ring-sky-400/40 shadow-lg shadow-sky-500/10`
                  : isPast
                    ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
                    : `bg-slate-900/70 border-slate-800 hover:border-slate-700`
                }
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-base ${isToday ? 'text-white' : 'text-slate-200'}`}>
                      {day.day}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-extrabold bg-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-sky-500/30">
                        Today
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Done
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{day.date}</span>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className={`w-12 h-12 rounded-2xl ${conf.bg} ${conf.border} border flex items-center justify-center text-2xl`}>
                    {conf.icon}
                  </div>
                  <div>
                    <div className={`text-base font-extrabold capitalize ${conf.color}`}>{day.waste_type} Waste</div>
                    <div className="text-xs text-slate-400 font-medium">{day.time_window}</div>
                  </div>
                </div>
              </div>

              {!isPast && day.waste_type !== '—' && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">🚛 {day.truck_id}</span>
                  <span>📍 {day.zone}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ward Info Callout */}
      <div className="bg-sky-500/5 border border-sky-500/15 rounded-2xl p-5 flex items-start gap-4">
        <span className="text-2xl">ℹ️</span>
        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
          This schedule applies to <strong className="text-slate-200">Dharampeth Ward 14</strong>. Waste collection trucks operate 6 days a week. For missed pickups or special bulk disposal, call the NMC Control Room hotline at <strong className="text-sky-400 font-semibold">1800-123-4567</strong>.
        </p>
      </div>
    </div>
  );
};

export default WeeklySchedule;
