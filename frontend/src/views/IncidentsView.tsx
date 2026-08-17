import React from 'react';

export const IncidentsView: React.FC = () => {
  const incidents = [
    { id: 'INC-8091', title: 'Illegal dumping near Sitabuldi main market', zone: 'Zone A', severity: 'High', time: '25 mins ago', status: 'Dispatched' },
    { id: 'INC-8088', title: 'Smart Bin Sensor disconnection - Civil Lines', zone: 'Zone B', severity: 'Medium', time: '2 hours ago', status: 'Under Review' },
    { id: 'INC-8072', title: 'Spill reported on Kamptee Road route', zone: 'Zone C', severity: 'Low', time: '5 hours ago', status: 'Resolved' },
  ];

  return (
    <div className="space-y-6 eco-animate-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A2E22]">Sanitation Incidents & Escalations</h1>
          <p className="text-sm text-[#5C6B61] mt-1">Real-time alerts, public grievances, and emergency cleanup operations.</p>
        </div>
        <button className="eco-button-primary text-sm self-start md:self-auto">
          <span>⚠️</span> Report New Incident
        </button>
      </div>

      <div className="eco-card p-6 divide-y divide-[#E5E8E0]">
        {incidents.map((inc) => (
          <div key={inc.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#2D5A3F] bg-[#E3EBD8] px-2 py-0.5 rounded-md">
                  {inc.id}
                </span>
                <span className="text-xs text-[#5C6B61] font-semibold">{inc.zone}</span>
                <span className="text-xs text-[#5C6B61]">• {inc.time}</span>
              </div>
              <h3 className="font-bold text-base text-[#1A2E22]">{inc.title}</h3>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                inc.severity === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
              }`}>
                {inc.severity} Severity
              </span>
              <span className="eco-badge-green">
                {inc.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentsView;
