import React, { useState } from 'react';

interface AnalyticsViewProps {
  onNavigate?: (view: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState<'6M' | '1Y' | 'ALL'>('6M');

  return (
    <div className="space-y-8 eco-animate-fade">
      {/* Background Soft Organic Blob Decoration */}
      <div className="absolute top-12 right-12 w-[500px] h-[500px] bg-[#E3EBD8]/50 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {/* Header Badges */}
          <div className="flex items-center gap-3 mb-2">
            <span className="eco-badge-tan">Q3 REPORT</span>
            <span className="text-xs text-[#5C6B61] font-medium flex items-center gap-1">
              <span>📅</span> Oct – Dec 2024
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A2E22] tracking-tight">
            Sustainability Analytics
          </h1>
          <p className="text-[#5C6B61] text-sm md:text-base mt-2 max-w-2xl font-normal leading-relaxed">
            Deep-dive into Nagpur's waste composition, route efficiency, and historical environmental impact metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-xs cursor-pointer">
            <span>📤</span>
            <span>Export PDF</span>
          </button>
          <button className="px-5 py-2.5 rounded-full bg-[#1E3E2B] dark:bg-emerald-600 text-white font-semibold text-sm hover:bg-[#142B1E] dark:hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-sm cursor-pointer">
            <span>Generate Insights</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="eco-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#E3EBD8] text-[#2D5A3F] flex items-center justify-center text-lg">
              ♻️
            </div>
            <span className="bg-[#E3EBD8] text-[#2D5A3F] text-xs font-bold px-2.5 py-0.5 rounded-full">
              ↑ 12%
            </span>
          </div>
          <div className="mt-4">
            <div className="text-[11px] font-extrabold text-[#5C6B61] uppercase tracking-wider">
              TOTAL DIVERTED
            </div>
            <div className="text-2xl font-serif font-bold text-[#1A2E22] mt-0.5">
              14.2k <span className="text-sm font-sans text-[#5C6B61] font-normal">Tons</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="eco-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#F4E8D3] text-[#8B6D4C] flex items-center justify-center text-lg">
              🪵
            </div>
            <span className="bg-[#E3EBD8] text-[#2D5A3F] text-xs font-bold px-2.5 py-0.5 rounded-full">
              ↑ 8%
            </span>
          </div>
          <div className="mt-4">
            <div className="text-[11px] font-extrabold text-[#5C6B61] uppercase tracking-wider">
              COMPOST YIELD
            </div>
            <div className="text-2xl font-serif font-bold text-[#1A2E22] mt-0.5">
              3.8k <span className="text-sm font-sans text-[#5C6B61] font-normal">Tons</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="eco-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#E3EBD8] text-[#2D5A3F] flex items-center justify-center text-lg">
              📈
            </div>
            <span className="bg-[#E3EBD8] text-[#2D5A3F] text-xs font-bold px-2.5 py-0.5 rounded-full">
              ↑ 15%
            </span>
          </div>
          <div className="mt-4">
            <div className="text-[11px] font-extrabold text-[#5C6B61] uppercase tracking-wider">
              ROUTE EFFICIENCY
            </div>
            <div className="text-2xl font-serif font-bold text-[#1A2E22] mt-0.5">
              92%
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="eco-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#E3EBD8] text-[#2D5A3F] flex items-center justify-center text-lg">
              🍃
            </div>
            <span className="bg-[#E3EBD8] text-[#2D5A3F] text-xs font-bold px-2.5 py-0.5 rounded-full">
              ↓ 5%
            </span>
          </div>
          <div className="mt-4">
            <div className="text-[11px] font-extrabold text-[#5C6B61] uppercase tracking-wider">
              CARBON OFFSET
            </div>
            <div className="text-2xl font-serif font-bold text-[#1A2E22] mt-0.5">
              420 <span className="text-sm font-sans text-[#5C6B61] font-normal">CO2e</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Waste Composition (Left) & Active Fleet Hubs + Key Insights (Right) */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Card: Waste Composition */}
        <div className="lg:col-span-8 eco-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-serif font-bold text-[#1A2E22]">
                Waste Composition
              </h2>
              <button className="text-[#5C6B61] hover:text-[#1A2E22]">•••</button>
            </div>
            <p className="text-xs text-[#5C6B61] mb-6">
              Breakdown of collected materials city-wide.
            </p>

