import React from 'react';
import type { MainTab } from './Navbar';

interface SidebarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const mainItems: { id: MainTab; label: string; icon: string }[] = [
    { id: 'reports', label: 'Reports', icon: '📄' },
    { id: 'smartbins', label: 'Smart Bins', icon: '🗑️' },
    { id: 'incidents', label: 'Incidents', icon: '⚠️' },
  ];

  const systemItems: { id: MainTab; label: string; icon: string }[] = [
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E5E8E0] min-h-[calc(100vh-65px)] p-6 flex flex-col justify-between hidden lg:flex shrink-0">
      <div className="space-y-6">
        {/* Navigation Items */}
        <div className="space-y-1.5">
          {mainItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#E3EBD8] text-[#2D5A3F] font-bold shadow-xs'
                    : 'text-[#5C6B61] hover:bg-[#F5F5F0] hover:text-[#1A2E22]'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* System Group */}
        <div>
          <div className="text-[11px] font-bold text-[#8C988F] uppercase tracking-wider px-3.5 mb-2">
            System
          </div>
          <div className="space-y-1.5">
            {systemItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#E3EBD8] text-[#2D5A3F] font-bold shadow-xs'
                      : 'text-[#5C6B61] hover:bg-[#F5F5F0] hover:text-[#1A2E22]'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Banner Card: Eco Pulse */}
      <div className="bg-[#C8E8CD] border border-[#B3DEC0] rounded-2xl p-4 mt-8">
        <div className="font-bold text-[#1F402B] text-xs uppercase tracking-wide mb-1">
          Eco Pulse
        </div>
        <p className="text-xs text-[#295237] leading-relaxed font-medium">
          Nagpur targets 100% diversion by 2026.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
