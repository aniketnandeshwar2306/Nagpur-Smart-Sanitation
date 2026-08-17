import React, { useState, useEffect } from 'react';
import NagpurMap from '../../components/NagpurMap';
import type { MapMarker } from '../../components/NagpurMap';

export type WorkerTab = 'dashboard' | 'route' | 'bins' | 'history' | 'profile';

interface WorkerDashboardProps {
  activeTab?: string;
  onNavigate?: (tab: string) => void;
}

const WORKER = {
  id: 'W-002',
  name: 'Suresh Meshram',
  role: 'Senior Sanitation Driver',
  zone: 'Zone B – Civil Lines & Sitabuldi',
  vehicle: 'NMC-T18',
  shift: '6:00 AM – 2:00 PM',
  phone: '9823002222',
  experience: '6 years',
  rating: 4.8,
  totalCollections: 2847,
};

const ROUTE_BINS = [
  { id: 'BIN-B01', location: 'Civil Lines – Near Bus Stand', fill: 94, status: 'critical', collected: false, lat: 21.1535, lng: 79.0949 },
  { id: 'BIN-B02', location: 'Sitabuldi – Market Gate',      fill: 78, status: 'high',     collected: false, lat: 21.1388, lng: 79.0816 },
  { id: 'BIN-B03', location: 'Dharampeth – College Square', fill: 62, status: 'normal',   collected: true,  lat: 21.1458, lng: 79.0882 },
  { id: 'BIN-B04', location: 'Gokulpeth – Main Road',       fill: 45, status: 'normal',   collected: true,  lat: 21.1420, lng: 79.0960 },
  { id: 'BIN-B05', location: 'Itwari – Old Market',         fill: 88, status: 'high',     collected: false, lat: 21.1490, lng: 79.0840 },
  { id: 'BIN-B06', location: 'Wardha Road – Junction',      fill: 35, status: 'normal',   collected: true,  lat: 21.1400, lng: 79.0750 },
];

const HISTORY = [
  { date: 'Today', bins: 14, route: 'Zone B – Route 4', weight: '3.2t', start: '6:05 AM', status: 'In Progress' },
  { date: 'Yesterday', bins: 22, route: 'Zone B – Route 4', weight: '5.1t', start: '6:00 AM', status: 'Completed' },
  { date: 'Mon, Oct 21', bins: 20, route: 'Zone B – Route 3', weight: '4.8t', start: '6:10 AM', status: 'Completed' },
  { date: 'Sun, Oct 20', bins: 0, route: '—', weight: '—', start: '—', status: 'Off Day' },
  { date: 'Sat, Oct 19', bins: 24, route: 'Zone B – Route 4', weight: '5.6t', start: '6:00 AM', status: 'Completed' },
];

const fillColor = (fill: number) => {
  if (fill >= 90) return 'bg-rose-500';
  if (fill >= 75) return 'bg-amber-500';
  return 'bg-[#2D5A3F]';
};
const fillBadge = (status: string) => {
  if (status === 'critical') return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
  if (status === 'high') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  return 'bg-[#E3EBD8] text-[#2D5A3F] dark:bg-emerald-950 dark:text-emerald-300';
};