            <div className="grid md:grid-cols-12 gap-6 items-center">
              {/* Donut Chart */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#E8EBE4]"
                      strokeWidth="3.6"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#5C936E]"
                      strokeDasharray="45, 100"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#D3BFA7]"
                      strokeDasharray="33, 100"
                      strokeDashoffset="-45"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#D1D5DB]"
                      strokeDasharray="22, 100"
                      strokeDashoffset="-78"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-[10px] font-extrabold text-[#5C6B61] tracking-wider uppercase">DIVERTED</span>
                    <span className="text-2xl font-serif font-bold text-[#1A2E22]">78%</span>
                  </div>
                </div>
              </div>

              {/* Composition Breakdown List */}
              <div className="md:col-span-7 space-y-3">
                <div className="bg-[#F5F5F0] p-3.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#5C936E]" />
                    <div>
                      <div className="text-xs font-bold text-[#1A2E22]">Recycling</div>
                      <div className="text-[11px] text-[#5C6B61]">Paper, Plastic, Glass, Metal</div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-[#1A2E22]">45%</span>
                </div>

                <div className="bg-[#F5F5F0] p-3.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#D3BFA7]" />
                    <div>
                      <div className="text-xs font-bold text-[#1A2E22]">Compostable</div>
                      <div className="text-[11px] text-[#5C6B61]">Food waste, Yard trimmings</div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-[#1A2E22]">33%</span>
                </div>

                <div className="bg-[#F5F5F0] p-3.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#D1D5DB]" />
                    <div>
                      <div className="text-xs font-bold text-[#1A2E22]">Landfill</div>
                      <div className="text-[11px] text-[#5C6B61]">Non-recoverable materials</div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-[#1A2E22]">22%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Fleet Hubs & Key Insights */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Fleet Hubs Card */}
          <div className="eco-card overflow-hidden relative">
            <div className="h-28 relative">
              <img
                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80"
                alt="Map snippet"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-white/40" />
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-white/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#1A2E22]">Active Fleet Hubs</div>
                  <div className="text-[11px] text-[#5C6B61]">Sector 3, Civil Lines</div>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#2D5A3F] border-2 border-white animate-ping" />
              </div>
            </div>
          </div>

          {/* Key Insights Card */}
          <div className="eco-card p-6">
            <h2 className="text-lg font-serif font-bold text-[#1A2E22] mb-4">
              Key Insights
            </h2>

            <div className="space-y-3.5">
              {/* Insight 1 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#FEF3C7] dark:bg-amber-950 text-[#92400E] dark:text-amber-300 flex items-center justify-center text-sm shrink-0 font-bold">
                  🌾
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Compost Contamination Down</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Educational outreach in Zone B reduced non-compostable intake.
                  </div>
                </div>
              </div>

              {/* Insight 2 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#DCFCE7] dark:bg-emerald-950 text-[#166534] dark:text-emerald-300 flex items-center justify-center text-sm shrink-0 font-bold">
                  🚚
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Route Optimization Alpha</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    New algorithm saved 450 liters of fuel across fleet.
                  </div>
                </div>
              </div>

              {/* Insight 3 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center text-sm shrink-0 font-bold">
                  ⚠️
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Landfill Capacity Alert</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Sector 7 transfer station nearing 90% capacity.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Wide Card: Diversion Trend Bar Chart */}
      <div className="eco-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#1A2E22]">
              Diversion Trend
            </h2>
            <p className="text-xs text-[#5C6B61] mt-0.5">
              Monthly performance against 2026 targets.
            </p>
          </div>

          {/* Time range switcher */}
          <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-full text-xs font-bold self-start md:self-auto">
            {(['6M', '1Y', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-full transition-all ${
                  timeRange === r
                    ? 'bg-white text-[#1A2E22] shadow-xs'
                    : 'text-[#5C6B61] hover:text-[#1A2E22]'
                }`}
              >
                {r === 'ALL' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="relative pt-6 pb-2">
          {/* Target line (80%) */}
          <div className="absolute top-10 left-0 right-0 border-b border-dashed border-[#8C988F]/40 flex justify-end pr-2">
            <span className="text-[10px] font-bold text-[#5C6B61] bg-white px-1 -mt-2">
              80% Target
            </span>
          </div>

          {/* Bars */}
          <div className="h-44 flex items-end justify-between gap-3 md:gap-8 px-2 md:px-8">
            {[
              { month: 'Apr', val: 52 },
              { month: 'May', val: 58 },
              { month: 'Jun', val: 64 },
              { month: 'Jul', val: 68 },
              { month: 'Aug', val: 72 },
              { month: 'Sep', val: 75 },
              { month: 'Oct', val: 78, isCurrent: true },
            ].map((b) => (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                {b.isCurrent && (
                  <span className="absolute -top-7 bg-[#2D5A3F] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    78%
                  </span>
                )}
                <div className="w-full bg-[#E5E8E0] rounded-t-lg h-36 flex items-end overflow-hidden">
                  <div
                    style={{ height: `${b.val}%` }}
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      b.isCurrent
                        ? 'bg-[#2D5A3F] group-hover:bg-[#21432E]'
                        : 'bg-[#C8D8C9] group-hover:bg-[#B3C8B4]'
                    }`}
                  />
                </div>
                <span className={`text-xs font-semibold ${b.isCurrent ? 'text-[#2D5A3F] font-bold' : 'text-[#5C6B61]'}`}>
                  {b.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-8 border-t border-[#E5E8E0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5C6B61]">
        <div className="flex items-center gap-2">
          <span>🌿</span>
          <span>Sustainability Ops Hub © 2024 Nagpur Smart City</span>
        </div>
        <div className="flex items-center gap-6 font-medium">
          <a href="#terms" className="hover:text-[#1A2E22] transition-colors">Terms</a>
          <a href="#privacy" className="hover:text-[#1A2E22] transition-colors">Privacy</a>
          <button onClick={() => onNavigate?.('citizen')} className="hover:text-[#1A2E22] transition-colors">Citizen Portal</button>
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsView;
