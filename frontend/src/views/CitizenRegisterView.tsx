import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface AuthUser {
  id: string;
  name: string;
  role: 'citizen' | 'worker' | 'admin';
  ward: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
}

interface CitizenRegisterViewProps {
  onAuthSuccess: (token: string, user: AuthUser) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}
import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

const NAGPUR_WARDS = [
  'Ward 1 - Laxmi Nagar', 'Ward 2 - Dharampeth', 'Ward 3 - Hanuman Nagar',
  'Ward 4 - Dhantoli', 'Ward 5 - Nehru Nagar', 'Ward 6 - Gandhibagh',
  'Ward 7 - Satranjipura', 'Ward 8 - Lakadganj', 'Ward 9 - Ashi Nagar',
  'Ward 10 - Mangalwari', 'Ward 11 - Sitabuldi', 'Ward 12 - Nag Road',
  'Ward 13 - Civil Lines', 'Ward 14 - Dharampeth',
];

export const CitizenRegisterView: React.FC<CitizenRegisterViewProps> = ({
  onAuthSuccess,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ward, setWard] = useState('Ward 14 - Dharampeth');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  if (password !== confirmPassword) {
  setError('Passwords do not match.');
  return;
  }

  setIsLoading(true);

  try {
  const res = await fetch(`${API_BASE}/api/auth/citizen/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
  name: name.trim(),
  phone: phone.trim(),
  email: email.trim() || undefined,
  ward,
  password,
  }),
  });

  const data = await res.json();

  if (!res.ok) {
  setError(data.detail || 'Registration failed.');
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
  </div>
  </button>

  <button
  onClick={onToggleDarkMode}
  className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs ${
  isDarkMode
? 'bg-slate-800 border-slate-700 text-amber-300'
  : 'bg-white border-[#E5E8E0] text-[#1A2E22]'
  }`}
  >
  {isDarkMode ? '☀️' : '🌟'}
  </button>
  </header>

  {/* Registration Card */}
  <main className="flex-1 flex items-center justify-center px-6 py-10">
  <div className={`w-full max-w-lg rounded-3xl border-2 border-[#2D5A3F]/30 shadow-2xl overflow-hidden ${
  isDarkMode ? 'bg-slate-900' : 'bg-white'
  }`}>
  {/* Header */}
  <div className={`bg-gradient-to-br ${isDarkMode ? 'from-emerald-950/40 to-slate-900' : 'from-[#E3EBD8]/40 to-white'} px-8 py-8 text-center`}>
  <div className="w-16 h-16 rounded-2xl bg-white/90 border border-white/60 shadow-lg flex items-center justify-center text-3xl mx-auto mb-4">
  🙋
  </div>
  <h1 className="text-2xl font-serif font-bold">Citizen Registration</h1>
  <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
  Join Swachh Nagpur - Report waste, earn GreenPoints
  </p>
  </div>

  {/* Form */}
  <form onSubmit={handleRegister} className="px-8 py-6 space-y-4">
  {error && (
  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
  {error}
  </div>
  )}

  <div>
  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
  Full Name *
  </label>
  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Aniket Nandeshwar"
  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
  isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-slate-500'
  : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22] placeholder-[#5C6B61]/60 focus:ring-[#2D5A3F]/40'
  }`}
  />
  </div>

  <div>
  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
  Phone Number *
  </label>
  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98231 44556"
  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
  isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-slate-500'
  : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22] placeholder-[#5C6B61]/60 focus:ring-[#2D5A3F]/40'
  }`}
  />
  </div>

  <div>
  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
  Email (Optional)
  </label>
  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com"
  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
  isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-slate-500'
  : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22] placeholder-[#5C6B61]/60 focus:ring-[#2D5A3F]/40'
  }`}
  />
  </div>

  <div>
  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
  Ward *
  </label>
  <select value={ward} onChange={(e) => setWard(e.target.value)}
  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
  isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-slate-500'
  : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22] focus:ring-[#2D5A3F]/40'
  }`}
  >
  {NAGPUR_WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
  </select>
  </div>

  <div className="grid grid-cols-2 gap-3">
  <div>
  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
  Password *
  </label>
  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} placeholder="Min 4 chars"
  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
  isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-slate-500'
  : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22] placeholder-[#5C6B61]/60 focus:ring-[#2D5A3F]/40'
  }`}
  />
  </div>
  <div>
  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
  Confirm *
  </label>
  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={4} placeholder="Repeat"
  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
  isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-slate-500'
  : 'bg-[#F5F5F0] border-[#E5E8E0] text-[#1A2E22] placeholder-[#5C6B61]/60 focus:ring-[#2D5A3F]/40'
  }`}
  />
  </div>
  </div>

  <div className="flex items-center gap-2 pt-1">
  <input type="checkbox" id="show-pwd" checked={showPassword} onChange={() => setShowPassword(!showPassword)}
  className="rounded border-gray-300"
  />
  <label htmlFor="show-pwd" className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
  Show passwords
  </label>
  </div>

  <button
  type="submit"
  disabled={isLoading}
  className="w-full py-4 rounded-xl font-bold text-white text-sm shadow-lg bg-[#2D5A3F] transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
  {isLoading ? (
  <><span className="animate-spin">&#9696;</span> Registering...</>
  ) : (
  <>Create Account &rarr;</>
  )}
  </button>

  <p className={`text-center text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#5C6B61]'}`}>
  Already registered - {' '}
  <Link to="/login/citizen" className="text-[#2D5A3F] font-bold hover:underline">
  Sign in &rarr;
  </Link>
  </p>
  </form>
  </div>
  </main>
  </div>
  );
};

export default CitizenRegisterView;
