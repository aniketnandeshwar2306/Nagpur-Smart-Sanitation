import React, { useState, useEffect } from 'react';
import NagpurMap from '../../components/NagpurMap';
import type { MapMarker } from '../../components/NagpurMap';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export type WorkerTab = 'dashboard' | 'route' | 'bins' | 'history' | 'profile';

interface WorkerDashboardProps {
  activeTab?: string;
  onNavigate?: (tab: string) => void;
}

interface LeaveRecord {
  leave_id: string;
  worker_id: string;
  worker_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  days: number;
  status: string;
  applied_at: string;
}

const WORKER = {
  id: 'W-002',
  name: 'Ramesh Gawande',
  role: 'Senior Sanitation Collector',
  zone: 'Zone 2 – Dharampeth & Sitabuldi',
  vehicle: 'NMC-T104',
  shift: '06:00 AM – 02:00 PM',
  phone: '+91 98231 44556',
  experience: '6 years',
  rating: 4.9,
  totalCollections: 2847,
};

const ROUTE_BINS = [
  { id: 'BIN-B01', location: 'Civil Lines – Near Bus Stand', fill: 94, status: 'critical', collected: false, lat: 21.1535, lng: 79.0949 },
  { id: 'BIN-B02', location: 'Sitabuldi – Market Gate', fill: 78, status: 'high', collected: false, lat: 21.1388, lng: 79.0816 },
  { id: 'BIN-B03', location: 'Dharampeth – College Square', fill: 62, status: 'normal', collected: true, lat: 21.1458, lng: 79.0882 },
  { id: 'BIN-B04', location: 'Gokulpeth – Main Road', fill: 45, status: 'normal', collected: true, lat: 21.1420, lng: 79.0960 },
  { id: 'BIN-B05', location: 'Itwari – Old Market', fill: 88, status: 'high', collected: false, lat: 21.1490, lng: 79.0840 },
  { id: 'BIN-B06', location: 'Wardha Road – Junction', fill: 35, status: 'normal', collected: true, lat: 21.1400, lng: 79.0750 },
];

const INITIAL_HISTORY = [
  { date: 'Today', bins: 14, route: 'Zone 2 – Route 4', weight: '3.2t', start: '06:05 AM', status: 'In Progress' },
  { date: 'Yesterday', bins: 22, route: 'Zone 2 – Route 4', weight: '5.1t', start: '06:00 AM', status: 'Completed' },
  { date: 'Mon, Aug 16', bins: 20, route: 'Zone 2 – Route 3', weight: '4.8t', start: '06:10 AM', status: 'Completed' },
  { date: 'Sun, Aug 15', bins: 0, route: '—', weight: '—', start: '—', status: 'Off Day' },
  { date: 'Sat, Aug 14', bins: 24, route: 'Zone 2 – Route 4', weight: '5.6t', start: '06:00 AM', status: 'Completed' },
];

const INITIAL_LEAVES: LeaveRecord[] = [
  {
    leave_id: 'LV-2026-8921',
    worker_id: 'W-002',
    worker_name: 'Ramesh Gawande',
    leave_type: 'Casual Leave',
    start_date: '2026-08-10',
    end_date: '2026-08-11',
    reason: 'Family ceremony in Wardha',
    days: 2,
    status: 'Approved',
    applied_at: '2026-08-05T08:00:00Z',
  },
];

const fillColor = (fill: number) => {
  if (fill >= 90) return 'bg-rose-500';
  if (fill >= 75) return 'bg-amber-500';
  return 'bg-emerald-600';
};

const fillBadge = (status: string) => {
  if (status === 'critical') return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
  if (status === 'high') return 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
};

