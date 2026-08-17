import React from 'react';
import NagpurMap from '../../components/NagpurMap';

export type AdminTab = 'overview' | 'complaints' | 'fleet' | 'workers' | 'zones' | 'reports' | 'settings';

interface AdminDashboardProps {
  activeTab?: string;
  onNavigate?: (tab: string) => void;
}

const MOCK_COMPLAINTS = [
  { id: 'NMC-2024-0841', type: 'wet', status: 'in_progress', severity: 4, area: 'Sitabuldi', time: '2h ago', citizen: 'Rahul Deshmukh' },
  { id: 'NMC-2024-0840', type: 'hazardous', status: 'submitted', severity: 5, area: 'Cotton Market', time: '3h ago', citizen: 'Seema Joshi' },
  { id: 'NMC-2024-0839', type: 'dry', status: 'resolved', severity: 2, area: 'Wardha Road', time: '1d ago', citizen: 'Amit Nair' },
  { id: 'NMC-2024-0838', type: 'e-waste', status: 'submitted', severity: 3, area: 'Ambedkar Sq', time: '1d ago', citizen: 'Priya Kolte' },
  { id: 'NMC-2024-0837', type: 'mixed', status: 'in_progress', severity: 3, area: 'Dharampeth', time: '2d ago', citizen: 'Vijay Bapat' },
  { id: 'NMC-2024-0836', type: 'wet', status: 'resolved', severity: 2, area: 'Gokulpeth', time: '3d ago', citizen: 'Meera Thakre' },
];

const MOCK_FLEET = [
  { id: 'NMC-T07', driver: 'Ramesh Sahu', zone: 'Zone A – Dharampeth', status: 'active', bins: 18, fuel: 72, lat: 21.1458, lng: 79.0882 },
  { id: 'NMC-T18', driver: 'Suresh Meshram', zone: 'Zone B – Civil Lines', status: 'active', bins: 22, fuel: 55, lat: 21.1535, lng: 79.0949 },
  { id: 'NMC-T33', driver: 'Anil Bhagat', zone: 'Zone C – Gandhibagh', status: 'idle', bins: 0, fuel: 88, lat: 21.1578, lng: 79.0780 },
  { id: 'NMC-T42', driver: 'Deepak Wankhede', zone: 'Zone B – Sitabuldi', status: 'active', bins: 14, fuel: 40, lat: 21.1388, lng: 79.0816 },
  { id: 'NMC-T55', driver: 'Kiran Bonde', zone: 'Zone D – Laxmi Nagar', status: 'maintenance', bins: 0, fuel: 0, lat: 21.1490, lng: 79.1012 },
];

const MOCK_WORKERS = [
  { id: 'W-001', name: 'Ramesh Sahu', zone: 'Zone A', role: 'Driver', shift: '6AM–2PM', status: 'on_duty', bins: 18, phone: '9823001111' },
  { id: 'W-002', name: 'Suresh Meshram', zone: 'Zone B', role: 'Driver', shift: '6AM–2PM', status: 'on_duty', bins: 22, phone: '9823002222' },
  { id: 'W-003', name: 'Anita Dhoble', zone: 'Zone A', role: 'Loader', shift: '6AM–2PM', status: 'on_duty', bins: 18, phone: '9823003333' },
  { id: 'W-004', name: 'Deepak Wankhede', zone: 'Zone B', role: 'Driver', shift: '6AM–2PM', status: 'on_duty', bins: 14, phone: '9823004444' },
  { id: 'W-005', name: 'Kiran Bonde', zone: 'Zone D', role: 'Driver', shift: 'Off', status: 'off_duty', bins: 0, phone: '9823005555' },
  { id: 'W-006', name: 'Lata Gawande', zone: 'Zone C', role: 'Supervisor', shift: '7AM–3PM', status: 'on_duty', bins: 0, phone: '9823006666' },
];

