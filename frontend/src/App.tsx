import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import RoleSelectionView from './views/RoleSelectionView';
import type { UserRole } from './views/RoleSelectionView';
import UnifiedSidebar from './components/UnifiedSidebar';
import OverviewView from './views/OverviewView';
import DashboardView from './views/DashboardView';
import AnalyticsView from './views/AnalyticsView';
import ReportsView from './views/ReportsView';
import SmartBinsView from './views/SmartBinsView';
import IncidentsView from './views/IncidentsView';
import SettingsView from './views/SettingsView';
import AdminDashboard from './modules/admin/AdminDashboard';
import CitizenDashboard from './modules/citizen/CitizenDashboard';
import WorkerDashboard from './modules/worker/WorkerDashboard';
import { INDIAN_LANGUAGES } from './utils/languages';
import { LanguageProvider, useLanguage, type Language } from './context/LanguageContext';
import { AuthProvider, useAuth, DEFAULT_USERS } from './context/AuthContext';
import AuthModal from './components/AuthModal';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setLanguage } = useLanguage();
  const { user, updateUser } = useAuth();
  const [isMobileAuthModalOpen, setIsMobileAuthModalOpen] = useState(false);

  // Always force Role Selection screen at starting route '/' or when role is not set
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(() => {
    // If user is at root path, always ask for role selection first
    if (location.pathname === '/' || location.pathname === '') {
      return null;
    }
    const saved = localStorage.getItem('nagpur_clean_role');
    return (saved as UserRole) || null;
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('nagpur_clean_theme') === 'dark';
  });

  // Language State (10 Indian languages)
  const [currentLang, setCurrentLang] = useState<string>(() => {
    return localStorage.getItem('nagpur_clean_lang') || 'en';
  });

  // Apply Dark Mode class to <html> and <body>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('nagpur_clean_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('nagpur_clean_theme', 'light');
    }
  }, [isDarkMode]);

  // Persist language selection
  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    setLanguage(lang as Language);
    localStorage.setItem('nagpur_clean_lang', lang);
    localStorage.setItem('nss_language', lang);
  };

  // Select Role Action (Seamless 1-click portal switching with automatic user profile alignment)
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    localStorage.setItem('nagpur_clean_role', role);
    if (user.role !== role) {
      updateUser(DEFAULT_USERS[role]);
    }

    // Navigate to default view for role
    if (role === 'citizen') navigate('/overview');
    else if (role === 'admin') navigate('/admin');
    else if (role === 'worker') navigate('/worker');
  };

  // Switch Role Action (Return to Role Selection Screen)
  const handleSwitchRole = () => {
    setSelectedRole(null);
    localStorage.removeItem('nagpur_clean_role');
    navigate('/');
  };

  // Active view tab state
  const getCurrentTab = (): string => {
    const path = location.pathname.substring(1);
    if (!path) {
      if (selectedRole === 'admin') return 'admin';
      if (selectedRole === 'worker') return 'dashboard';
      return 'overview';
    }
    return path;
  };

  const activeTab = getCurrentTab();

  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
  };

  // 1. If NO role selected, show Role Selection Screen
  if (!selectedRole || location.pathname === '/') {
    return (
      <RoleSelectionView
        onSelectRole={handleSelectRole}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  // 2. Render Portal Layout with LEFT Sidebar & Role Content
  return (
    <div className={`min-h-screen font-sans flex flex-col lg:flex-row transition-colors ${
      isDarkMode ? 'bg-[#0B131E] text-slate-100' : 'bg-[#F5F5F0] text-[#1A2E22]'
    }`}>
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <UnifiedSidebar
        activeRole={selectedRole}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSwitchRole={handleSwitchRole}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
      />

      {/* MOBILE TOP BAR (visible on screens under lg breakpoint) */}
      <AuthModal
        isOpen={isMobileAuthModalOpen}
        onClose={() => setIsMobileAuthModalOpen(false)}
        initialRole={selectedRole}
      />

      <div className={`lg:hidden border-b p-4 flex items-center justify-between gap-3 sticky top-0 z-40 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E5E8E0]'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span className="font-serif font-bold text-lg">NagpurClean</span>
          <button
            onClick={() => setIsMobileAuthModalOpen(true)}
            className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#E3EBD8] text-[#2D5A3F] cursor-pointer"
          >
            {selectedRole} • 👤
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full border text-xs font-bold"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          <select
            value={currentLang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-xs font-bold p-1.5 rounded-lg border bg-transparent"
          >
            {INDIAN_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.code.toUpperCase()}</option>
            ))}
          </select>

          <button
            onClick={handleSwitchRole}
            className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#2D5A3F] text-white"
          >
            Role 🔄
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 min-w-0 overflow-x-hidden">
        {/* CITIZEN PORTAL ROUTES */}
        {selectedRole === 'citizen' && (
          <Routes>
            <Route path="/" element={<OverviewView onNavigate={(view) => handleTabChange(view)} />} />
            <Route path="/overview" element={<OverviewView onNavigate={(view) => handleTabChange(view)} />} />
            <Route path="/dashboard" element={<DashboardView onNavigate={(view) => handleTabChange(view)} />} />
            <Route path="/analytics" element={<AnalyticsView onNavigate={(view) => handleTabChange(view)} />} />
            <Route path="/fleet" element={<DashboardView onNavigate={(view) => handleTabChange(view)} />} />
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/smartbins" element={<SmartBinsView />} />
            <Route path="/incidents" element={<IncidentsView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/report" element={<CitizenDashboard activeTab="report" onNavigate={handleTabChange} />} />
            <Route path="/myReports" element={<CitizenDashboard activeTab="myReports" onNavigate={handleTabChange} />} />
            <Route path="/tracker" element={<CitizenDashboard activeTab="tracker" onNavigate={handleTabChange} />} />
            <Route path="/schedule" element={<CitizenDashboard activeTab="schedule" onNavigate={handleTabChange} />} />
            <Route path="/rewards" element={<CitizenDashboard activeTab="rewards" onNavigate={handleTabChange} />} />
            <Route path="/learn" element={<CitizenDashboard activeTab="learn" onNavigate={handleTabChange} />} />
            <Route path="/citizen" element={<CitizenDashboard activeTab="overview" onNavigate={handleTabChange} />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        )}

        {/* ADMIN PORTAL ROUTES */}
        {selectedRole === 'admin' && (
          <Routes>
            <Route path="/" element={<AdminDashboard activeTab={activeTab} onNavigate={handleTabChange} />} />
            <Route path="/admin" element={<AdminDashboard activeTab={activeTab} onNavigate={handleTabChange} />} />
            <Route path="/overview" element={<AdminDashboard activeTab="overview" onNavigate={handleTabChange} />} />
            <Route path="/complaints" element={<AdminDashboard activeTab="complaints" onNavigate={handleTabChange} />} />
            <Route path="/fleet" element={<AdminDashboard activeTab="fleet" onNavigate={handleTabChange} />} />
            <Route path="/workers" element={<AdminDashboard activeTab="workers" onNavigate={handleTabChange} />} />
            <Route path="/zones" element={<AdminDashboard activeTab="zones" onNavigate={handleTabChange} />} />
            <Route path="/reports" element={<AdminDashboard activeTab="reports" onNavigate={handleTabChange} />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        )}

        {/* WORKER PORTAL ROUTES */}
        {selectedRole === 'worker' && (
          <Routes>
            <Route path="/" element={<WorkerDashboard activeTab={activeTab} onNavigate={handleTabChange} />} />
            <Route path="/worker" element={<WorkerDashboard activeTab={activeTab} onNavigate={handleTabChange} />} />
            <Route path="/dashboard" element={<WorkerDashboard activeTab="dashboard" onNavigate={handleTabChange} />} />
            <Route path="/route" element={<WorkerDashboard activeTab="route" onNavigate={handleTabChange} />} />
            <Route path="/bins" element={<WorkerDashboard activeTab="bins" onNavigate={handleTabChange} />} />
            <Route path="/history" element={<WorkerDashboard activeTab="history" onNavigate={handleTabChange} />} />
            <Route path="/profile" element={<WorkerDashboard activeTab="profile" onNavigate={handleTabChange} />} />
            <Route path="*" element={<Navigate to="/worker" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
