import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminDashboard from './modules/admin/AdminDashboard';
import CitizenDashboard from './modules/citizen/CitizenDashboard';
import WorkerDashboard from './modules/worker/WorkerDashboard';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              Nagpur SmartSanitation Platform
            </h1>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link to="/admin" className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                Admin Module
              </Link>
              <Link to="/citizen" className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors">
                Citizen Module
              </Link>
              <Link to="/worker" className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
                Worker Module
              </Link>
            </nav>
          </div>
        </header>

        <main className="py-8">
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/citizen" element={<CitizenDashboard />} />
            <Route path="/worker" element={<WorkerDashboard />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
