import React from 'react';

export const SmartBinsView: React.FC = () => {
  const bins = [
    { id: 'Bin #452', zone: 'Zone B – North', fill: 94, status: 'Critical', battery: '88%' },
    { id: 'Bin #108', zone: 'Zone A – Central', fill: 65, status: 'Normal', battery: '92%' },
    { id: 'Bin #304', zone: 'Zone C – East', fill: 42, status: 'Normal', battery: '76%' },
    { id: 'Bin #211', zone: 'Zone B – Civil Lines', fill: 88, status: 'High', battery: '95%' },
  ];

  return (
    <div className="space-y-6 eco-animate-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A2E22]">Smart Bins Network</h1>
          <p className="text-sm text-[#5C6B61] mt-1">IoT ultrasonic fill sensors active across 1,200 municipal collection nodes.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="eco-badge-green">1,180 / 1,200 Online</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {bins.map((b) => (
          <div key={b.id} className="eco-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">🗑️</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  b.status === 'Critical' ? 'bg-rose-100 text-rose-700' :
                  b.status === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-[#E3EBD8] text-[#2D5A3F]'
                }`}>
                  {b.status}
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1A2E22]">{b.id}</h3>
              <p className="text-xs text-[#5C6B61] mt-0.5">{b.zone}</p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#5C6B61]">Fill Level</span>
                <span className="text-[#1A2E22]">{b.fill}%</span>
              </div>
              <div className="w-full bg-[#E5E8E0] h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${b.fill}%` }}
                  className={`h-full rounded-full ${
                    b.fill > 90 ? 'bg-rose-500' : b.fill > 75 ? 'bg-amber-500' : 'bg-[#2D5A3F]'
                  }`}
                />
              </div>
              <div className="text-[11px] text-[#5C6B61] pt-1 flex justify-between">
                <span>Battery: {b.battery}</span>
                <span>Signal: Excellent</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartBinsView;
