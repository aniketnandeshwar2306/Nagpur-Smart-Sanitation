import React, { useState } from 'react';
import type { DailyTask, TaskStatus, TaskPriority } from '../types';
import { calculateSegregationBonus } from '../api';

interface DailyTasksListProps {
  tasks: DailyTask[];
  language: 'en' | 'mr' | 'hi';
  onSelectTask: (task: DailyTask) => void;
  onVerifyTask: (task: DailyTask) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onNavigateToMap: (task: DailyTask) => void;
  onOpenCreateTask?: () => void;
  onArchiveCompleted?: () => void;
  onDeleteTask?: (taskId: string) => void;
}

export const DailyTasksList: React.FC<DailyTasksListProps> = ({
  tasks,
  language,
  onSelectTask,
  onVerifyTask,
  onStatusChange,
  onNavigateToMap,
  onOpenCreateTask,
  onArchiveCompleted,
  onDeleteTask
}) => {
  // Default to ACTIVE so completed tasks automatically clear from the main queue
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConfirmClearModal, setShowConfirmClearModal] = useState<boolean>(false);

  const activeCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const completedCount = completedTasks.length;

  const totalCompletedBonus = completedTasks.reduce((sum, t) => {
    const b = (t.bonus_awarded !== undefined && t.bonus_awarded !== null && t.bonus_awarded > 0)
      ? t.bonus_awarded
      : calculateSegregationBonus(t.segregation_score, t.verification_status);
    return sum + b;
  }, 0);

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'ACTIVE') {
      if (task.status !== 'PENDING' && task.status !== 'IN_PROGRESS') return false;
    } else if (filterStatus !== 'ALL') {
      if (task.status !== filterStatus) return false;
    }

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
            ✓ {language === 'mr' ? 'पूर्ण' : 'Completed'}
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
        {/* Search Row + Log Spot Action Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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

          {onOpenCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
              title="Click photo to report new waste spot"
            >
              <span>📷</span>
              <span className="hidden sm:inline">
                {language === 'mr' ? '+ स्पॉट नोंदवा' : '+ Log Waste Spot'}
              </span>
              <span className="sm:hidden">
                {language === 'mr' ? '+ नोंदवा' : '+ Log'}
              </span>
            </button>
          )}
        </div>

        {/* Filter Pills Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {[
              { id: 'ACTIVE', label: language === 'mr' ? 'सक्रिय कामे' : 'Active Tasks', count: activeCount, icon: '⚡' },
              { id: 'IN_PROGRESS', label: language === 'mr' ? 'सुरू असलेले' : 'In Progress', count: inProgressCount, icon: '🔄' },
              { id: 'PENDING', label: language === 'mr' ? 'प्रलंबित' : 'Pending', count: pendingCount, icon: '⏳' },
              { id: 'COMPLETED', label: language === 'mr' ? 'पूर्ण झालेले' : 'Completed', count: completedCount, icon: '✓' },
              { id: 'ALL', label: language === 'mr' ? 'सर्व कामे' : 'All History', count: tasks.length, icon: '📋' }
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
                <span>{tab.icon}</span>
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

      {/* Completed Section Archive & History Bar (Visible on COMPLETED Tab) */}
      {filterStatus === 'COMPLETED' && completedCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏆</span>
            <div>
              <h4 className="text-xs font-bold text-emerald-300">
                {completedCount} {language === 'mr' ? 'कामे पूर्ण झाली आहेत' : 'Tasks Cleaned & Verified'}{' '}
                {totalCompletedBonus > 0 && (
                  <span className="text-lime-400 font-extrabold ml-1">(+₹{totalCompletedBonus} Earned)</span>
                )}
              </h4>
              <p className="text-[11px] text-slate-400">
                {language === 'mr'
                  ? 'पूर्ण झालेली कामे सुरक्षितपणे नोंदवली गेली आहेत.'
                  : 'Completed tasks are cleared from your active queue and saved.'}
              </p>
            </div>
          </div>

          {onArchiveCompleted && (
            <button
              onClick={() => setShowConfirmClearModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>🧹</span>
              <span>{language === 'mr' ? 'पूर्ण यादी साफ करा' : 'Clear / Archive Completed'}</span>
            </button>
          )}
        </div>
      )}

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-3">
            <span className="text-5xl block animate-bounce">
              {filterStatus === 'ACTIVE' || filterStatus === 'PENDING' ? '🎉' : '📂'}
            </span>
            <div>
              <h4 className="font-bold text-slate-200 text-base">
                {filterStatus === 'ACTIVE'
                  ? (language === 'mr' ? 'सर्व सक्रिय कामे पूर्ण झाली!' : 'All Active Tasks are Cleared!')
                  : filterStatus === 'COMPLETED'
                  ? (language === 'mr' ? 'पूर्ण कामांची नोंद नाही' : 'No Completed Tasks Yet')
                  : (language === 'mr' ? 'कोणतेही काम सापडले नाही!' : 'No tasks match current filter!')}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {filterStatus === 'ACTIVE'
                  ? (language === 'mr'
                      ? 'तुमच्या प्रभागातील सर्व कामे पूर्ण झाली आहेत. विश्रांती घ्या किंवा नवीन स्पॉट नोंदवा.'
                      : 'All assigned stops in your ward are clear! Completed tasks are archived in the Completed tab.')
                  : (language === 'mr'
                      ? 'निवडलेल्या फिल्टरनुसार कोणतीही नोंद उपलब्ध नाही.'
                      : 'No records found for this specific filter view.')}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              {filterStatus === 'ACTIVE' && completedCount > 0 && (
                <button
                  onClick={() => setFilterStatus('COMPLETED')}
                  className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all"
                >
                  ✓ {language === 'mr' ? `पूर्ण झालेली कामे पहा (${completedCount})` : `View Completed History (${completedCount})`}
                </button>
              )}

              {onOpenCreateTask && (
                <button
                  onClick={onOpenCreateTask}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:brightness-110 transition-all"
                >
                  📷 {language === 'mr' ? '+ नवीन कचरा स्पॉट नोंदवा' : '+ Report New Waste Spot'}
                </button>
              )}
            </div>
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
                    ? 'border-emerald-500/30 bg-slate-900/60'
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
                {task.segregation_score !== null && task.segregation_score !== undefined && (() => {
                  const taskBonus = (task.bonus_awarded !== undefined && task.bonus_awarded !== null && task.bonus_awarded > 0)
                    ? task.bonus_awarded
                    : calculateSegregationBonus(task.segregation_score, task.verification_status);

                  return (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">
                          AI Purity: {task.segregation_score}%
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          task.segregation_score >= 80
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : task.segregation_score >= 60
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {task.verification_status || (task.segregation_score >= 75 ? 'PASSED' : 'WARNING')}
                        </span>
                      </div>
                      <span className={`text-[11px] font-black ${taskBonus > 0 ? 'text-lime-400' : 'text-slate-500'}`}>
                        {taskBonus > 0 ? `+₹${taskBonus} Bonus` : '₹0 Bonus (Low Purity)'}
                      </span>
                    </div>
                  );
                })()}

                {/* Card Action Buttons */}
                <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  {/* Citizen Contact Shortcut */}
                  <div className="text-[11px] text-slate-400">
                    {task.citizen_name && (
                      <span>Citizen: <strong className="text-slate-300">{task.citizen_name}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
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
                    {!isCompleted && (
                      <button
                        onClick={() => onVerifyTask(task)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <span>📷</span>
                        <span>AI Verify</span>
                      </button>
                    )}

                    {/* Status Toggle Button */}
                    {!isCompleted ? (
                      isInProgress ? (
                        <button
                          onClick={() => onStatusChange(task.id, 'COMPLETED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1"
                        >
                          <span>✓</span>
                          <span>Mark Done</span>
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          ✓ Resolved {task.completed_at ? new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>

                        {onDeleteTask && (
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="px-2 py-1 text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg border border-transparent hover:border-rose-500/30 transition-colors"
                            title="Dismiss from history"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Clearing Completed Tasks */}
      {showConfirmClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 text-amber-400">
              <span className="text-2xl">🧹</span>
              <h3 className="font-bold text-base text-slate-100">
                {language === 'mr' ? 'पूर्ण कामे साफ करायची का?' : 'Clear Completed Tasks?'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'mr'
                ? `हे तुमच्या आजच्या शिफ्टमधील सर्व ${completedCount} पूर्ण झालेली कामे सक्रिय यादीतून काढून टाकेल. तुमची जमा झालेली बक्षीस रक्कम सुरक्षित राहील.`
                : `This will archive and clear all ${completedCount} resolved tasks from your active shift list. Your earned incentives and bonus metrics remain saved.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmClearModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowConfirmClearModal(false);
                  if (onArchiveCompleted) onArchiveCompleted();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
              >
                {language === 'mr' ? 'होय, साफ करा' : 'Yes, Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

