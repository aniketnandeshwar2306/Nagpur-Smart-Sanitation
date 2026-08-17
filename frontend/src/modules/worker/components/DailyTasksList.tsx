import React, { useState } from 'react';
import type { DailyTask, TaskStatus, TaskPriority } from '../types';

interface DailyTasksListProps {
  tasks: DailyTask[];
  language: 'en' | 'mr' | 'hi';
  onSelectTask: (task: DailyTask) => void;
  onVerifyTask: (task: DailyTask) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onNavigateToMap: (task: DailyTask) => void;
}

export const DailyTasksList: React.FC<DailyTasksListProps> = ({
  tasks,
  language,
  onSelectTask,
  onVerifyTask,
  onStatusChange,
  onNavigateToMap
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTicket = task.ticket_number.toLowerCase().includes(q);
      const matchAddress = task.location.address.toLowerCase().includes(q);
      const matchCitizen = task.citizen_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchTicket && !matchAddress && !matchCitizen) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            🚨 {language === 'mr' ? 'अति तातडीचे' : 'Critical'}
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            ⚡ {language === 'mr' ? 'उच्च प्राधान्य' : 'High Priority'}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
            {language === 'mr' ? 'मध्यम' : 'Medium'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            {language === 'mr' ? 'सामान्य' : 'Normal'}
          </span>
        );
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            o {language === 'mr' ? 'पूर्ण' : 'Completed'}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
            🔄 {language === 'mr' ? 'सुरू आहे' : 'In Progress'}
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
            🚩 {language === 'mr' ? 'फ्लॅग केले' : 'Flagged'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-slate-800 text-amber-400 border border-slate-700">
            ⏳ {language === 'mr' ? 'प्रलंबित' : 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-3">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              language === 'mr'
                ? 'तक्रार क्रमांक, परिसर किंवा नागरिक शोधा...'
                : 'Search by ticket #, Sitabuldi, Futala, Dharampeth...'
            }
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {[
              { id: 'ALL', label: 'All Tasks', count: tasks.length },
              { id: 'IN_PROGRESS', label: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
              { id: 'PENDING', label: 'Pending', count: tasks.filter(t => t.status === 'PENDING').length },
              { id: 'COMPLETED', label: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filterStatus === tab.id ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-slate-950 text-[11px] font-semibold text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">🚨 Critical Only</option>
            <option value="HIGH">⚡ High Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <span className="text-4xl block mb-2">🎉</span>
            <h4 className="font-bold text-slate-200 text-base">
              {language === 'mr' ? 'कोणतेही प्रलंबित काम नाही!' : 'No tasks match current filter!'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              All assigned sanitation stops in your ward are clear.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isCompleted = task.status === 'COMPLETED';
            const isInProgress = task.status === 'IN_PROGRESS';

            return (
              <div
                key={task.id}
                className={`bg-slate-900 border rounded-2xl p-4 transition-all hover:border-slate-700 shadow-xl ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-slate-900/50 opacity-80'
                    : isInProgress
                    ? 'border-cyan-500/50 ring-1 ring-cyan-500/30'
                    : task.priority === 'CRITICAL'
                    ? 'border-rose-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Header Line */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPriorityBadge(task.priority)}
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {task.ticket_number}
                      </span>
                      <span className="text-xs font-semibold text-amber-400">
                        • {task.waste_type}
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectTask(task)}
                      className="font-bold text-slate-100 text-sm sm:text-base leading-snug cursor-pointer hover:text-amber-400 transition-colors"
                    >
                      {task.title}
                    </h3>
                  </div>

                  <div>{getStatusBadge(task.status)}</div>
                </div>

                {/* Location & Details */}
                <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                  <p className="flex items-start gap-1.5 text-slate-400">
                    <span className="text-slate-500 flex-shrink-0">📍</span>
                    <span className="leading-tight">{task.location.address}</span>
                  </p>
                  {task.location.landmark && (
                    <p className="flex items-center gap-1.5 text-amber-400/90 text-[11px] pl-4">
                      <span>Landmark:</span>
                      <span>{task.location.landmark}</span>
                    </p>
                  )}
                </div>

                {/* AI Segregation Badge if present */}
                {task.segregation_score !== null && task.segregation_score !== undefined && (
                  <div className="mt-3 p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">
                        AI Segregation: {task.segregation_score}%
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                        {task.verification_status || 'PASSED'}
                      </span>
                    </div>
                    <span className="text-[11px] text-lime-400 font-bold">+₹25 Bonus</span>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  {/* Citizen Contact Shortcut */}
                  <div className="text-[11px] text-slate-400">
                    {task.citizen_name && (
                      <span>Citizen: <strong className="text-slate-300">{task.citizen_name}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Navigate on Map Button */}
                    <button
                      onClick={() => onNavigateToMap(task)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1"
                      title="Plot on GIS Map"
                    >
                      <span>🗺️</span>
                      <span className="hidden sm:inline">Map</span>
                    </button>

                    {/* AI Verify Segregation Button */}
                    <button
                      onClick={() => onVerifyTask(task)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span>📷</span>
                      <span>AI Verify</span>
                    </button>

                    {/* Status Toggle Button */}
                    {!isCompleted ? (
                      isInProgress ? (
                        <button
                          onClick={() => onStatusChange(task.id, 'COMPLETED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                        >
                          o Mark Done
                        </button>
                      ) : (
                        <button
                          onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                        >
                          Start Task
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold px-2 py-1">
                        o Done at {task.completed_at ? new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '07:10 AM'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
