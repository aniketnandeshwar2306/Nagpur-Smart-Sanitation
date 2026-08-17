import React from 'react';
import type { UserRole } from '../views/RoleSelectionView';
import { INDIAN_LANGUAGES, UI_TRANSLATIONS } from '../utils/languages';

interface UnifiedSidebarProps {
  activeRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSwitchRole: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  activeRole,
  activeTab,
  onTabChange,
  onSwitchRole,
  isDarkMode,
  onToggleDarkMode,
  currentLang,
  onLanguageChange,
}) => {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.en;

  // Navigation items translated into selected Indian language
  const citizenItems = [
    { id: 'overview', label: t.overview, icon: '🍃' },
    { id: 'dashboard', label: t.dashboard, icon: '📊' },
    { id: 'analytics', label: t.analytics, icon: '📈' },
    { id: 'report', label: t.reportWaste, icon: '📸' },
    { id: 'myReports', label: t.myGrievances, icon: '📋' },
    { id: 'tracker', label: t.liveTracker, icon: '🚛' },
    { id: 'schedule', label: t.weeklySchedule, icon: '📅' },
    { id: 'rewards', label: t.greenPoints, icon: '🌿' },
    { id: 'learn', label: t.segregationGuide, icon: '♻️' },
  ];

  const adminItems = [
    { id: 'overview', label: t.overview, icon: '📊' },
    { id: 'complaints', label: t.grievanceDispatch, icon: '📋' },
    { id: 'fleet', label: t.fleetManagement, icon: '🚛' },
    { id: 'workers', label: t.workerRegistry, icon: '👷' },
    { id: 'zones', label: t.zoneManagement, icon: '🗺️' },
    { id: 'reports', label: t.auditReports, icon: '📄' },
    { id: 'settings', label: t.platformSettings, icon: '⚙️' },
  ];

  const workerItems = [
    { id: 'dashboard', label: t.myDashboard, icon: '🏠' },
    { id: 'route', label: t.myRouteMap, icon: '🗺️' },
    { id: 'bins', label: t.binChecklist, icon: '🗑️' },
    { id: 'history', label: t.shiftHistory, icon: '📋' },
    { id: 'profile', label: t.workerProfile, icon: '👤' },
  ];

  const currentNavItems =
    activeRole === 'citizen' ? citizenItems :
    activeRole === 'admin' ? adminItems : workerItems;

  const roleTitle =
    activeRole === 'citizen' ? t.citizenRole :
    activeRole === 'admin' ? t.adminRole : t.workerRole;

  const roleIcon =
    activeRole === 'citizen' ? '🏡' :
    activeRole === 'admin' ? '🛡️' : '👷';

  return (
    <aside className={`w-72 border-r min-h-screen p-5 flex flex-col justify-between hidden lg:flex shrink-0 transition-colors ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-[#E5E8E0] text-[#1A2E22]'
    }`}>
      <div className="space-y-6">
        {/* Brand Logo & Role Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={onSwitchRole}>
              <div className="w-9 h-9 rounded-2xl bg-[#2D5A3F] text-white flex items-center justify-center text-lg font-bold shadow-sm">
                🌿
              </div>
              <span className="text-xl font-serif font-bold tracking-tight">
                Nagpur<span className="text-[#2D5A3F] font-sans font-semibold text-lg">Clean</span>
              </span>
            </div>

            {/* Switch Role Button */}
            <button
              onClick={onSwitchRole}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E3EBD8] text-[#2D5A3F] hover:bg-[#D0DFCA] transition-colors flex items-center gap-1 cursor-pointer"
              title={t.switchRole}
            >
              <span>🔄</span>
              <span>{t.switchRole}</span>
            </button>
          </div>

          {/* Active Role Badge */}
          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-[#F5F5F0] border-[#E5E8E0]'
          }`}>
            <span className="text-2xl">{roleIcon}</span>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#2D5A3F]">{roleTitle}</div>
              <div className="text-[11px] text-[#5C6B61] dark:text-slate-400 font-medium">Nagpur Sanitation Hub</div>
            </div>
          </div>
        </div>

        {/* Vertical Navigation Links */}
        <nav className="space-y-1.5">
          <div className="text-[11px] font-extrabold text-[#8C988F] uppercase tracking-wider px-3 mb-2">
            Menu
          </div>

          {currentNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2D5A3F] text-white font-bold shadow-md'
                    : isDarkMode
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-[#5C6B61] hover:bg-[#F5F5F0] hover:text-[#1A2E22]'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls & Eco Pulse Banner */}
      <div className="space-y-4 pt-4 border-t border-[#E5E8E0] dark:border-slate-800">
        
        {/* Dark Mode & All Indian Languages Controls */}
        <div className="space-y-2">
          {/* Dark Mode Switcher */}
          <button
            onClick={onToggleDarkMode}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-amber-300'
                : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22] hover:bg-[#EBF0E6]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{isDarkMode ? '☀️' : '🌙'}</span>
              <span>{isDarkMode ? t.lightMode : t.darkMode}</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded-md">
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* All Indian Languages Selector Dropdown */}
          <div className="relative">
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value)}
              className={`w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22]'
              }`}
            >
              {INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60">
              -
            </div>
          </div>
        </div>

        {/* Eco Pulse Banner Card */}
        <div className="bg-[#C8E8CD] dark:bg-emerald-950 border border-[#B3DEC0] dark:border-emerald-800 rounded-2xl p-4">
          <div className="font-extrabold text-[#1F402B] dark:text-emerald-300 text-xs uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <span>🌱</span>
            <span>{t.ecoPulse}</span>
          </div>
          <p className="text-xs text-[#1F402B] dark:text-emerald-200 leading-relaxed font-semibold">
            {t.ecoPulseMsg}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default UnifiedSidebar;
