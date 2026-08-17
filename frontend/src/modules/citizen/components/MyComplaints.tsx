import React, { useEffect, useState } from 'react';
import type { ReportResponse } from '../types/citizen.types';
import { fetchReports } from '../api/citizenApi';

const wasteTypeIcons: Record<string, string> = {
  wet: '🥬',
  dry: '📦',
  hazardous: '☢️',
  'e-waste': '🔌',
  mixed: '♻️',
  '—': '🚫',
};

const wasteTypeColors: Record<string, string> = {
  wet: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  dry: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  hazardous: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  'e-waste': 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  mixed: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
};

const statusBadges: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400 animate-pulse',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    dot: 'bg-sky-400 animate-ping',
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
};

export const MyComplaints: React.FC = () => {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal / Detail view state
  const [selectedTicket, setSelectedTicket] = useState<ReportResponse | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReports();
      setReports(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to load previous complaints. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtered reports calculation
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.assigned_authority && r.assigned_authority.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesType = typeFilter === 'all' || r.waste_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalCount = reports.length;
  const inProgressCount = reports.filter((r) => r.status === 'in_progress').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const submittedCount = reports.filter((r) => r.status === 'submitted').length;

  const formatDate = (isoString: string) => {
    try {
      const dateObj = new Date(isoString);
      return dateObj.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">Loading previous complaints and authority records...</p>
      </div>
    );
  }

  return (
    <div className="citizen-fade-in space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400 animate-pulse" />
              Grievance Tracking Portal
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Previous Complaints &amp; Tracking
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-1.5 max-w-2xl font-normal">
              Track your waste reporting history, monitor resolution timeline, view submitted photographs, and directly contact your ward&apos;s assigned sanitation authority.
            </p>
          </div>
          <button
            onClick={loadReports}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs md:text-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>🔄</span> Refresh Status
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/80">
          <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">Total Logged</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-200 mt-1">{totalCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-950/60 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 shadow-xs">
            <div className="text-amber-800 dark:text-amber-300/80 text-xs font-medium">Submitted</div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{submittedCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-950/60 border border-sky-200 dark:border-sky-500/20 rounded-2xl p-4 shadow-xs">
            <div className="text-sky-800 dark:text-sky-300/80 text-xs font-medium">In Progress</div>
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300 mt-1">{inProgressCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-950/60 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 shadow-xs">
            <div className="text-emerald-800 dark:text-emerald-300/80 text-xs font-medium">Resolved</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{resolvedCount}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={loadReports} className="underline font-semibold hover:text-rose-800 dark:hover:text-rose-200">
            Try again
          </button>
        </div>
      )}

      {/* Main Layout: Filters, List & Detailed Inspector Panel */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Search, Filters & Complaint List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by Ticket ID, description or authority..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'submitted', label: 'Submitted' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'resolved', label: 'Resolved' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all whitespace-nowrap text-center ${
                    statusFilter === tab.id
                      ? 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Waste Type Dropdown */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span>Filter Waste Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="all">All Types</option>
                <option value="wet">Wet Waste</option>
                <option value="dry">Dry Waste</option>
                <option value="hazardous">Hazardous</option>
                <option value="e-waste">E-Waste</option>
                <option value="mixed">Mixed Waste</option>
              </select>
            </div>
          </div>

          {/* List of Complaints */}
          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filteredReports.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 text-center space-y-3 shadow-xs">
                <div className="text-4xl">📭</div>
                <div className="text-slate-900 dark:text-white font-semibold text-sm">No complaints found</div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search query or filter selections.'
                    : 'You haven’t submitted any waste grievances yet.'}
                </p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedTicket?.ticket_id === report.ticket_id;
                const statusMeta = statusBadges[report.status] || statusBadges.submitted;

                return (
                  <div
                    key={report.ticket_id}
                    onClick={() => setSelectedTicket(report)}
                    className={`
                      p-4 rounded-2xl border transition-all cursor-pointer citizen-card-lift
                      ${
                        isSelected
                          ? 'bg-sky-50/80 dark:bg-slate-900 border-sky-500/60 shadow-md ring-1 ring-sky-500/30'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/90 shadow-xs'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Photograph Thumbnail */}
                        {report.image_url ? (
                          <img
                            src={report.image_url}
                            alt="Complaint attachment"
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700/60 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
                            {wasteTypeIcons[report.waste_type] || '🗑️'}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{report.ticket_id}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 capitalize ${
                                wasteTypeColors[report.waste_type] || 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {wasteTypeIcons[report.waste_type]} {report.waste_type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium line-clamp-1">
                            {report.description || `${report.waste_type.toUpperCase()} Waste Grievance`}
                          </p>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span>📅 {formatDate(report.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 flex-shrink-0 ${statusMeta.bg} ${statusMeta.border} ${statusMeta.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Assigned Authority Mini Pill */}
                    {report.assigned_authority && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span>{report.assigned_authority.avatar_icon}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{report.assigned_authority.name}</span>
                        </div>
                        <span className="text-sky-600 dark:text-sky-400 font-semibold group-hover:underline">Track &amp; Contact &rarr;</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Complaint Tracker & Assigned Authority Contact (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 sticky top-20 shadow-md dark:shadow-2xl">
              {/* Top Header & Ticket Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{selectedTicket.ticket_id}</h3>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border capitalize flex items-center gap-1.5 ${
                        statusBadges[selectedTicket.status]?.bg
                      } ${statusBadges[selectedTicket.status]?.border} ${statusBadges[selectedTicket.status]?.text}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusBadges[selectedTicket.status]?.dot}`} />
                      {statusBadges[selectedTicket.status]?.label || selectedTicket.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Submitted on <span className="text-slate-800 dark:text-slate-200 font-medium">{formatDate(selectedTicket.created_at)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedTicket.ticket_id, 'Ticket ID copied!')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedText === 'Ticket ID copied!' ? '✓ Copied' : '📋 Copy ID'}
                  </button>
                </div>
              </div>

              {/* ----------------------------------------------------------------------- */}
              {/* ASSIGNED AUTHORITY CONTACT CARD (LIGHT MODE SOFTENED) */}
              {/* ----------------------------------------------------------------------- */}
              {selectedTicket.assigned_authority ? (
                <div className="bg-emerald-50/70 dark:bg-slate-950/80 border border-emerald-200/80 dark:border-sky-500/30 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-100 dark:bg-sky-500/20 border-b border-l border-emerald-200 dark:border-sky-500/30 rounded-bl-xl text-[10px] font-bold text-emerald-800 dark:text-sky-300 uppercase tracking-wider">
                    Assigned Municipal Authority
                  </div>

                  <div className="flex items-start sm:items-center gap-4">
                    {/* Official Municipal Authority Icon Badge */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-sky-500/15 border border-emerald-200 dark:border-sky-500/30 flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-xs">
                      🏛️
                    </div>

                    {/* Authority Details */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {selectedTicket.assigned_authority.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-500/30">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 dark:text-sky-300 font-semibold">
                        {selectedTicket.assigned_authority.role}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        🏢 {selectedTicket.assigned_authority.department}
                      </p>
                    </div>
                  </div>

                  {/* Direct Contact Buttons Grid: Call & Email */}
                  <div className="grid sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-emerald-200/60 dark:border-slate-800">
                    {/* Phone Contact */}
                    <div className="bg-white dark:bg-slate-900/80 border border-emerald-200/60 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs">
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Contact Phone</div>
                        <a
                          href={`tel:${selectedTicket.assigned_authority.phone}`}
                          className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline truncate block"
                        >
                          📞 {selectedTicket.assigned_authority.phone}
                        </a>
                      </div>
                      <a
                        href={`tel:${selectedTicket.assigned_authority.phone}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-500/30 transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
                      >
                        Call
                      </a>
                    </div>

                    {/* Email Contact */}
                    <div className="bg-white dark:bg-slate-900/80 border border-emerald-200/60 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs">
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Official Email</div>
                        <a
                          href={`mailto:${selectedTicket.assigned_authority.email}`}
                          className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline truncate block"
                        >
                          ✉️ {selectedTicket.assigned_authority.email}
                        </a>
                      </div>
                      <a
                        href={`mailto:${selectedTicket.assigned_authority.email}`}
                        className="px-3 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-500/20 hover:bg-sky-200 dark:hover:bg-sky-500/30 text-sky-800 dark:text-sky-300 font-bold text-xs border border-sky-300 dark:border-sky-500/30 transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
                      >
                        Email
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-slate-500 dark:text-slate-400 text-xs">
                  ⏳ Municipal authority assignment in progress for this grievance...
                </div>
              )}

              {/* ----------------------------------------------------------------------- */}
              {/* REAL-TIME PROGRESS & TIMELINE TRACKER */}
              {/* ----------------------------------------------------------------------- */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>📈</span> Resolution Timeline &amp; Date History
                </h4>

                {/* Visual Step Progress Bar */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <div
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      selectedTicket.status === 'submitted' || selectedTicket.status === 'in_progress' || selectedTicket.status === 'resolved'
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    1. Registered
                  </div>
                  <div
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      selectedTicket.status === 'in_progress' || selectedTicket.status === 'resolved'
                        ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    2. In Progress
                  </div>
                  <div
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      selectedTicket.status === 'resolved'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    3. Resolved
                  </div>
                </div>

                {/* Chronological Event Timeline */}
                <div className="relative pl-6 space-y-4 border-l-2 border-slate-800 py-1">
                  {selectedTicket.timeline && selectedTicket.timeline.length > 0 ? (
                    selectedTicket.timeline.map((event, idx) => (
                      <div key={idx} className="relative group">
                        <div
                          className={`
                            absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center text-[8px]
                            ${
                              event.status === 'resolved'
                                ? 'border-emerald-400 text-emerald-400 bg-emerald-950'
                                : event.status === 'in_progress'
                                ? 'border-sky-400 text-sky-400 bg-sky-950'
                                : 'border-amber-400 text-amber-400 bg-amber-950'
                            }
                          `}
                        >
                          o
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-200 capitalize">
                              {event.status.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              🕒 {formatDate(event.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                            {event.note}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">No timeline events recorded yet.</div>
                  )}
                </div>
              </div>

              {/* ----------------------------------------------------------------------- */}
              {/* COMPLAINT PHOTOGRAPH & GRIEVANCE DETAILS (KEY USER REQUIREMENT) */}
              {/* ----------------------------------------------------------------------- */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📸</span> Complaint Photograph &amp; Geotag
                </h4>

                <div className="grid sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {/* Photo Display */}
                  <div className="sm:col-span-1">
                    {selectedTicket.image_url ? (
                      <div
                        onClick={() => setExpandedImage(selectedTicket.image_url || null)}
                        className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-700"
                      >
                        <img
                          src={selectedTicket.image_url}
                          alt="Grievance photograph"
                          className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                          🔍 Click to Zoom
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
                        No photograph attached
                      </div>
                    )}
                  </div>

                  {/* Grievance Metadata */}
                  <div className="sm:col-span-2 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Waste Classification:</span>
                      <span className="ml-2 font-bold text-white capitalize">
                        {wasteTypeIcons[selectedTicket.waste_type]} {selectedTicket.waste_type} Waste
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400">Severity Level:</span>
                      <div className="inline-flex items-center gap-1 ml-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= selectedTicket.severity ? 'text-amber-400' : 'text-slate-700'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-slate-300 font-semibold ml-1">({selectedTicket.severity}/5)</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">GPS Coordinates:</span>
                      <span className="ml-2 font-mono text-slate-200">
                        {selectedTicket.latitude.toFixed(4)}N, {selectedTicket.longitude.toFixed(4)}E
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Citizen Description:</span>
                      <p className="text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 italic">
                        &quot;{selectedTicket.description || 'No description provided.'}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <div className="text-5xl">👈</div>
              <div className="text-white font-bold text-base">Select a complaint from the list</div>
              <p className="text-xs max-w-sm mx-auto">
                Click any complaint card on the left to track its live resolution timeline, view submitted photos, and access assigned authority contact details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Zoom Modal */}
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 citizen-fade-in"
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 p-2 shadow-2xl">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 bg-slate-950/80 hover:bg-slate-950 text-white rounded-full p-2.5 border border-slate-700 transition-colors z-10"
            >
              ✕
            </button>
            <img src={expandedImage} alt="Enlarged grievance photo" className="w-full max-h-[80vh] object-contain rounded-2xl" />
            <div className="p-3 text-center text-xs text-slate-400 font-medium">
              Submitted Waste Photograph - Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