const MOCK_ZONES = [
  { name: 'Zone A – Dharampeth', ward: 14, bins: 210, activeBins: 195, fillAvg: 68, activeVehicles: 4, supervisor: 'Priya Deshpande', diversion: 84 },
  { name: 'Zone B – Civil Lines', ward: 8,  bins: 185, activeBins: 172, fillAvg: 72, activeVehicles: 3, supervisor: 'Ravi Kumar',       diversion: 79 },
  { name: 'Zone C – Gandhibagh', ward: 22, bins: 160, activeBins: 148, fillAvg: 55, activeVehicles: 2, supervisor: 'Suresh Patil',      diversion: 71 },
  { name: 'Zone D – Laxmi Nagar', ward: 31, bins: 240, activeBins: 230, fillAvg: 61, activeVehicles: 5, supervisor: 'Anjali Bhatt',      diversion: 88 },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    submitted:    'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    in_progress:  'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    resolved:     'bg-[#E3EBD8] text-[#2D5A3F] dark:bg-emerald-950 dark:text-emerald-300',
    active:       'bg-[#E3EBD8] text-[#2D5A3F] dark:bg-emerald-950 dark:text-emerald-300',
    idle:         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    maintenance:  'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    on_duty:      'bg-[#E3EBD8] text-[#2D5A3F] dark:bg-emerald-950 dark:text-emerald-300',
    off_duty:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  return map[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
};

const wasteIcon: Record<string, string> = { wet: '🥬', dry: '📦', hazardous: '☢️', 'e-waste': '🔌', mixed: '♻️' };

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab: propTab = 'overview',
}) => {
  // Sync tab with Left Sidebar selection
  const currentTab: AdminTab = (['overview', 'complaints', 'fleet', 'workers', 'zones', 'reports', 'settings'].includes(propTab) ? propTab : 'overview') as AdminTab;

  return (
    <div className="space-y-6 eco-animate-fade">
      {/* Top Header Card */}
      <div className="eco-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">Admin Control Centre</h1>
          <p className="text-[#5C6B61] dark:text-slate-400 text-sm mt-0.5">Nagpur SmartSanitation — Municipal Operations & Oversight Dashboard</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="eco-badge-green">
            <span className="w-2 h-2 rounded-full bg-[#1F402B] animate-pulse" />
            24 Fleet Active
          </span>
          <span className="bg-rose-100 dark:bg-rose-950 dark:text-rose-300 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">
            3 Critical Bins
          </span>
          <span className="bg-amber-100 dark:bg-amber-950 dark:text-amber-300 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
            12 Pending Complaints
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">

        {/* ── OVERVIEW ── */}
        {currentTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Waste Diverted Today', value: '48.2t', icon: '♻️', color: '#2D5A3F', delta: '+6% vs yesterday' },
                { label: 'Active Fleet Vehicles', value: '24/28', icon: '🚛', color: '#8B6D4C', delta: '4 in maintenance' },
                { label: 'Citizen Complaints', value: '12', icon: '📋', color: '#b45309', delta: '5 resolved today' },
                { label: 'Avg. Collection Rate', value: '86%', icon: '📈', color: '#1d4ed8', delta: 'Target: 90%' },
              ].map((kpi, i) => (
                <div key={i} className="eco-card p-6 flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#E3EBD8] dark:bg-slate-800 flex items-center justify-center text-2xl">
                      {kpi.icon}
                    </div>
                    <span className="text-xs font-semibold text-[#5C6B61] dark:text-slate-400">{kpi.delta}</span>
                  </div>
                  <div className="mt-3">
                    <div className="text-3xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">{kpi.value}</div>
                    <div className="text-sm text-[#5C6B61] dark:text-slate-400 font-medium mt-1">{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map + System Log */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 eco-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">Live Fleet & Zone Map – Nagpur</h2>
                  <span className="eco-badge-green"><span className="w-2 h-2 rounded-full bg-[#1F402B] animate-pulse" />Live</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[#E5E8E0] dark:border-slate-700 h-80">
                  <NagpurMap className="w-full h-full" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="eco-card p-6">
                  <h3 className="text-lg font-serif font-bold text-[#1A2E22] dark:text-slate-100 mb-4">Diversion by Zone</h3>
                  <div className="space-y-3">
                    {MOCK_ZONES.map(z => (
                      <div key={z.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-[#1A2E22] dark:text-slate-200 truncate max-w-[140px]">{z.name.split('–')[1]?.trim()}</span>
                          <span className="font-bold text-[#2D5A3F] dark:text-emerald-400">{z.diversion}%</span>
                        </div>
                        <div className="w-full bg-[#E5E8E0] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div style={{ width: `${z.diversion}%` }} className="bg-[#2D5A3F] dark:bg-emerald-500 h-full rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="eco-card p-6">
                  <h3 className="text-lg font-serif font-bold text-[#1A2E22] dark:text-slate-100 mb-4">Today's System Log</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { dot: 'bg-rose-500', time: '10:42 AM', msg: 'Bin #452 Zone B – Critical' },
                      { dot: 'bg-[#2D5A3F]', time: '09:15 AM', msg: 'Route optimization Sector 3' },
                      { dot: 'bg-[#8B6D4C]', time: '08:30 AM', msg: 'All vehicles dispatched' },
                    ].map((l, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${l.dot}`} />
                        <div>
                          <span className="text-[11px] font-bold text-[#8C988F] dark:text-slate-400 block">{l.time}</span>
                          <span className="text-[#1A2E22] dark:text-slate-200 font-medium">{l.msg}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLAINTS ── */}
        {currentTab === 'complaints' && (
          <div className="space-y-6">
            <div className="eco-card p-6">
              <h2 className="text-2xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">Citizen Complaints Management</h2>
              <p className="text-[#5C6B61] dark:text-slate-400 text-sm mt-1">Review, assign, and resolve waste reports from Nagpur residents.</p>
            </div>

            <div className="eco-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F5F0] dark:bg-slate-800 border-b border-[#E5E8E0] dark:border-slate-700">
                      {['Ticket ID', 'Type', 'Citizen', 'Area', 'Severity', 'Status', 'Time', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-[#5C6B61] dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8E0] dark:divide-slate-700">
                    {MOCK_COMPLAINTS.map(c => (
                      <tr key={c.id} className="hover:bg-[#F9FAF7] dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-4 font-mono text-sm font-bold text-[#2D5A3F] dark:text-emerald-400">{c.id}</td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-[#1A2E22] dark:text-slate-200">
                            {wasteIcon[c.type]} <span className="capitalize">{c.type}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#1A2E22] dark:text-slate-200 font-medium">{c.citizen}</td>
                        <td className="px-5 py-4 text-sm text-[#5C6B61] dark:text-slate-400">{c.area}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <span key={n} className={`w-2 h-2 rounded-full ${n <= c.severity ? 'bg-rose-500' : 'bg-[#E5E8E0] dark:bg-slate-700'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusBadge(c.status)}`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#5C6B61] dark:text-slate-400">{c.time}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button className="text-xs bg-[#E3EBD8] dark:bg-emerald-950 dark:text-emerald-300 text-[#2D5A3F] font-bold px-2.5 py-1 rounded-lg hover:bg-[#D0DFCA] transition-colors">Assign</button>
                            <button className="text-xs bg-[#F5F5F0] dark:bg-slate-800 dark:text-slate-300 text-[#5C6B61] font-bold px-2.5 py-1 rounded-lg hover:bg-[#E8E8E0] transition-colors">View</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── FLEET ── */}
        {currentTab === 'fleet' && (
          <div className="space-y-6">
            <div className="eco-card p-6">
              <h2 className="text-2xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">Fleet Management</h2>
              <p className="text-[#5C6B61] dark:text-slate-400 text-sm mt-1">Real-time vehicle tracking, fuel monitoring, and route assignment.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 eco-card p-6">
                <h3 className="text-lg font-serif font-bold text-[#1A2E22] dark:text-slate-100 mb-4">Fleet Locations – Live Map</h3>
                <div className="rounded-2xl overflow-hidden border border-[#E5E8E0] dark:border-slate-700 h-80">
                  <NagpurMap className="w-full h-full" />
                </div>
              </div>

              <div className="eco-card p-6">
                <h3 className="text-lg font-serif font-bold text-[#1A2E22] dark:text-slate-100 mb-4">Vehicle Status</h3>
                <div className="space-y-3">
                  {MOCK_FLEET.map(v => (
                    <div key={v.id} className="p-3 rounded-xl bg-[#F5F5F0] dark:bg-slate-800 border border-[#E5E8E0] dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🚛</span>
                          <span className="font-bold text-sm text-[#1A2E22] dark:text-slate-100">{v.id}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(v.status)}`}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-[#5C6B61] dark:text-slate-300 font-medium">{v.driver}</div>
                      <div className="text-xs text-[#5C6B61] dark:text-slate-400">{v.zone}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKERS ── */}
        {currentTab === 'workers' && (
          <div className="space-y-6">
            <div className="eco-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">Sanitation Worker Registry</h2>
                <p className="text-[#5C6B61] dark:text-slate-400 text-sm mt-1">Shift management, attendance tracking, and performance overview.</p>
              </div>
              <button className="eco-button-primary text-sm self-start md:self-auto">+ Add Worker</button>
            </div>

            <div className="eco-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F5F0] dark:bg-slate-800 border-b border-[#E5E8E0] dark:border-slate-700">
                      {['ID', 'Name', 'Role', 'Zone', 'Shift', 'Bins Collected', 'Status', 'Contact'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-[#5C6B61] dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8E0] dark:divide-slate-700">
                    {MOCK_WORKERS.map(w => (
                      <tr key={w.id} className="hover:bg-[#F9FAF7] dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-4 font-mono text-sm font-bold text-[#5C6B61] dark:text-slate-400">{w.id}</td>
                        <td className="px-5 py-4 font-semibold text-sm text-[#1A2E22] dark:text-slate-200">{w.name}</td>
                        <td className="px-5 py-4 text-sm text-[#5C6B61] dark:text-slate-400">{w.role}</td>
                        <td className="px-5 py-4 text-sm text-[#5C6B61] dark:text-slate-400">{w.zone}</td>
                        <td className="px-5 py-4 text-sm text-[#1A2E22] dark:text-slate-200 font-medium">{w.shift}</td>
                        <td className="px-5 py-4 text-sm font-bold text-[#2D5A3F] dark:text-emerald-400">{w.bins > 0 ? w.bins : '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(w.status)}`}>
                            {w.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#5C6B61] dark:text-slate-400 font-mono">{w.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ZONES ── */}
        {currentTab === 'zones' && (
          <div className="space-y-6">
            <div className="eco-card p-6">
              <h2 className="text-2xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">Zone Management</h2>
              <p className="text-[#5C6B61] dark:text-slate-400 text-sm mt-1">Ward-wise collection performance, bin fill status, and supervisor assignments.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {MOCK_ZONES.map(z => (
                <div key={z.name} className="eco-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">{z.name}</h3>
                      <p className="text-xs text-[#5C6B61] dark:text-slate-400 mt-0.5 font-medium">Ward {z.ward} · Supervisor: {z.supervisor}</p>
                    </div>
                    <span className="eco-badge-green text-base font-bold">{z.diversion}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { label: 'Total Bins', value: z.bins, icon: '🗑️' },
                      { label: 'Online Bins', value: z.activeBins, icon: '📡' },
                      { label: 'Avg. Fill', value: `${z.fillAvg}%`, icon: '📊' },
                      { label: 'Vehicles', value: z.activeVehicles, icon: '🚛' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#F5F5F0] dark:bg-slate-800 p-3 rounded-xl border border-[#E5E8E0] dark:border-slate-700">
                        <div className="text-base">{item.icon}</div>
                        <div className="text-lg font-serif font-bold text-[#1A2E22] dark:text-slate-100 mt-1">{item.value}</div>
                        <div className="text-xs text-[#5C6B61] dark:text-slate-400">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
