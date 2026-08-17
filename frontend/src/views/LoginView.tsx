import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { INDIAN_LANGUAGES } from '../utils/languages';

type UserRole = 'citizen' | 'worker' | 'admin';

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  ward: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  vehicle_number?: string;
  zone_assigned?: string;
}

interface LoginViewProps {
  onAuthSuccess: (token: string, user: AuthUser) => void;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ROLE_CONFIG: Record<UserRole, {
  title: string;
  subtitle: string;
  icon: string;
  placeholder: string;
  accentColor: string;
  accentBg: string;
  borderColor: string;
  gradient: string;
  gradientDark: string;
  endpoint: string;
}> = {
  citizen: {
    title: 'Citizen Portal',
    subtitle: 'Report waste, track schedules & earn rewards',
    icon: '👨‍👩‍👧‍👦',
    placeholder: 'Phone or Email (e.g. aniket@example.com)',
    accentColor: '#2D5A3F',
    accentBg: 'bg-[#2D5A3F]',
    borderColor: 'border-[#2D5A3F]/30',
    gradient: 'from-[#E3EBD8]/40 to-white',
    gradientDark: 'from-emerald-950/40 to-slate-900',
    endpoint: '/api/auth/citizen/login',
  },
  worker: {
    title: 'Worker Portal',
    subtitle: 'View tasks, routes & verify waste segregation',
    icon: '🚴',
    placeholder: 'Employee ID or Phone (e.g. +91 98230 02222)',
    accentColor: '#8B6D4C',
    accentBg: 'bg-[#8B6D4C]',
    borderColor: 'border-[#8B6D4C]/30',
    gradient: 'from-[#F4E8D3]/40 to-white',
    gradientDark: 'from-amber-950/40 to-slate-900',
    endpoint: '/api/auth/worker/login',
  },
  admin: {
    title: 'Admin Portal',
    subtitle: 'Fleet tracking, grievance dispatch & analytics',
    icon: '🏢',
    placeholder: 'Admin Email (e.g. priya.sharma@nmc.gov.in)',
    accentColor: '#1d4ed8',
    accentBg: 'bg-blue-700',
    borderColor: 'border-blue-500/30',
    gradient: 'from-blue-50/40 to-white',
    gradientDark: 'from-blue-950/40 to-slate-900',
    endpoint: '/api/auth/admin/login',
  },
};

export const LoginView: React.FC<LoginViewProps> = ({
  onAuthSuccess,
  currentLang,
  onLanguageChange,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const currentRole = (role as UserRole) || 'citizen';
  const config = ROLE_CONFIG[currentRole] || ROLE_CONFIG.citizen;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}${config.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Login failed. Please check your credentials.');
        return;
      }

      onAuthSuccess(data.access_token, data.user);
    } catch {
      setError('Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F5F5F0] text-[#1A2E22]'
    }`}>
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-6 flex items-center justify-between gap-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-2xl bg-[#2D5A3F] text-white flex items-center justify-center text-xl font-bold shadow-md">
            🌿
          </div>
          <div>
            <span className="text-2xl font-serif font-bold tracking-tight">
              Nagpur<span className="text-[#2D5A3F] font-sans font-semibold text-xl">Clean</span>
            </span>
            <span className="block text-xs font-semibold text-[#5C6B61]">Smart Sanitation Ops Hub</span>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDarkMode}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
              : 'bg-white border-[#E5E8E0] text-[#1A2E22] hover:bg-[#EBF0E6]'
            }`}
          >
            <span>{isDarkMode ? '☀️' : '🌟'}</span>
          </button>

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
                {lang.flag} {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className={`w-full max-w-md rounded-3xl border-2 ${config.borderColor} shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-slate-900' : 'bg-white'
        }`}>
          {/* Card Header */}
          <div className={`bg-gradient-to-br ${isDarkMode ? config.gradientDark : config.gradient} px-8 py-10 text-center`}>
            <div className="w-20 h-20 rounded-3xl bg-white/90 border border-white/60 shadow-lg flex items-center justify-center text-4xl mx-auto mb-5">
              {config.icon}
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">{config.title}</h1>
            <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
              {config.subtitle}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
                {currentRole === 'citizen' ? 'Phone or Email' : currentRole === 'worker' ? 'Employee ID or Phone' : 'Admin Email or ID'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={config.placeholder}
                required
                className={`w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-slate-500'
                  : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22] placeholder-[#5C6B61]/60 focus:ring-[#2D5A3F]/40'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={4}
                  className={`w-full px-4 py-3.5 pr-12 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-slate-500'
                    : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22] placeholder-[#5C6B61]/60 focus:ring-[#2D5A3F]/40'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-60 hover:opacity-100 transition-opacity"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold text-white text-sm shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              style={{ backgroundColor: config.accentColor }}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Authenticating...
                </>
              ) : (
                <>Sign In &rarr;</>
              )}
            </button>

            {currentRole === 'citizen' && (
              <p className={`text-center text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
                New to NagpurClean?{' '}
                <Link
                  to="/register/citizen"
                  className="text-[#2D5A3F] font-bold hover:underline"
                >
                  Register here &rarr;
                </Link>
              </p>
            )}

            {/* Demo Credentials */}
            <div className={`mt-4 p-4 rounded-xl border text-xs space-y-1 ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#5C6B61]'
            }`}>
              <p className="font-bold uppercase tracking-wider mb-1.5">🔑 Demo Credentials</p>
              {currentRole === 'citizen' && <p><strong>Username:</strong> aniket@example.com &nbsp; <strong>Password:</strong> pass</p>}
              {currentRole === 'worker' && <p><strong>Username:</strong> +91 98230 02222 &nbsp; <strong>Password:</strong> pass</p>}
              {currentRole === 'admin' && <p><strong>Username:</strong> priya.sharma@nmc.gov.in &nbsp; <strong>Password:</strong> admin123</p>}
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className={`px-6 md:px-12 py-6 border-t flex items-center justify-center gap-2 text-xs ${
        isDarkMode ? 'border-slate-800 text-slate-500' : 'border-[#E5E8E0] text-[#5C6B61]'
      }`}>
        <span>🌿</span>
        <span>Sustainability Ops Hub &copy; 2024 Nagpur Smart City Corporation</span>
      </footer>
    </div>
  );
};

export default LoginView;