const TRUCK_MARKERS: MapMarker[] = [
  { lat: 21.1458, lng: 79.0882, label: 'NMC-T18 – Your Vehicle (Active)', type: 'truck' },
  ...ROUTE_BINS.map(b => ({ lat: b.lat, lng: b.lng, label: b.location, type: 'bin' as const })),
];

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  activeTab: propTab = 'dashboard',
}) => {
  // Sync with Left Sidebar selection
  const currentTab: WorkerTab = (['dashboard', 'route', 'bins', 'history', 'profile'].includes(propTab) ? propTab : 'dashboard') as WorkerTab;

  const [etaSeconds, setEtaSeconds] = useState(254);
  const [collectedBins, setCollectedBins] = useState(
    ROUTE_BINS.reduce((acc, b) => ({ ...acc, [b.id]: b.collected }), {} as Record<string, boolean>)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const eta = `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s`;
  const totalCollected = Object.values(collectedBins).filter(Boolean).length;
  const totalBins = ROUTE_BINS.length;

  return (
    <div className="space-y-6 eco-animate-fade">
      {/* Worker Header Card */}
      <div className="bg-[#2D5A3F] text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            👷
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold">{WORKER.name}</h1>
            <p className="text-[#C8E8CD] text-sm font-medium">{WORKER.role} · {WORKER.zone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/15 border border-white/20 px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
            🚛 {WORKER.vehicle}
          </div>
          <div className="bg-[#C8E8CD] text-[#1F402B] px-3.5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1F402B] animate-pulse" />
            On Duty
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── WORKER DASHBOARD ── */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Today's Progress Banner */}
            <div className="eco-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="text-[#2D5A3F] dark:text-emerald-400 text-sm font-bold uppercase tracking-wider mb-1">Today's Collection Progress</div>
                <div className="text-5xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">{totalCollected} / {totalBins}</div>
                <div className="text-[#5C6B61] dark:text-slate-400 text-base mt-1">Bins collected · Zone B Route 4</div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3">
                <div className="w-full md:w-56 bg-[#E5E8E0] dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(totalCollected / totalBins) * 100}%` }}
                    className="bg-[#2D5A3F] dark:bg-emerald-500 h-full rounded-full transition-all duration-700"
                  />
                </div>
                <span className="text-sm font-bold text-[#2D5A3F] dark:text-emerald-400">{Math.round((totalCollected / totalBins) * 100)}% Complete</span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Bins Collected',   value: `${totalCollected}/${totalBins}`, icon: '🗑️', color: '#2D5A3F' },
                { label: 'Next Bin ETA',     value: eta,         icon: '⏱️', color: '#8B6D4C' },
                { label: 'Waste Collected',  value: '3.2 tons',  icon: '⚖️', color: '#1d4ed8' },
                { label: 'Fuel Level',       value: '55%',       icon: '⛽', color: '#5C6B61' },
              ].map((kpi, i) => (
                <div key={i} className="eco-card p-6 flex flex-col justify-between min-h-[130px]">
                  <div className="w-11 h-11 rounded-2xl bg-[#E3EBD8] dark:bg-slate-800 flex items-center justify-center text-xl">
                    {kpi.icon}
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">{kpi.value}</div>
                    <div className="text-sm text-[#5C6B61] dark:text-slate-400 font-medium mt-0.5">{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Map */}
            <div className="eco-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">My Route – Live Map</h2>
                <span className="eco-badge-green"><span className="w-2 h-2 rounded-full bg-[#1F402B] animate-pulse" />GPS Active</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-[#E5E8E0] dark:border-slate-700 h-72">
                <NagpurMap className="w-full h-full" markers={TRUCK_MARKERS} zoom={14} />
              </div>
            </div>
          </div>
        )}

        {/* ── ROUTE ── */}
        {currentTab === 'route' && (
          <div className="space-y-6">
            <div className="eco-card p-6">
              <h2 className="text-2xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">My Assigned Route – Zone B Route 4</h2>
              <p className="text-[#5C6B61] dark:text-slate-400 text-sm mt-1">Civil Lines → Sitabuldi → Dharampeth → Gokulpeth → Itwari · 14.8 km</p>
            </div>
            <div className="eco-card p-6">
              <div className="rounded-2xl overflow-hidden border border-[#E5E8E0] dark:border-slate-700 h-96">
                <NagpurMap className="w-full h-full" markers={TRUCK_MARKERS} zoom={14} />
              </div>
            </div>
          </div>
        )}

        {/* ── BINS ── */}
        {currentTab === 'bins' && (
          <div className="space-y-6">
            <div className="eco-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">Bin Collection Checklist</h2>
                <p className="text-[#5C6B61] dark:text-slate-400 text-sm mt-1">Mark bins as collected and report issues. {totalCollected}/{totalBins} done today.</p>
              </div>
              <span className="eco-badge-green text-sm font-bold">
                {Math.round((totalCollected / totalBins) * 100)}% Complete
              </span>
            </div>

            <div className="eco-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F5F0] dark:bg-slate-800 border-b border-[#E5E8E0] dark:border-slate-700">
                      {['Bin ID', 'Location', 'Fill Level', 'Status', 'Collected', 'Action'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-[#5C6B61] dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8E0] dark:divide-slate-700">
                    {ROUTE_BINS.map(b => (
                      <tr key={b.id} className={`hover:bg-[#F9FAF7] dark:hover:bg-slate-800/60 transition-colors ${collectedBins[b.id] ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4 font-mono text-sm font-bold text-[#2D5A3F] dark:text-emerald-400">{b.id}</td>
                        <td className="px-5 py-4 text-sm text-[#1A2E22] dark:text-slate-200 font-medium">{b.location}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-[#E5E8E0] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div style={{ width: `${b.fill}%` }} className={`h-full rounded-full ${fillColor(b.fill)}`} />
                            </div>
                            <span className="text-sm font-bold text-[#1A2E22] dark:text-slate-200">{b.fill}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${fillBadge(b.status)}`}>{b.status}</span>
                        </td>
                        <td className="px-5 py-4">
                          {collectedBins[b.id]
                            ? <span className="text-[#2D5A3F] dark:text-emerald-400 font-bold text-sm">✅ Done</span>
                            : <span className="text-[#5C6B61] dark:text-slate-400 text-sm">Pending</span>
                          }
                        </td>
                        <td className="px-5 py-4">
                          {!collectedBins[b.id] && (
                            <button
                              onClick={() => setCollectedBins(p => ({ ...p, [b.id]: true }))}
                              className="text-xs bg-[#2D5A3F] text-white font-bold px-3 py-1.5 rounded-xl hover:bg-[#21432E] transition-colors"
                            >
                              Mark Collected
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {currentTab === 'history' && (
          <div className="space-y-6">
            <div className="eco-card p-6">
              <h2 className="text-2xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">Collection History</h2>
              <p className="text-[#5C6B61] dark:text-slate-400 text-sm mt-1">Your past 5 days of collection performance and route logs.</p>
            </div>

            <div className="eco-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F5F0] dark:bg-slate-800 border-b border-[#E5E8E0] dark:border-slate-700">
                      {['Date', 'Route', 'Bins Collected', 'Total Weight', 'Start Time', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-[#5C6B61] dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8E0] dark:divide-slate-700">
                    {HISTORY.map((h, i) => (
                      <tr key={i} className="hover:bg-[#F9FAF7] dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-4 text-sm font-bold text-[#1A2E22] dark:text-slate-200">{h.date}</td>
                        <td className="px-5 py-4 text-sm text-[#5C6B61] dark:text-slate-400">{h.route}</td>
                        <td className="px-5 py-4 text-sm font-bold text-[#2D5A3F] dark:text-emerald-400">{h.bins > 0 ? h.bins : '—'}</td>
                        <td className="px-5 py-4 text-sm text-[#1A2E22] dark:text-slate-200">{h.weight}</td>
                        <td className="px-5 py-4 text-sm text-[#5C6B61] dark:text-slate-400">{h.start}</td>
                        <td className="px-5 py-4">
                          <span className="eco-badge-green">{h.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {currentTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <div className="eco-card p-8 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-20 h-20 rounded-full bg-[#2D5A3F] text-white flex items-center justify-center text-4xl font-bold shrink-0">
                👷
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">{WORKER.name}</h3>
                  <p className="text-[#5C6B61] dark:text-slate-400 text-sm font-medium">{WORKER.role}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Worker ID', value: WORKER.id },
                    { label: 'Zone Assignment', value: WORKER.zone },
                    { label: 'Assigned Vehicle', value: WORKER.vehicle },
                    { label: 'Shift Hours', value: WORKER.shift },
                    { label: 'Contact', value: WORKER.phone },
                    { label: 'Experience', value: WORKER.experience },
                  ].map((f, i) => (
                    <div key={i} className="bg-[#F5F5F0] dark:bg-slate-800 p-3 rounded-xl border border-[#E5E8E0] dark:border-slate-700">
                      <div className="text-xs font-bold text-[#5C6B61] dark:text-slate-400 uppercase tracking-wide">{f.label}</div>
                      <div className="font-semibold text-[#1A2E22] dark:text-slate-100 mt-0.5">{f.value}</div>
                    </div>
                  ))}
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
