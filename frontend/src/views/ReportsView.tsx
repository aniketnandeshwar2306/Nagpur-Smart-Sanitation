import React from 'react';

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-6 eco-animate-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A2E22]">Municipal Waste Reports</h1>
          <p className="text-sm text-[#5C6B61] mt-1">Audit logs, environmental impact reports, and city council documentation.</p>
        </div>
        <button className="eco-button-primary text-sm self-start md:self-auto">
          <span>📄</span> Generate New Report
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Monthly Diversion Audit', date: 'August 2024', status: 'Approved', size: '2.4 MB' },
          { title: 'Zone B Fleet Fuel Consumption', date: 'July 2024', status: 'Completed', size: '1.8 MB' },
          { title: 'City-wide Citizen Grievance Log', date: 'Q2 2024', status: 'Archived', size: '4.1 MB' },
        ].map((r, i) => (
          <div key={i} className="eco-card p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E3EBD8] text-[#2D5A3F] flex items-center justify-center font-bold text-lg mb-4">
                📊
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1A2E22]">{r.title}</h3>
              <p className="text-xs text-[#5C6B61] mt-1">Generated: {r.date}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E5E8E0] flex items-center justify-between text-xs">
              <span className="eco-badge-green">{r.status}</span>
              <span className="font-semibold text-[#5C6B61]">{r.size}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsView;
