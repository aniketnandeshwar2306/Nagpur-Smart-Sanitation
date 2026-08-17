import React, { useState, useEffect } from 'react';
import NagpurMap from '../../components/NagpurMap';
import { API_BASE_URL } from '../../config/api';

export type AdminTab = 'overview' | 'complaints' | 'fleet' | 'workers' | 'zones' | 'reports' | 'settings';

interface AdminDashboardProps {
  activeTab?: string;
  onNavigate?: (tab: string) => void;
}

interface Complaint {
  id: string;
  type: string;
  status: string;
  severity: number;
  area: string;
  time: string;
  citizen: string;
  phone?: string;
  assignedTo?: string;
  imageUrl?: string;
  description?: string;
}

interface Worker {
  id: string;
  name: string;
  zone: string;
  role: string;
  shift: string;
  status: string;
  bins: number;
  phone: string;
  vehicle?: string;
}

const INITIAL_COMPLAINTS: Complaint[] = [
  { id: 'NMC-2026-0841', type: 'wet', status: 'in_progress', severity: 4, area: 'Sitabuldi Ward 12', time: '2h ago', citizen: 'Rahul Deshmukh', phone: '+91 98230 44112', assignedTo: 'W-002 Ramesh Gawande', imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60', description: 'Heavy accumulation of wet vegetable scraps near market entrance.' },
  { id: 'NMC-2026-0840', type: 'hazardous', status: 'submitted', severity: 5, area: 'Cotton Market', time: '3h ago', citizen: 'Seema Joshi', phone: '+91 98231 55223', assignedTo: 'Inspector Vijay Deshmukh', imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60', description: 'Broken glass and chemical container dumped on sidewalk.' },
  { id: 'NMC-2026-0839', type: 'dry', status: 'resolved', severity: 2, area: 'Wardha Road', time: '1d ago', citizen: 'Amit Nair', phone: '+91 98232 66334', assignedTo: 'W-001 Rajesh Kumar', imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=60', description: 'Cardboard cartons and polythene litter near commercial complex.' },
  { id: 'NMC-2026-0838', type: 'e-waste', status: 'submitted', severity: 3, area: 'Ambedkar Sq', time: '1d ago', citizen: 'Priya Kolte', phone: '+91 98233 77445', assignedTo: 'Unassigned', imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=60', description: 'Discarded computer monitors and printer peripherals.' },
  { id: 'NMC-2026-0837', type: 'mixed', status: 'in_progress', severity: 3, area: 'Dharampeth', time: '2d ago', citizen: 'Vijay Bapat', phone: '+91 98234 88556', assignedTo: 'W-004 Prakash Patil', imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60', description: 'Overflowing residential bin requiring secondary tipper support.' },
  { id: 'NMC-2026-0836', type: 'wet', status: 'resolved', severity: 2, area: 'Gokulpeth', time: '3d ago', citizen: 'Meera Thakre', phone: '+91 98235 99667', assignedTo: 'W-002 Ramesh Gawande', imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=60', description: 'Compost overflow collected and sanitized with bleaching powder.' },
];

const INITIAL_WORKERS: Worker[] = [
  { id: 'W-001', name: 'Rajesh Kumar', zone: 'Zone A – Laxmi Nagar', role: 'Driver', shift: '06:00 – 14:00', status: 'active', bins: 24, phone: '+91 98230 11223', vehicle: 'NMC-T101' },
  { id: 'W-002', name: 'Ramesh Gawande', zone: 'Zone B – Dharampeth', role: 'Senior Collector', shift: '06:00 – 14:00', status: 'active', bins: 18, phone: '+91 98231 44556', vehicle: 'NMC-T104' },
  { id: 'W-003', name: 'Sunil Meshram', zone: 'Zone C – Hanuman Nagar', role: 'Driver', shift: '14:00 – 22:00', status: 'on_duty', bins: 22, phone: '+91 98232 77889', vehicle: 'NMC-T108' },
  { id: 'W-004', name: 'Prakash Patil', zone: 'Zone D – Dhantoli', role: 'Sweeper Lead', shift: '06:00 – 14:00', status: 'active', bins: 31, phone: '+91 98233 99001', vehicle: 'NMC-T112' },
  { id: 'W-005', name: 'Kishore Bhende', zone: 'Zone E – Mangalwari', role: 'Collector', shift: '22:00 – 06:00', status: 'off_duty', bins: 0, phone: '+91 98234 22334', vehicle: 'NMC-T115' },
  { id: 'W-006', name: 'Lata Gawande', zone: 'Zone B – Dharampeth', role: 'Ward Supervisor', shift: '07:00 – 15:00', status: 'active', bins: 0, phone: '+91 98235 33445', vehicle: 'NMC-INSP-02' },
];

const MOCK_FLEET = [
  { id: 'NMC-T101', driver: 'Rajesh Kumar', zone: 'Zone A – Laxmi Nagar', status: 'active', bins: 24, fuel: 78, lat: 21.1315, lng: 79.0620 },
  { id: 'NMC-T104', driver: 'Ramesh Gawande', zone: 'Zone B – Dharampeth', status: 'active', bins: 18, fuel: 65, lat: 21.1458, lng: 79.0882 },
  { id: 'NMC-T108', driver: 'Sunil Meshram', zone: 'Zone C – Hanuman Nagar', status: 'active', bins: 22, fuel: 82, lat: 21.1290, lng: 79.1020 },
  { id: 'NMC-T112', driver: 'Prakash Patil', zone: 'Zone D – Dhantoli', status: 'active', bins: 31, fuel: 45, lat: 21.1390, lng: 79.0830 },
  { id: 'NMC-T115', driver: 'Kishore Bhende', zone: 'Zone E – Mangalwari', status: 'idle', bins: 0, fuel: 90, lat: 21.1620, lng: 79.0740 },
];

const MOCK_ZONES = [
  { name: 'Zone 1 – Laxmi Nagar', ward: 1, bins: 210, activeBins: 195, fillAvg: 68, activeVehicles: 4, supervisor: 'Priya Deshpande', diversion: 88, compliance: '94%' },
  { name: 'Zone 2 – Dharampeth', ward: 2, bins: 185, activeBins: 172, fillAvg: 72, activeVehicles: 3, supervisor: 'Vijay Deshmukh', diversion: 84, compliance: '92%' },
  { name: 'Zone 3 – Hanuman Nagar', ward: 3, bins: 160, activeBins: 148, fillAvg: 55, activeVehicles: 3, supervisor: 'Suresh Patil', diversion: 79, compliance: '89%' },
  { name: 'Zone 4 – Dhantoli', ward: 4, bins: 240, activeBins: 230, fillAvg: 61, activeVehicles: 5, supervisor: 'Anjali Bhatt', diversion: 91, compliance: '96%' },
];

const AUDIT_RECORDS = [
  { month: 'August 2026', totalWasteTons: '1,420 t', wetTons: '820 t', dryTons: '510 t', hazardousTons: '90 t', complianceScore: '94.2%', slaHours: '4.2h', penaltiesLevied: '₹14,500' },
  { month: 'July 2026', totalWasteTons: '1,385 t', wetTons: '790 t', dryTons: '505 t', hazardousTons: '90 t', complianceScore: '92.8%', slaHours: '4.8h', penaltiesLevied: '₹18,000' },
  { month: 'June 2026', totalWasteTons: '1,310 t', wetTons: '750 t', dryTons: '480 t', hazardousTons: '80 t', complianceScore: '91.4%', slaHours: '5.1h', penaltiesLevied: '₹22,500' },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    on_duty: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    idle: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    off_duty: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    maintenance: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };
  return map[status] || 'bg-slate-100 text-slate-600 border-slate-200';
};

const wasteIcon: Record<string, string> = { wet: '🥬', dry: '📦', hazardous: '☢️', 'e-waste': '🔌', mixed: '♻️' };

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab: propTab = 'overview',
}) => {
  const currentTab: AdminTab = (['overview', 'complaints', 'fleet', 'workers', 'zones', 'reports', 'settings'].includes(propTab) ? propTab : 'overview') as AdminTab;

  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);

  // Modals state
  const [assignModalTicket, setAssignModalTicket] = useState<Complaint | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('W-002 Ramesh Gawande');
  const [viewModalTicket, setViewModalTicket] = useState<Complaint | null>(null);
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New worker form
  const [newWorker, setNewWorker] = useState({
    name: '',
    role: 'Collector',
    zone: 'Zone 2 – Dharampeth',
    shift: '06:00 – 14:00',
    phone: '',
    vehicle: 'NMC Tipper',
  });

  // Fetch live complaints & workers from MongoDB on load
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/complaints`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Complaint[] = data.map((d: any) => ({
            id: d.ticket_id,
            type: d.waste_type || 'dry',
            status: d.status || 'submitted',
            severity: d.severity || 3,
            area: d.assigned_authority?.department || 'Nagpur Zone',
            time: d.created_at ? new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            citizen: d.citizen_name || 'Nagpur Resident',
            phone: '+91 98231 44556',
            assignedTo: d.assigned_authority?.name || 'Unassigned',
            imageUrl: d.image_url,
            description: d.description,
          }));
          setComplaints(mapped);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/api/worker/workers`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setWorkers(data);
        }
      })
      .catch(() => {});
  }, []);

  // Listen to live complaints from citizen submissions
  useEffect(() => {
    const handleNewComplaint = (evt: Event) => {
      const customEvt = evt as CustomEvent;
      if (customEvt.detail) {
        const item = customEvt.detail;
        const newEntry: Complaint = {
          id: item.ticket_id || `NMC-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
          type: item.waste_type || 'dry',
          status: item.status || 'submitted',
          severity: item.severity || 3,
          area: 'Ward 14 (Geotagged)',
          time: 'Just now',
          citizen: item.citizen_name || 'Nagpur Resident',
          phone: '+91 98231 44556',
          assignedTo: item.assigned_authority?.name || 'Inspector Vijay Deshmukh',
          imageUrl: item.image_url,
          description: item.description || 'Civic solid waste report with geotagged photo.',
        };
        setComplaints(prev => [newEntry, ...prev]);
        showToast(`🔔 New complaint ${newEntry.id} registered!`);
      }
    };

    window.addEventListener('complaint-submitted', handleNewComplaint);
    return () => window.removeEventListener('complaint-submitted', handleNewComplaint);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalTicket) return;

    try {
      await fetch(`${API_BASE_URL}/api/worker/complaints/${assignModalTicket.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_name: selectedAssignee }),
      });
    } catch {
      // Local fallback
    }

    setComplaints(prev =>
      prev.map(c => (c.id === assignModalTicket.id ? { ...c, status: 'in_progress', assignedTo: selectedAssignee } : c))
    );
    showToast(`✓ Ticket ${assignModalTicket.id} assigned to ${selectedAssignee}!`);
    setAssignModalTicket(null);
  };

  const handleAddWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorker.name || !newWorker.phone) return;

    const workerId = `W-00${workers.length + 1}`;
    const entry: Worker = {
      id: workerId,
      name: newWorker.name,
      role: newWorker.role,
      zone: newWorker.zone,
      shift: newWorker.shift,
      phone: newWorker.phone,
      vehicle: newWorker.vehicle,
      status: 'active',
      bins: 0,
    };

    try {
      await fetch(`${API_BASE_URL}/api/worker/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {
      // Local fallback
    }

    setWorkers(prev => [...prev, entry]);
    showToast(`✓ Worker ${entry.name} (${workerId}) added successfully!`);
    setIsAddWorkerOpen(false);
    setNewWorker({ name: '', role: 'Collector', zone: 'Zone 2 – Dharampeth', shift: '06:00 – 14:00', phone: '', vehicle: 'NMC Tipper' });
  };

  const handleDownloadCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Month,Total Waste Tons,Wet Tons,Dry Tons,Hazardous Tons,Compliance,SLA Resolution\n' +
      AUDIT_RECORDS.map(r => `${r.month},${r.totalWasteTons},${r.wetTons},${r.dryTons},${r.hazardousTons},${r.complianceScore},${r.slaHours}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Nagpur_SmartSanitation_Audit_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Audit CSV downloaded successfully!');
  };

  return (
    <div className="space-y-6 eco-animate-fade relative pb-10">
      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-300 border border-emerald-500/40 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="eco-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Admin Control Centre</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">Nagpur SmartSanitation • Municipal Operations &amp; Oversight Dashboard</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="eco-badge-green">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            24 Fleet Active
          </span>
          <span className="bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 text-rose-800 border border-rose-200 dark:border-rose-800 text-xs font-bold px-3 py-1 rounded-full">
            3 Critical Bins
          </span>
          <span className="bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 text-amber-900 border border-amber-200 dark:border-amber-800 text-xs font-bold px-3 py-1 rounded-full">
            {complaints.filter(c => c.status !== 'resolved').length} Pending Complaints
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">

        {/* ── OVERVIEW ── */}
        {currentTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Waste Diverted Today', value: '48.2 t', icon: '♻️', delta: '+6% vs yesterday' },
                { label: 'Active Fleet Vehicles', value: '24 / 28', icon: '🚛', delta: '4 in maintenance' },
                { label: 'Citizen Grievances', value: `${complaints.length}`, icon: '📋', delta: `${complaints.filter(c => c.status === 'resolved').length} resolved` },
                { label: 'Avg. Collection SLA', value: '94.2%', icon: '📈', delta: 'Target: 90%' },
              ].map((k, i) => (
                <div key={i} className="eco-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{k.icon}</span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{k.delta}</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{k.value}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{k.label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 eco-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Live Fleet &amp; Zone Map – Nagpur</h2>
                  <span className="eco-badge-green"><span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />Live</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-80">
                  <NagpurMap className="w-full h-full" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="eco-card p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-4">Diversion by Zone</h3>
                  <div className="space-y-3">
                    {MOCK_ZONES.map(z => (
                      <div key={z.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{z.name.split('–')[1]?.trim()}</span>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">{z.diversion}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div style={{ width: `${z.diversion}%` }} className="bg-emerald-700 dark:bg-emerald-500 h-full rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="eco-card p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Today&apos;s System Log</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { dot: 'bg-rose-500', time: '10:42 AM', msg: 'Bin #452 Zone B – Critical Threshold Reached' },
                      { dot: 'bg-emerald-600', time: '09:15 AM', msg: 'AI Route Optimization complete for Sector 3' },
                      { dot: 'bg-sky-600', time: '08:30 AM', msg: 'All 24 morning municipal tippers dispatched' },
                    ].map((l, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${l.dot}`} />
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">{l.time}</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{l.msg}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLAINTS DISPATCH (WORKABLE ASSIGN & VIEW) ── */}
        {currentTab === 'complaints' && (
          <div className="space-y-6">
            <div className="eco-card p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Citizen Complaints Management</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Review, dispatch workers, and resolve waste reports from Nagpur citizens in real time.</p>
            </div>

            <div className="eco-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                      {['Ticket ID', 'Type', 'Citizen', 'Area', 'Severity', 'Status', 'Assigned To', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {complaints.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-4 font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300">{c.id}</td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                            {wasteIcon[c.type] || '🗑️'} <span className="capitalize">{c.type}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-800 dark:text-slate-200 font-medium">{c.citizen}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{c.area}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <span key={n} className={`w-2 h-2 rounded-full ${n <= c.severity ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusBadge(c.status)}`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{c.assignedTo || 'Unassigned'}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setAssignModalTicket(c);
                                setSelectedAssignee(c.assignedTo || 'W-002 Ramesh Gawande');
                              }}
                              className="text-xs bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 font-bold px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                            >
                              Assign
                            </button>
                            <button
                              onClick={() => setViewModalTicket(c)}
                              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              View
                            </button>
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Fleet Management</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Real-time vehicle tracking, fuel monitoring, and route assignment.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 eco-card p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-4">Fleet Locations – Live Map</h3>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-80">
                  <NagpurMap className="w-full h-full" />
                </div>
              </div>

              <div className="eco-card p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-4">Vehicle Status</h3>
                <div className="space-y-3">
                  {MOCK_FLEET.map(v => (
                    <div key={v.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🚛</span>
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{v.id}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge(v.status)}`}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">Driver: {v.driver}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{v.zone} • {v.fuel}% Fuel</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKERS REGISTRY (WORKABLE ADD & REGISTRY) ── */}
        {currentTab === 'workers' && (
          <div className="space-y-6">
            <div className="eco-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Sanitation Worker Registry</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Shift management, attendance tracking, and duty assignments for municipal field crew.</p>
              </div>
              <button
                onClick={() => setIsAddWorkerOpen(true)}
                className="eco-button-primary text-sm self-start md:self-auto cursor-pointer flex items-center gap-2"
              >
                <span>+</span> Add Worker
              </button>
            </div>

            <div className="eco-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                      {['Worker ID', 'Name', 'Role', 'Zone Assigned', 'Shift', 'Vehicle', 'Status', 'Phone'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {workers.map(w => (
                      <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-4 font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300">{w.id}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{w.name}</td>
                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{w.role}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{w.zone}</td>
                        <td className="px-5 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">{w.shift}</td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">{w.vehicle || 'NMC Tipper'}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusBadge(w.status)}`}>
                            {w.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{w.phone}</td>
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Zone Management</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Ward-wise collection performance, bin fill status, and supervisor assignments.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {MOCK_ZONES.map(z => (
                <div key={z.name} className="eco-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{z.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Ward {z.ward} · Supervisor: {z.supervisor}</p>
                    </div>
                    <span className="eco-badge-green text-base font-bold">{z.diversion}% Diversion</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { label: 'Total Bins', value: z.bins, icon: '🗑️' },
                      { label: 'Online Bins', value: z.activeBins, icon: '📡' },
                      { label: 'Avg. Fill', value: `${z.fillAvg}%`, icon: '📊' },
                      { label: 'Vehicles', value: z.activeVehicles, icon: '🚛' },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-base">{item.icon}</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{item.value}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AUDIT REPORTS (WORKABLE AUDIT DASHBOARD) ── */}
        {currentTab === 'reports' && (
          <div className="space-y-6">
            <div className="eco-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Municipal Audit &amp; Compliance Reports</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Official Nagpur municipal waste audit logs, landfill diversion matrices, and SLA resolution tracking.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadCsv}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>📥</span> Download CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="eco-button-primary text-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>🖨️</span> Print Report
                </button>
              </div>
            </div>

            {/* Audit KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="eco-card p-5">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Waste Audited</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">4,115 Tons</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Q3 2026 Consolidated</div>
              </div>
              <div className="eco-card p-5">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Avg. Segregation Rate</div>
                <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">94.2%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">+3.1% vs Q2 benchmark</div>
              </div>
              <div className="eco-card p-5">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Resolution SLA Time</div>
                <div className="text-2xl font-bold text-sky-800 dark:text-sky-300 mt-1">4.2 Hours</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Goal: &lt; 6.0 Hours</div>
              </div>
              <div className="eco-card p-5">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Landfill Diversion</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">85.4%</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">₹1.4M Landfill Tax Avoided</div>
              </div>
            </div>

            {/* Monthly Audit Table */}
            <div className="eco-card overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Monthly Audit Log Summary</h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">NMC SWM Audit Protocol v3.2</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                      {['Audit Month', 'Total Waste', 'Wet (Organic)', 'Dry (Recyclable)', 'Hazardous', 'Compliance Score', 'Avg Resolution SLA', 'Penalties'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {AUDIT_RECORDS.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{r.month}</td>
                        <td className="px-5 py-4 text-sm font-bold text-emerald-800 dark:text-emerald-300">{r.totalWasteTons}</td>
                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{r.wetTons}</td>
                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{r.dryTons}</td>
                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{r.hazardousTons}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {r.complianceScore}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-mono text-sky-700 dark:text-sky-300 font-semibold">{r.slaHours}</td>
                        <td className="px-5 py-4 text-sm text-rose-700 dark:text-rose-400 font-semibold">{r.penaltiesLevied}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL: ASSIGN TICKET ── */}
      {assignModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Dispatch Complaint: {assignModalTicket.id}
              </h3>
              <button onClick={() => setAssignModalTicket(null)} className="text-slate-400 hover:text-slate-200 text-sm">✕</button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div><strong className="text-slate-800 dark:text-slate-200">Location:</strong> {assignModalTicket.area}</div>
              <div><strong className="text-slate-800 dark:text-slate-200">Category:</strong> {assignModalTicket.type} waste (Severity {assignModalTicket.severity}/5)</div>
              <div><strong className="text-slate-800 dark:text-slate-200">Citizen:</strong> {assignModalTicket.citizen} ({assignModalTicket.phone})</div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Field Worker / Sanitation Officer:
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {workers.map(w => (
                    <option key={w.id} value={`${w.id} ${w.name}`}>
                      {w.name} ({w.role} • {w.zone})
                    </option>
                  ))}
                  <option value="Inspector Vijay Deshmukh">Inspector Vijay Deshmukh (Ward 14 Officer)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalTicket(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="eco-button-primary text-xs cursor-pointer"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW TICKET DETAILS ── */}
      {viewModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{viewModalTicket.id}</h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border capitalize ${statusBadge(viewModalTicket.status)}`}>
                  {viewModalTicket.status.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => setViewModalTicket(null)} className="text-slate-400 hover:text-slate-200 text-sm">✕</button>
            </div>

            {viewModalTicket.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[16/9]">
                <img src={viewModalTicket.imageUrl} alt="Complaint Evidence" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-400 font-semibold">Location Area</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{viewModalTicket.area}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-400 font-semibold">Reported Category</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 capitalize">{viewModalTicket.type} Waste</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-400 font-semibold">Citizen Reporter</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{viewModalTicket.citizen}</div>
                <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">{viewModalTicket.phone}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-400 font-semibold">Assigned Authority</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{viewModalTicket.assignedTo || 'Unassigned'}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">Issue Description &amp; Observation:</div>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                {viewModalTicket.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewModalTicket(null)}
                className="eco-button-primary text-xs cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD WORKER ── */}
      {isAddWorkerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Register New Sanitation Worker
              </h3>
              <button onClick={() => setIsAddWorkerOpen(false)} className="text-slate-400 hover:text-slate-200 text-sm">✕</button>
            </div>

            <form onSubmit={handleAddWorkerSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Waghmare"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Role</label>
                  <select
                    value={newWorker.role}
                    onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Collector">Collector</option>
                    <option value="Driver">Driver</option>
                    <option value="Senior Collector">Senior Collector</option>
                    <option value="Sweeper Lead">Sweeper Lead</option>
                    <option value="Ward Supervisor">Ward Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Zone</label>
                  <select
                    value={newWorker.zone}
                    onChange={(e) => setNewWorker({ ...newWorker, zone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Zone 1 – Laxmi Nagar">Zone 1 – Laxmi Nagar</option>
                    <option value="Zone 2 – Dharampeth">Zone 2 – Dharampeth</option>
                    <option value="Zone 3 – Hanuman Nagar">Zone 3 – Hanuman Nagar</option>
                    <option value="Zone 4 – Dhantoli">Zone 4 – Dhantoli</option>
                    <option value="Zone 5 – Mangalwari">Zone 5 – Mangalwari</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Shift</label>
                  <select
                    value={newWorker.shift}
                    onChange={(e) => setNewWorker({ ...newWorker, shift: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="06:00 – 14:00">06:00 – 14:00 (Morning)</option>
                    <option value="14:00 – 22:00">14:00 – 22:00 (Afternoon)</option>
                    <option value="22:00 – 06:00">22:00 – 06:00 (Night)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98230 XXXXX"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddWorkerOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="eco-button-primary cursor-pointer"
                >
                  Register Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
