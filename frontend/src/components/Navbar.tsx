import React from 'react';

export type MainTab = 'overview' | 'dashboard' | 'analytics' | 'fleet' | 'citizen' | 'admin' | 'worker' | 'reports' | 'smartbins' | 'incidents' | 'settings';

interface NavbarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: MainTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'citizen', label: 'Citizen Portal' },
    { id: 'worker', label: 'Worker Portal' },
  ];

  return (
    <header className="bg-white border-b border-[#E5E8E0] sticky top-0 z-40 px-6 py-3.5 shadow-sm">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('overview')}>
          <div className="w-8 h-8 rounded-full bg-[#E3EBD8] flex items-center justify-center text-[#2D5A3F] text-lg font-bold">
            🌿
          </div>
          <span className="text-xl font-serif font-bold text-[#1A2E22] tracking-tight">
            Nagpur<span className="text-[#2D5A3F] font-sans font-semibold text-lg">Clean</span>
          </span>
        </div>

        {/* Top Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`text-base font-semibold transition-all relative py-1 ${
                  isActive
                    ? 'text-[#2D5A3F] font-bold'
                    : 'text-[#5C6B61] hover:text-[#1A2E22]'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2D5A3F] rounded-full animate-fade-in" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status & User Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-[#F4F7F2] border border-[#E5E8E0] px-3.5 py-1.5 rounded-full text-sm font-semibold text-[#2D5A3F]">
            <span className="text-base">🍃</span>
            <span>4.2 Tons Diverted</span>
          </div>

          {/* Module Switcher */}
          <div className="flex items-center gap-1 bg-[#F5F5F0] border border-[#E5E8E0] p-1 rounded-full text-sm font-semibold">
            <button
              onClick={() => onTabChange('citizen')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                activeTab === 'citizen' ? 'bg-[#2D5A3F] text-white shadow-sm' : 'text-[#5C6B61] hover:text-[#1A2E22]'
              }`}
            >
              Citizen
            </button>
            <button
              onClick={() => onTabChange('admin')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                activeTab === 'admin' ? 'bg-[#2D5A3F] text-white shadow-sm' : 'text-[#5C6B61] hover:text-[#1A2E22]'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => onTabChange('worker')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                activeTab === 'worker' ? 'bg-[#2D5A3F] text-white shadow-sm' : 'text-[#5C6B61] hover:text-[#1A2E22]'
              }`}
            >
              Worker
            </button>
          </div>

          <button
            className="w-9 h-9 rounded-full bg-[#2D5A3F] text-white flex items-center justify-center font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
            title="User Profile"
          >
            👤
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