const TRUCK_MARKERS: MapMarker[] = [
  { lat: 21.1458, lng: 79.0882, label: 'NMC-T104 – Your Vehicle (Active)', type: 'truck' },
  ...ROUTE_BINS.map(b => ({ lat: b.lat, lng: b.lng, label: b.location, type: 'bin' as const })),
];

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  activeTab: propTab = 'dashboard',
}) => {
  const currentTab: WorkerTab = (['dashboard', 'route', 'bins', 'history', 'profile'].includes(propTab) ? propTab : 'dashboard') as WorkerTab;
  const { user } = useAuth();

  const [etaSeconds, setEtaSeconds] = useState(254);
  const [collectedBins, setCollectedBins] = useState(
    ROUTE_BINS.reduce((acc, b) => ({ ...acc, [b.id]: b.collected }), {} as Record<string, boolean>)
  );

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('2026-08-20');
  const [endDate, setEndDate] = useState('2026-08-21');
  const [reason, setReason] = useState('');
  const [leavesList, setLeavesList] = useState<LeaveRecord[]>(() => {
    try {
      const cached = localStorage.getItem('nss_worker_leaves');
      return cached ? JSON.parse(cached) : INITIAL_LEAVES;
    } catch {
      return INITIAL_LEAVES;
    }
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Leave balances
  const [balances, setBalances] = useState({
    casual: 8,
    sick: 6,
    earned: 14,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch leaves from backend
  const loadLeaves = () => {
    const workerId = user?.id || 'W-002';
    fetch(`${API_BASE_URL}/api/worker/leaves?worker_id=${encodeURIComponent(workerId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.history && data.history.length > 0) {
          setLeavesList(prev => {
            const seen = new Set(data.history.map((h: LeaveRecord) => h.leave_id));
            const merged = [...data.history, ...prev.filter(p => !seen.has(p.leave_id))];
            try {
              localStorage.setItem('nss_worker_leaves', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
        if (data.balance) {
          setBalances({
            casual: data.balance.casual_leave_remaining ?? 8,
            sick: data.balance.sick_leave_remaining ?? 6,
            earned: data.balance.earned_leave_remaining ?? 14,
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadLeaves();
  }, [user?.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    // Calculate days duration
    let daysCount = 1;
    try {
      const s = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (end >= s) {
        daysCount = Math.round((end - s) / (1000 * 3600 * 24)) + 1;
      }
    } catch {
      daysCount = 1;
    }

    const newRecord: LeaveRecord = {
      leave_id: `LV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      worker_id: user?.id || 'W-002',
      worker_name: user?.name || 'Suresh Meshram',
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim(),
      days: daysCount,
      status: 'Pending Approval',
      applied_at: new Date().toISOString(),
    };

    try {
      await fetch(`${API_BASE_URL}/api/worker/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
    } catch (err) {
      console.warn('[Worker] Offline leave submit fallback:', err);
    }

    setLeavesList(prev => {
      const updated = [newRecord, ...prev];
      try {
        localStorage.setItem('nss_worker_leaves', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(`✓ Leave request ${newRecord.leave_id} (${daysCount} day${daysCount > 1 ? 's' : ''}) submitted to Supervisor!`);
    setIsLeaveModalOpen(false);
    setReason('');
  };

  const toggleBinCollected = (binId: string) => {
    setCollectedBins(prev => {
      const next = !prev[binId];
      showToast(next ? `✓ Bin ${binId} marked as Collected!` : `Bin ${binId} marked pending.`);
      return { ...prev, [binId]: next };
    });
  };

  const eta = `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s`;
  const totalCollected = Object.values(collectedBins).filter(Boolean).length;
  const totalBins = ROUTE_BINS.length;

  return (
    <div className="space-y-6 eco-animate-fade pb-12 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-300 border border-emerald-500/40 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Worker Header Card */}
      <div className="bg-[#1E3E2B] dark:bg-slate-900 text-white rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border border-[#142B1E] dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-white/10 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold border border-white/10 dark:border-slate-700 shadow-inner">
            👷
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{WORKER.name}</h1>
            <p className="text-emerald-100/80 dark:text-slate-300 text-sm font-medium">{WORKER.role} · {WORKER.zone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/10 dark:bg-slate-800 border border-white/15 dark:border-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-100 flex items-center gap-2">
            🚛 {WORKER.vehicle}
          </div>
          <div className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            On Duty
          </div>
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>📝</span> Apply for Leave
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">

        {/* ── DASHBOARD ── */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Assigned Bins', value: `${totalCollected} / ${totalBins}`, icon: '🗑️', detail: `${totalBins - totalCollected} remaining` },
                { label: 'Next Stop ETA', value: eta, icon: '⏱️', detail: 'Civil Lines – Bus Stand' },
                { label: 'Shift Progress', value: `${Math.round((totalCollected / totalBins) * 100)}%`, icon: '📊', detail: 'Target: 100%' },
                { label: 'Supervisor Rating', value: `${WORKER.rating} ★`, icon: '⭐', detail: 'Top 5% in Ward 14' },
              ].map((k, i) => (
                <div key={i} className="eco-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{k.icon}</span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{k.detail}</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{k.value}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{k.label}</div>
                </div>
              ))}
            </div>

            {/* Live Map & Action Queue */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 eco-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Today&apos;s Collection Route</h2>
                  <span className="eco-badge-green"><span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />Active Route</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-80">
                  <NagpurMap markers={TRUCK_MARKERS} className="w-full h-full" />
                </div>
              </div>

              {/* Next Bins Checklist */}
              <div className="eco-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Next Bin Stops</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{totalCollected}/{totalBins} done</span>
                </div>
                <div className="space-y-3">
                  {ROUTE_BINS.map(b => (
                    <div
                      key={b.id}
                      className={`p-3 rounded-xl border transition-all ${
                        collectedBins[b.id]
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{b.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fillBadge(b.status)}`}>
                          {b.fill}% full
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate mb-2">{b.location}</div>
                      <button
                        onClick={() => toggleBinCollected(b.id)}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          collectedBins[b.id]
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {collectedBins[b.id] ? '✓ Collected' : 'Mark Collected'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ROUTE MAP TAB ── */}
        {currentTab === 'route' && (
          <div className="space-y-6">
            <div className="eco-card p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Assigned Collection Route Map</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Zone 2 Dharampeth • Optimized AI route sequence for morning shift.</p>
            </div>
            <div className="eco-card p-6">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-[480px]">
                <NagpurMap markers={TRUCK_MARKERS} className="w-full h-full" />
              </div>
            </div>
          </div>
        )}

        {/* ── BINS CHECKLIST ── */}
        {currentTab === 'bins' && (
          <div className="space-y-6">
            <div className="eco-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Smart Bin Route Checklist</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Tick off bins as you complete pickup along your route.</p>
              </div>
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl">
                {totalCollected} of {totalBins} Bins Cleared
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ROUTE_BINS.map(b => (
                <div key={b.id} className="eco-card p-5 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300">{b.id}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${fillBadge(b.status)}`}>
                        {b.fill}% Fill Level
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{b.location}</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                      <div style={{ width: `${b.fill}%` }} className={`${fillColor(b.fill)} h-full rounded-full`} />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleBinCollected(b.id)}
                    className={`w-full mt-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      collectedBins[b.id]
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    }`}
                  >
                    {collectedBins[b.id] ? '✓ Collection Confirmed' : 'Mark as Collected'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY & LEAVE TAB ── */}
        {currentTab === 'history' && (
          <div className="space-y-6">
            <div className="eco-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Shift &amp; Leave History</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Review past route shifts, tonnage collected, and submitted leave requests.</p>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="eco-button-primary text-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
              >
                <span>📝</span> Apply for Leave
              </button>
            </div>

            {/* Leave Applications Table */}
            <div className="eco-card overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">My Leave Applications</h3>
                <span className="text-xs text-slate-500 font-medium">Ward Supervisor Approval Queue</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                      {['Leave ID', 'Type', 'Dates', 'Days', 'Reason', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {leavesList.map(l => (
                      <tr key={l.leave_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{l.leave_id}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-100">{l.leave_type}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{l.start_date} to {l.end_date}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">{l.days} day(s)</td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{l.reason}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            l.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shift History Table */}
            <div className="eco-card overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Past 5 Days Shift Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                      {['Date', 'Route', 'Bins Collected', 'Total Weight', 'Start Time', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {INITIAL_HISTORY.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{h.date}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{h.route}</td>
                        <td className="px-5 py-4 text-sm font-bold text-emerald-800 dark:text-emerald-300">{h.bins > 0 ? h.bins : '—'}</td>
                        <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200">{h.weight}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{h.start}</td>
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

        {/* ── PROFILE & LEAVE BALANCES ── */}
        {currentTab === 'profile' && (
          <div className="space-y-6 max-w-4xl">
            {/* Profile Overview */}
            <div className="eco-card p-6 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-20 h-20 rounded-2xl bg-[#1E3E2B] dark:bg-slate-800 text-white flex items-center justify-center text-4xl font-bold shrink-0 border border-[#142B1E] dark:border-slate-700 shadow-inner">
                👷
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{WORKER.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{WORKER.role}</p>
                  </div>
                  <button
                    onClick={() => setIsLeaveModalOpen(true)}
                    className="eco-button-primary text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📝</span> Apply for Leave
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: 'Worker ID', value: WORKER.id },
                    { label: 'Zone Assignment', value: WORKER.zone },
                    { label: 'Assigned Vehicle', value: WORKER.vehicle },
                    { label: 'Shift Hours', value: WORKER.shift },
                    { label: 'Contact Phone', value: WORKER.phone },
                    { label: 'Experience', value: WORKER.experience },
                  ].map((f, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{f.label}</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leave Balance Counters */}
            <div className="eco-card p-6 space-y-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Annual Leave Balances (2026)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Casual Leave (CL)</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{balances.casual} Days</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Available</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Sick Leave (SL)</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{balances.sick} Days</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Medical certified</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Earned Leave (EL)</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{balances.earned} Days</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Carry forward</div>
                </div>
              </div>
            </div>

            {/* Leave Applications History & Approvals Table */}
            <div className="eco-card p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Leave Applications & Approvals</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Track real-time supervisor approvals and leave statuses</p>
                </div>
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="eco-button-primary text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+</span> New Leave Application
                </button>
              </div>

              {leavesList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No leave applications recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Application ID</th>
                        <th className="py-2.5 px-3">Leave Type</th>
                        <th className="py-2.5 px-3">Dates (From &rarr; To)</th>
                        <th className="py-2.5 px-3">Days</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {leavesList.map((l) => (
                        <tr key={l.leave_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{l.leave_id}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{l.leave_type}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{l.start_date} &rarr; {l.end_date}</td>
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">{l.days} Day{l.days > 1 ? 's' : ''}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{l.reason}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block border ${
                              l.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL: APPLY FOR LEAVE ── */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>📝</span> Apply for Leave
              </h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-sm">✕</button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Sick Leave">Sick Leave (SL)</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Earned Leave">Earned Leave (EL)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the reason for leave application..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="eco-button-primary cursor-pointer"
                >
                  Submit Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
