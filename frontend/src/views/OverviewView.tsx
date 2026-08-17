import React from 'react';
import NagpurMap from '../components/NagpurMap';

interface OverviewViewProps {
  onNavigate?: (view: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 eco-animate-fade">
      {/* Background Soft Organic Blob Decoration */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#E8F2E6] rounded-full blur-3xl opacity-50 -z-10 pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A2E22] tracking-tight">
            Nagpur SmartSanitation
          </h1>
          <p className="text-[#5C6B61] text-sm md:text-base mt-2 max-w-2xl font-normal leading-relaxed">
            Sustainable Eco-Minimalist platform driving 100% waste diversion for a greener, cleaner urban ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('citizen')}
            className="px-5 py-2.5 rounded-full border border-[#D0D7CA] bg-white text-[#1A2E22] font-semibold text-sm hover:bg-[#F5F5F0] transition-all flex items-center gap-2 shadow-xs"
          >
            <span>🎧</span>
            <span>Contact Support</span>
          </button>
          <button
            onClick={() => onNavigate?.('reports')}
            className="px-5 py-2.5 rounded-full bg-[#2D5A3F] text-white font-semibold text-sm hover:bg-[#21432E] transition-all flex items-center gap-2 shadow-sm"
          >
            <span>📊</span>
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* Main Top Row Grid: City Sanitation Overview (Left) & Next Collection + Sustainability (Right) */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Card: City Sanitation Overview */}
        <div className="lg:col-span-8 eco-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-bold text-[#1A2E22]">
              City Sanitation Overview
            </h2>
            <span className="eco-badge-green">
              <span className="w-2 h-2 rounded-full bg-[#1F402B] animate-pulse" />
              Live Routing
            </span>
          </div>

          <div className="grid md:grid-cols-12 gap-6 items-center">
            {/* Real Nagpur Map using Leaflet + OpenStreetMap */}
            <div className="md:col-span-7 relative h-64 md:h-72 rounded-2xl overflow-hidden border border-[#E0E5DA] shadow-inner">
              <NagpurMap className="w-full h-full" />
              {/* Live badge overlay */}
              <div className="absolute top-3 left-3 z-[500] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/60 shadow-sm text-xs font-semibold text-[#1A2E22] flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-[#2D5A3F] animate-pulse" />
                Nagpur Municipal Area – Live
              </div>
            </div>

            {/* Waste Diverted Donut Chart */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* SVG Donut Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-[#E8EBE4]"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Recycling Segment (45%) */}
                  <path
                    className="text-[#2D5A3F]"
                    strokeDasharray="45, 100"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Compost Segment (33%) offset */}
                  <path
                    className="text-[#8B6D4C]"
                    strokeDasharray="33, 100"
                    strokeDashoffset="-45"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Landfill Segment (22%) offset */}
                  <path
                    className="text-[#CBD5E1]"
                    strokeDasharray="22, 100"
                    strokeDashoffset="-78"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                
                {/* Center Content */}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-[10px] font-extrabold text-[#5C6B61] tracking-wider uppercase">
                    WASTE DIVERTED
                  </span>
                  <span className="text-2xl font-serif font-bold text-[#1A2E22]">
                    78%
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#2D5A3F]" />
                    <span className="text-[#5C6B61] font-medium">Recycling</span>
                  </div>
                  <span className="font-bold text-[#1A2E22]">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#8B6D4C]" />
                    <span className="text-[#5C6B61] font-medium">Compost</span>
                  </div>
                  <span className="font-bold text-[#1A2E22]">33%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#CBD5E1]" />
                    <span className="text-[#5C6B61] font-medium">Landfill</span>
                  </div>
                  <span className="font-bold text-[#1A2E22]">22%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Cards Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: Next Collection Status */}
          <div className="eco-card p-6">
            <h2 className="text-lg font-serif font-bold text-[#1A2E22] mb-4">
              Next Collection Status
            </h2>
            <div className="space-y-4">
              {/* Zone A */}
              <div className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-[#F7F9F5] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#E3EBD8] text-[#2D5A3F] flex items-center justify-center text-base shrink-0 font-bold">
                  📅
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1A2E22]">Zone A – Scheduled</div>
                  <div className="text-xs text-[#5C6B61] mt-0.5">Today, 2 PM</div>
                </div>
              </div>

              {/* Zone B */}
              <div className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-[#F7F9F5] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#F4E8D3] text-[#8B6D4C] flex items-center justify-center text-base shrink-0 font-bold">
                  🚚
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#1A2E22]">Zone B – In Progress</div>
                  <div className="w-full bg-[#E5E8E0] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-[#8B6D4C] h-full w-2/3 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Zone C */}
              <div className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-[#F7F9F5] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#E5E8E0] text-[#5C6B61] flex items-center justify-center text-base shrink-0 font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1A2E22]">Zone C – Completed</div>
                  <div className="text-xs text-[#5C6B61] mt-0.5">Processed 8.2 tons</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Sustainability Impact */}
          <div className="eco-card p-6 relative overflow-hidden">
            {/* Decorative pale background shape */}
            <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-[#F4E8D3]/60 rounded-full blur-xl pointer-events-none" />

            <h2 className="text-lg font-serif font-bold text-[#1A2E22] mb-4">
              Sustainability Impact
            </h2>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4 pt-1">
                <div className="text-2xl text-[#2D5A3F]">🌱</div>
                <div>
                  <div className="text-[10px] font-extrabold text-[#5C6B61] uppercase tracking-wider">
                    CARBON OFFSET
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#1A2E22]">
                    120 <span className="text-sm font-sans font-medium text-[#5C6B61]">Tons</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E8E0] pt-4 flex items-center gap-4">
                <div className="text-2xl text-[#2D5A3F]">💧</div>
                <div>
                  <div className="text-[10px] font-extrabold text-[#5C6B61] uppercase tracking-wider">
                    WATER SAVED
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#1A2E22]">
                    500k <span className="text-sm font-sans font-medium text-[#5C6B61]">Gal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Wide Card: Recent Activity */}
      <div className="eco-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-bold text-[#1A2E22]">
            Recent Activity
          </h2>
          <button
            onClick={() => onNavigate?.('reports')}
            className="text-xs font-semibold text-[#2D5A3F] hover:underline flex items-center gap-1"
          >
            View All &rarr;
          </button>
        </div>

        <div className="space-y-4 divide-y divide-[#E5E8E0]/60">
          <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-sm font-medium text-[#1A2E22]">
                Bin #452 (Zone B) reported full – Collection expedited
              </span>
            </div>
            <span className="text-xs text-[#5C6B61] font-medium pl-5 md:pl-0">10 min ago</span>
          </div>

          <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D5A3F] shrink-0" />
              <span className="text-sm font-medium text-[#1A2E22]">
                Route optimization for Sector 3 completed – 15% efficiency gain
              </span>
            </div>
            <span className="text-xs text-[#5C6B61] font-medium pl-5 md:pl-0">1 hr ago</span>
          </div>

          <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B6D4C] shrink-0" />
              <span className="text-sm font-medium text-[#1A2E22]">
                Monthly sustainability report generated and shared with city council
              </span>
            </div>
            <span className="text-xs text-[#5C6B61] font-medium pl-5 md:pl-0">3 hrs ago</span>
          </div>
        </div>
      </div>

      {/* Page Footer */}
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

export default OverviewView;
