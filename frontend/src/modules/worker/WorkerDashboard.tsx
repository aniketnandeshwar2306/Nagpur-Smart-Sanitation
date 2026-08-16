import React, { useState, useEffect } from 'react';
import type { DailyTask, WorkerStats, WardZoneGeo, SegregationVerificationResult, TaskStatus } from './types';
import { workerApi } from './api';
import { WorkerHeader } from './components/WorkerHeader';
import { WeatherAlertBanner } from './components/WeatherAlertBanner';
import { DailyTasksList } from './components/DailyTasksList';
import { GISWardMap } from './components/GISWardMap';
import { SegregationModal } from './components/SegregationModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SafetyChecklistModal } from './components/SafetyChecklistModal';

export const WorkerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'map' | 'ai_verify' | 'stats'>('tasks');
  const [language, setLanguage] = useState<'en' | 'mr' | 'hi'>('en');
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [wards, setWards] = useState<WardZoneGeo[]>([]);
  const [stats, setStats] = useState<WorkerStats>({
    worker_id: 'WRK-4089',
    worker_name: 'Rajesh Rao (राजेश राव)',
    zone_assigned: 'Zone 2 - Dharampeth',
    ward_number: 12,
    shift_start: '06:00 AM',
    shift_end: '02:30 PM',
    total_assigned_today: 6,
    completed_today: 1,
    pending_today: 4,
    in_progress_today: 1,
    avg_segregation_accuracy: 94.2,
    daily_incentive_earned_inr: 75.0,
    safety_compliance_score: 98.5,
    distance_covered_km: 7.8,
    active_vehicle_number: 'MH-31-EQ-9104 (E-Tipper #12)'
  });

  const [isOnline] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Modal states
  const [verifyingTask, setVerifyingTask] = useState<DailyTask | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<DailyTask | null>(null);
  const [isSafetyChecklistOpen, setIsSafetyChecklistOpen] = useState<boolean>(false);
  const [highlightedMapTaskId, setHighlightedMapTaskId] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [taskList, wardList, statsData] = await Promise.all([
          workerApi.getTasks({ workerId: 'WRK-4089' }),
          workerApi.getWards(),
          workerApi.getStats('WRK-4089')
        ]);
        if (isMounted) {
          setTasks(taskList);
          setWards(wardList);
          setStats(statsData);
        }
      } catch (err) {
        console.error('Error initializing worker dashboard:', err);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  const showToast = (title: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ title, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle task status update
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, notes?: string) => {
    try {
      const updated = await workerApi.updateTaskStatus(taskId, {
        status: newStatus,
        worker_notes: notes
      });

      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updated } : t)));

      // Recalculate local stats
      setStats(prev => {
        const completed = newStatus === 'COMPLETED' ? prev.completed_today + 1 : prev.completed_today;
        const pending = Math.max(0, prev.total_assigned_today - completed);
        return {
          ...prev,
          completed_today: completed,
          pending_today: pending,
          daily_incentive_earned_inr: prev.daily_incentive_earned_inr + (newStatus === 'COMPLETED' ? 25 : 0)
        };
      });

      showToast(
        language === 'mr'
          ? `तक्रार स्थिती अपडेट केली: ${newStatus}`
          : `Task ${taskId} updated to ${newStatus}`,
        'success'
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
      showToast('Failed to update task status', 'warn');
    }
  };

  // Handle AI Segregation Completion
  const handleVerificationComplete = async (taskId: string, result: SegregationVerificationResult) => {
    try {
      const isPassed = result.verdict === 'PASSED';
      await handleStatusChange(
        taskId,
        isPassed ? 'COMPLETED' : 'IN_PROGRESS',
        `AI Segregation: ${result.overall_score}% (${result.primary_category}). ${result.feedback_english}`
      );

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                segregation_score: result.overall_score,
                verification_status: result.verdict
              }
            : t
        )
      );

      showToast(
        language === 'mr'
          ? `AI तपासणी यशस्वी: ${result.overall_score}% शुद्धता (+₹${result.incentive_earned_inr} जमा)`
          : `AI Verification: ${result.overall_score}% Purity (+₹${result.incentive_earned_inr} Bonus)`,
        isPassed ? 'success' : 'warn'
      );
    } catch (err) {
      console.error('Failed to handle verification result:', err);
    }
  };

  const handleOpenVerifyModal = (task?: DailyTask) => {
    setVerifyingTask(task || tasks[0] || null);
    setIsVerifyModalOpen(true);
  };

  const handleNavigateToMap = (task: DailyTask) => {
    setHighlightedMapTaskId(task.id);
    setActiveTab('map');
    showToast(`Focused on ${task.location.address}`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Worker Sticky Header */}
      <WorkerHeader
        stats={stats}
        language={language}
        onLanguageChange={setLanguage}
        onOpenSafetyChecklist={() => setIsSafetyChecklistOpen(true)}
        isOnline={isOnline}
      />

      {/* Push-style Real-time Weather & Hazard Alert Banner */}
      <WeatherAlertBanner
        language={language}
        zoneFilter={stats.zone_assigned}
        onOpenChecklist={() => setIsSafetyChecklistOpen(true)}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'tasks'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📋</span>
            <span>{language === 'mr' ? 'दैनिक कामे' : 'Daily Tasks'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'tasks' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tasks.filter(t => t.status !== 'COMPLETED').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🗺️</span>
            <span>{language === 'mr' ? 'GIS प्रभाग नकाशा' : 'GIS Ward Map'}</span>
          </button>

          <button
            onClick={() => handleOpenVerifyModal()}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ai_verify'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📷</span>
            <span>{language === 'mr' ? 'AI स्कॅनर' : 'AI Scanner'}</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📊</span>
            <span>{language === 'mr' ? 'माझी कामगिरी' : 'My Shift'}</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'tasks' && (
          <DailyTasksList
            tasks={tasks}
            language={language}
            onSelectTask={task => setSelectedTaskDetail(task)}
            onVerifyTask={task => handleOpenVerifyModal(task)}
            onStatusChange={handleStatusChange}
            onNavigateToMap={handleNavigateToMap}
          />
        )}

        {activeTab === 'map' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>📍 Centered on Nagpur Dharampeth (Zone 2)</span>
              <span className="text-amber-400 font-semibold">• Live GPS Active</span>
            </div>
            <GISWardMap
              tasks={tasks}
              wards={wards}
              language={language}
              onSelectTask={task => setSelectedTaskDetail(task)}
              onVerifyTask={task => handleOpenVerifyModal(task)}
              selectedTaskId={highlightedMapTaskId}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Shift Profile Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    Official Duty Shift
                  </span>
                  <h3 className="text-xl font-bold text-slate-100 mt-0.5">{stats.worker_name}</h3>
                  <p className="text-xs text-slate-400">
                    ID: {stats.worker_id} • Ward {stats.ward_number} ({stats.zone_assigned})
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                  Active Shift: {stats.shift_start} - {stats.shift_end}
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Stops</span>
                  <span className="text-2xl font-black text-slate-100">{stats.total_assigned_today}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Cleared Bins</span>
                  <span className="text-2xl font-black text-emerald-400">{stats.completed_today}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Route Distance</span>
                  <span className="text-2xl font-black text-sky-400">{stats.distance_covered_km} km</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Daily Bonus</span>
                  <span className="text-2xl font-black text-lime-400">₹{stats.daily_incentive_earned_inr}</span>
                </div>
              </div>

              {/* Vehicle & Equipment Details */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Assigned Vehicle:</span>
                  <span className="font-bold text-amber-400">{stats.active_vehicle_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Swachh Bharat Safety Rating:</span>
                  <span className="font-bold text-emerald-400">{stats.safety_compliance_score}% (Grade A+)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg AI Segregation Accuracy:</span>
                  <span className="font-bold text-cyan-400">{stats.avg_segregation_accuracy}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Quick Action Bar for Mobile Workers */}
      <div className="fixed bottom-3 left-4 right-4 max-w-lg mx-auto z-40">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex items-center justify-between gap-2 ring-1 ring-white/10">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'map' ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🗺️</span>
            <span>Route Map</span>
          </button>

          {/* Big Center AI Camera Trigger */}
          <button
            onClick={() => handleOpenVerifyModal()}
            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
          >
            <span>📷</span>
            <span>AI Camera</span>
          </button>

          <button
            onClick={() => setIsSafetyChecklistOpen(true)}
            className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-slate-300 hover:text-white"
          >
            <span>🛡️</span>
            <span>Safety SOP</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-slate-900/95 border border-amber-500/50 rounded-xl p-3.5 shadow-2xl backdrop-blur-md animate-slideInRight text-xs flex items-center gap-2.5">
          <span className="text-lg">
            {toastMessage.type === 'success' ? '✅' : toastMessage.type === 'warn' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="font-semibold text-slate-200">{toastMessage.title}</span>
        </div>
      )}

      {/* AI Segregation Verification Modal */}
      {isVerifyModalOpen && (
        <SegregationModal
          task={verifyingTask}
          language={language}
          onClose={() => setIsVerifyModalOpen(false)}
          onVerificationComplete={handleVerificationComplete}
        />
      )}

      {/* Task Details Modal */}
      {selectedTaskDetail && (
        <TaskDetailModal
          task={selectedTaskDetail}
          language={language}
          onClose={() => setSelectedTaskDetail(null)}
          onVerify={task => handleOpenVerifyModal(task)}
          onStatusUpdate={handleStatusChange}
          onNavigateToMap={handleNavigateToMap}
        />
      )}

      {/* Safety Checklist Modal */}
      {isSafetyChecklistOpen && (
        <SafetyChecklistModal
          language={language}
          onClose={() => setIsSafetyChecklistOpen(false)}
        />
      )}
    </div>
  );
};

export default WorkerDashboard;
