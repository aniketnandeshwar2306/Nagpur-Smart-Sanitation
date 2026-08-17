import React from 'react';
import NagpurMap from '../components/NagpurMap';

interface DashboardViewProps {
  onNavigate?: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 eco-animate-fade">
      {/* Background Soft Organic Blob Decoration */}
      <div className="absolute top-16 right-8 w-[400px] h-[400px] bg-[#E3EBD8]/60 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A2E22] tracking-tight">
            Dashboard
          </h1>
          <p className="text-[#5C6B61] text-sm md:text-base mt-2 max-w-2xl font-normal leading-relaxed">
            Live monitoring of municipal sanitation assets, automated routing, and diversion metrics across Nagpur zones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('reports')}
            className="px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>📊</span>
            <span>View Reports</span>
          </button>
          <button
            onClick={() => onNavigate?.('citizen')}
            className="px-5 py-2.5 rounded-full border border-transparent dark:border-slate-700 bg-[#1E3E2B] dark:bg-slate-800 text-white dark:text-slate-100 font-semibold text-sm hover:bg-[#142B1E] dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>🎧</span>
            <span>Contact Support</span>
          </button>
        </div>
      </div>

      {/* Top Grid: City Sanitation Overview (Left) & Waste Diversion (Right) */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Wide Card: City Sanitation Overview */}
        <div className="lg:col-span-8 eco-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-bold text-[#1A2E22]">
              City Sanitation Overview
            </h2>
            <div className="flex items-center gap-2">
              <span className="eco-badge-green">
                <span className="w-2 h-2 rounded-full bg-[#1F402B] animate-pulse" />
                Active Routes
              </span>
              <span className="bg-[#E5E8E0] text-[#5C6B61] text-xs font-bold px-3 py-1 rounded-full">
                Idle Assets
              </span>
            </div>
          </div>

          {/* Real Nagpur Map */}
          <div className="relative h-72 md:h-80 rounded-2xl overflow-hidden border border-[#E0E5DA] shadow-inner">
            <NagpurMap className="w-full h-full" />

            {/* Floating Stats Widget Overlay */}
            <div className="absolute bottom-4 right-4 z-[500] bg-white/95 backdrop-blur-md border border-[#E5E8E0] p-3.5 rounded-xl shadow-lg text-xs space-y-1.5 min-w-[150px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#5C6B61] font-medium">Fleet Active</span>
                <span className="font-bold text-[#1A2E22] text-sm">24/28</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#E5E8E0]">
                <span className="text-[#5C6B61] font-medium">Critical Bins</span>
                <span className="font-bold text-rose-600 text-sm">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Waste Diversion */}
        <div className="lg:col-span-4 eco-card p-6 flex flex-col justify-between">
          <div className="text-xs font-extrabold text-[#5C6B61] uppercase tracking-wider mb-2">
            WASTE DIVERSION
          </div>

          <div className="flex flex-col items-center justify-center my-4">
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
                  className="text-[#2D5A3F]"
                  strokeDasharray="45, 100"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#8B6D4C]"
                  strokeDasharray="33, 100"
                  strokeDashoffset="-45"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#E2E8F0]"
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
                <span className="text-3xl font-serif font-bold text-[#1A2E22]">78%</span>
                <span className="text-xs font-medium text-[#5C6B61]">Diverted</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2D5A3F]" />
                <span className="text-[#5C6B61]">Recycling</span>
              </div>
              <span className="font-bold text-[#1A2E22]">45%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#8B6D4C]" />
                <span className="text-[#5C6B61]">Compost</span>
              </div>
              <span className="font-bold text-[#1A2E22]">33%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#E2E8F0]" />
                <span className="text-[#5C6B61]">Landfill</span>
              </div>
              <span className="font-bold text-[#1A2E22]">22%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row 3 Cards: Zone Status, Impact Metrics, System Log */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Card 1: Zone Status */}
        <div className="eco-card p-6">
          <h2 className="text-lg font-serif font-bold text-[#1A2E22] mb-4">
            Zone Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#5C6B61] flex items-center justify-center font-bold">
                📅
              </div>
              <div>
                <div className="text-sm font-bold text-[#1A2E22]">Zone A – Central</div>
                <div className="text-xs text-[#5C6B61]">Scheduled: Today, 2 PM</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E3EBD8] text-[#2D5A3F] flex items-center justify-center font-bold">
                🚚
              </div>
              <div>
                <div className="text-sm font-bold text-[#1A2E22]">Zone B – North</div>
                <div className="text-xs text-[#2D5A3F] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3F] animate-pulse" />
                  In Progress
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#5C6B61] flex items-center justify-center font-bold">
                o
              </div>
              <div>
                <div className="text-sm font-bold text-[#1A2E22]">Zone C – East</div>
                <div className="text-xs text-[#5C6B61]">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Impact Metrics */}
        <div className="eco-card p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#F4E8D3]/70 rounded-full blur-lg pointer-events-none" />

          <h2 className="text-lg font-serif font-bold text-[#1A2E22] mb-4">
            Impact Metrics
          </h2>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-xl text-[#2D5A3F]">🌱</span>
              <div>
                <span className="text-xs text-[#5C6B61] font-medium mr-2">Carbon Offset</span>
                <span className="text-2xl font-serif font-bold text-[#1A2E22]">120</span>
                <span className="text-xs text-[#5C6B61] ml-1">Tons</span>
              </div>
            </div>

            <div className="border-t border-[#E5E8E0] pt-4 flex items-center gap-3">
              <span className="text-xl text-[#2D5A3F]">💧</span>
              <div>
                <span className="text-xs text-[#5C6B61] font-medium mr-2">Water Saved</span>
                <span className="text-2xl font-serif font-bold text-[#1A2E22]">500k</span>
                <span className="text-xs text-[#5C6B61] ml-1">Gal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: System Log */}
        <div className="eco-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-bold text-[#1A2E22]">
              System Log
            </h2>
            <button className="text-[#5C6B61] hover:text-[#1A2E22] text-sm">•••</button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-[#8C988F] uppercase block">10:42 AM</span>
                <p className="text-[#1A2E22] font-medium">Bin #452 (Zone B) reported full – Collection expedited.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#2D5A3F] mt-1 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-[#8C988F] uppercase block">09:15 AM</span>
                <p className="text-[#1A2E22] font-medium">Route optimization for Sector 3 completed – 15% efficiency gain.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#8B6D4C] mt-1 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-[#8C988F] uppercase block">Yesterday</span>
                <p className="text-[#1A2E22] font-medium">Monthly sustainability report shared with city council.</p>
              </div>
            </div>
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

export default DashboardView;
