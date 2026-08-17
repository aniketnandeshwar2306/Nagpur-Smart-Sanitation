import React, { useState } from 'react';

const AUDIT_FILES = [
  { id: 'AUD-2026-Q3', title: 'Q3 2026 Municipal Diversion & Landfill Audit', date: 'August 2026', status: 'Approved', size: '2.4 MB', type: 'Full Audit' },
  { id: 'AUD-2026-Z2', title: 'Zone 2 Dharampeth Fleet & Fuel Compliance Log', date: 'July 2026', status: 'Completed', size: '1.8 MB', type: 'Fleet Audit' },
  { id: 'AUD-2026-CIT', title: 'City-wide Citizen Grievance Resolution SLA Report', date: 'Q2 2026', status: 'Archived', size: '4.1 MB', type: 'SLA Audit' },
  { id: 'AUD-2026-BIO', title: 'Biomedical & Hazardous Waste Handler Inspection', date: 'June 2026', status: 'Certified', size: '3.2 MB', type: 'Hazardous Audit' },
];

export const ReportsView: React.FC = () => {
  const [toast, setToast] = useState<string | null>(null);

  const handleDownload = (fileName: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,Report,Generated Date,Status,Compliance Score,Tons Processed\n' +
      `${fileName},August 2026,Approved,94.2%,1420 Tons`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${fileName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast(`✓ Downloaded ${fileName}`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6 eco-animate-fade pb-10">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-300 border border-emerald-500/40 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Municipal Waste &amp; Audit Reports
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Audit logs, environmental impact reports, and Swachh Bharat compliance documentation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDownload('Nagpur_Comprehensive_Audit_Summary_2026')}
            className="eco-button-primary text-xs flex items-center gap-2 cursor-pointer"
          >
            <span>📄</span> Generate Master Audit CSV
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="eco-card p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Reports Filed</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">48 Logs</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">100% Auditor Verified</div>
        </div>
        <div className="eco-card p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">SWM Compliance</div>
          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">94.8%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">MoHUA Benchmark: 90%</div>
        </div>
        <div className="eco-card p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">CO₂ Emission Saved</div>
          <div className="text-2xl font-bold text-sky-800 dark:text-sky-300 mt-1">324.5 Tons</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Via route optimization</div>
        </div>
        <div className="eco-card p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Landfill Diversion</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">86.2%</div>
          <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">NMC Dharampeth Ward</div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {AUDIT_FILES.map((r, i) => (
          <div key={i} className="eco-card p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
                  📊
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">{r.id}</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">{r.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Period: {r.date}</p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {r.status}
              </span>
              <button
                onClick={() => handleDownload(r.title)}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>📥</span> {r.size}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsView;
