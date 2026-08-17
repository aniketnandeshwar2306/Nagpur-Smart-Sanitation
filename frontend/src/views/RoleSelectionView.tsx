import React, { useState } from 'react';
import { INDIAN_LANGUAGES, UI_TRANSLATIONS } from '../utils/languages';
import { useAuth, DEFAULT_USERS, type UserRole } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

export type { UserRole };

interface RoleSelectionViewProps {
  onSelectRole: (role: UserRole) => void;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const RoleSelectionView: React.FC<RoleSelectionViewProps> = ({
  onSelectRole,
  currentLang,
  onLanguageChange,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.en;
  const { user, isAuthenticated, updateUser } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('citizen');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'profile'>('login');

  const handleOpenAuth = (role: UserRole, mode: 'login' | 'register' = 'login') => {
    setAuthModalRole(role);
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleQuickDemoEnter = (role: UserRole) => {
    updateUser(DEFAULT_USERS[role]);
    onSelectRole(role);
  };

  const roles: {
    id: UserRole;
    titleKey: string;
    descKey: string;
    icon: string;
    badge: string;
    bgGradient: string;
    borderColor: string;
    accentColor: string;
    features: string[];
  }[] = [
    {
      id: 'citizen',
      titleKey: t.citizenRole,
      descKey: t.citizenDesc,
      icon: '🏡',
      badge: 'Nagpur Resident',
      bgGradient: isDarkMode ? 'from-emerald-950/60 to-slate-900' : 'from-[#E3EBD8]/60 to-white',
      borderColor: 'border-[#2D5A3F]/30',
      accentColor: '#2D5A3F',
      features: ['📸 Report Waste Grievance', '🚛 Live Truck Tracker', '📅 Weekly Pickup Schedule', '🌿 GreenPoints & Rewards'],
    },
    {
      id: 'admin',
      titleKey: t.adminRole,
      descKey: t.adminDesc,
      icon: '🛡️',
      badge: 'NMC Executive',
      bgGradient: isDarkMode ? 'from-blue-950/60 to-slate-900' : 'from-[#dbeafe]/60 to-white',
      borderColor: 'border-blue-500/30',
      accentColor: '#1d4ed8',
      features: ['🗺️ Real-time Fleet Tracking', '📋 Grievance Dispatch & SLA', '📊 Ward Diversion Analytics', '👷 Staff & Zone Management'],
    },
    {
      id: 'worker',
      titleKey: t.workerRole,
      descKey: t.workerDesc,
      icon: '👷',
      badge: 'Sanitation Driver & Staff',
      bgGradient: isDarkMode ? 'from-amber-950/60 to-slate-900' : 'from-[#F4E8D3]/60 to-white',
      borderColor: 'border-[#8B6D4C]/30',
      accentColor: '#8B6D4C',
      features: ['🚚 Live Route Navigation', '🗑️ Smart Bin Collection Mark', '⏱️ Real-time ETA Tracker', '📋 Daily Shift Log'],
    },
  ];

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authModalRole}
        initialMode={authModalMode}
        onSuccess={(role) => onSelectRole(role)}
      />

      <div className={`min-h-screen flex flex-col justify-between p-6 md:p-12 transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F5F5F0] text-[#1A2E22]'
      }`}>
        {/* Top Header Bar */}
        <header className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D5A3F] text-white flex items-center justify-center text-xl font-bold shadow-md">
              🌿
            </div>
            <div>
              <span className="text-2xl font-serif font-bold tracking-tight">
                Nagpur<span className="text-[#2D5A3F] font-sans font-semibold text-xl">Clean</span>
              </span>
              <span className="block text-xs font-semibold text-[#5C6B61]">Smart Sanitation Ops Hub</span>
            </div>
          </div>

          {/* Top Controls: Auth Button, Dark Mode Toggle & Language Selector */}
          <div className="flex items-center gap-3">
            {/* Top Auth Profile / Sign In Button */}
            <button
              onClick={() => {
                setAuthModalRole(user.role);
                setAuthModalMode(isAuthenticated ? 'profile' : 'login');
                setAuthModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 cursor-pointer"
            >
              <span>{isAuthenticated ? '👤' : '🔐'}</span>
              <span>{isAuthenticated ? `${user.name} (${user.role})` : 'Sign In / Register'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                  : 'bg-white border-[#E5E8E0] text-[#1A2E22] hover:bg-[#EBF0E6]'
              }`}
            >
              <span>{isDarkMode ? '☀️' : '🌙'}</span>
              <span>{isDarkMode ? t.lightMode : t.darkMode}</span>
            </button>

            {/* All Indian Languages Selector */}
            <div className="relative">
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value)}
                className={`appearance-none px-4 py-1.5 pr-8 rounded-full border text-xs font-bold cursor-pointer transition-all shadow-xs ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-white border-[#E5E8E0] text-[#1A2E22]'
                }`}
              >
                {INDIAN_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-60">
                -
              </div>
            </div>
          </div>
        </header>

        {/* Main Role Selection Area */}
        <main className="max-w-7xl mx-auto w-full my-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="eco-badge-green text-sm font-bold mb-3">
              ✨ Municipal Portal Gateway
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mt-3">
              {t.selectRole}
            </h1>
            <p className="text-base md:text-lg text-[#5C6B61] mt-3 leading-relaxed">
              {t.selectRoleSub}
            </p>
          </div>

          {/* 3 Role Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {roles.map((r) => (
              <div
                key={r.id}
                className={`eco-card p-8 flex flex-col justify-between bg-gradient-to-b ${r.bgGradient} border-2 ${r.borderColor} hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 relative overflow-hidden`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-white/60 dark:border-slate-700 shadow-md flex items-center justify-center text-3xl">
                      {r.icon}
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800 border border-white/60 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs">
                      {r.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                      {r.titleKey}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-normal">
                      {r.descKey}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                    {r.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 space-y-2.5">
                  {/* Primary: Sign In / Authenticate into Portal */}
                  <button
                    onClick={() => handleOpenAuth(r.id, 'login')}
                    className="w-full py-3 px-5 rounded-xl font-bold text-xs text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: r.accentColor }}
                  >
                    <span>🔐 Sign In as {r.id.toUpperCase()}</span>
                    <span>&rarr;</span>
                  </button>

                  {/* Secondary: Instant Demo 1-Click Enter */}
                  <button
                    onClick={() => handleQuickDemoEnter(r.id)}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>⚡ Quick 1-Click Demo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto w-full pt-8 border-t border-[#E5E8E0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5C6B61]">
          <div className="flex items-center gap-2">
            <span>🌿</span>
            <span>Sustainability Ops Hub © 2024 Nagpur Smart City Corporation</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <span>100% Waste Diversion Mission</span>
            <span>Dharampeth • Sitabuldi • Civil Lines</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default RoleSelectionView;
