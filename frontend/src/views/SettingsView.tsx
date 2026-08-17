import React, { useState } from 'react';
import { INDIAN_LANGUAGES } from '../utils/languages';

export const SettingsView: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('nagpur_clean_theme') === 'dark';
  });

  const [currentLang, setCurrentLang] = useState<string>(() => {
    return localStorage.getItem('nagpur_clean_lang') || 'en';
  });

  const handleToggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('nagpur_clean_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('nagpur_clean_theme', 'light');
    }
  };

  const handleSelectLanguage = (code: string) => {
    setCurrentLang(code);
    localStorage.setItem('nagpur_clean_lang', code);
  };

  return (
    <div className="space-y-6 eco-animate-fade max-w-4xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#1A2E22] dark:text-slate-100">Platform Settings</h1>
        <p className="text-sm text-[#5C6B61] dark:text-slate-400 mt-1">Configure appearance, language preferences, municipal parameters, and integrations.</p>
      </div>

      {/* Appearance & Language Settings Card */}
      <div className="eco-card p-6 space-y-6">
        <h3 className="font-serif font-bold text-lg text-[#1A2E22] dark:text-slate-100 mb-1">Appearance & Language</h3>
        
        <div className="space-y-4 text-sm">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-[#E5E8E0] dark:border-slate-800">
            <div>
              <div className="font-semibold text-[#1A2E22] dark:text-slate-100 flex items-center gap-2">
                <span>{isDarkMode ? '🌙' : '☀️'}</span>
                <span>Dark Mode Theme</span>
              </div>
              <div className="text-xs text-[#5C6B61] dark:text-slate-400 mt-0.5">Switch between Eco Light and Dark Mode themes for high visibility</div>
            </div>

            <button
              onClick={handleToggleTheme}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                isDarkMode ? 'bg-[#2D5A3F]' : 'bg-[#E5E8E0]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                isDarkMode ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          {/* All Indian Languages Selector */}
          <div className="py-3 border-b border-[#E5E8E0] dark:border-slate-800">
            <div className="mb-2">
              <div className="font-semibold text-[#1A2E22] dark:text-slate-100 flex items-center gap-2">
                <span>🌐</span>
                <span>Supported Indian Languages</span>
              </div>
              <div className="text-xs text-[#5C6B61] dark:text-slate-400 mt-0.5">Choose from 10 major Indian languages spoken across Maharashtra & India</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
              {INDIAN_LANGUAGES.map((l) => {
                const isSelected = currentLang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => handleSelectLanguage(l.code)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#2D5A3F] text-white border-[#2D5A3F] shadow-sm'
                        : 'bg-[#F5F5F0] dark:bg-slate-800 border-[#E5E8E0] dark:border-slate-700 text-[#1A2E22] dark:text-slate-200 hover:border-[#2D5A3F]'
                    }`}
                  >
                    <span className="text-base">{l.flag}</span>
                    <div className="mt-2">
                      <div className="text-xs font-bold">{l.nativeName}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-[#C8E8CD]' : 'text-[#5C6B61] dark:text-slate-400'}`}>{l.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* General Configuration Card */}
      <div className="eco-card p-6 space-y-6">
        <div>
          <h3 className="font-serif font-bold text-lg text-[#1A2E22] dark:text-slate-100 mb-3">General Configuration</h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-[#E5E8E0] dark:border-slate-800">
              <div>
                <div className="font-semibold text-[#1A2E22] dark:text-slate-100">Automated Truck Dispatch</div>
                <div className="text-xs text-[#5C6B61] dark:text-slate-400">Automatically reroute trucks when bin fill level exceeds 85%</div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2D5A3F]" />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#E5E8E0] dark:border-slate-800">
              <div>
                <div className="font-semibold text-[#1A2E22] dark:text-slate-100">Citizen SMS & WhatsApp Alerts</div>
                <div className="text-xs text-[#5C6B61] dark:text-slate-400">Notify residents 30 minutes before collection truck arrives</div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2D5A3F]" />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-[#1A2E22] dark:text-slate-100">GreenPoints Reward Multiplier</div>
                <div className="text-xs text-[#5C6B61] dark:text-slate-400">Set standard points per verified waste segregation submission</div>
              </div>
              <select className="bg-[#F5F5F0] dark:bg-slate-800 border border-[#E5E8E0] dark:border-slate-700 rounded-lg px-3 py-1 text-xs font-semibold text-[#1A2E22] dark:text-slate-100">
                <option>50 Points / Report</option>
                <option>100 Points / Report</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
