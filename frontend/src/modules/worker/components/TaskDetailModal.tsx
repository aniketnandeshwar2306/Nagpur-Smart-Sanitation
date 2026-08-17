import React, { useState } from 'react';
import type { DailyTask, TaskStatus } from '../types';
import { calculateSegregationBonus } from '../api';

interface TaskDetailModalProps {
  task: DailyTask;
  language: 'en' | 'mr' | 'hi';
  onClose: () => void;
  onVerify: (task: DailyTask) => void;
  onStatusUpdate: (taskId: string, newStatus: TaskStatus, notes?: string) => void;
  onNavigateToMap: (task: DailyTask) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  language,
  onClose,
  onVerify,
  onStatusUpdate,
  onNavigateToMap
}) => {
  const [workerNotes, setWorkerNotes] = useState<string>(task.worker_notes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSaveNotes = () => {
    setIsSaving(true);
    onStatusUpdate(task.id, task.status, workerNotes);
    setTimeout(() => setIsSaving(false), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400">
                {task.ticket_number}
              </span>
              <span className="text-xs text-slate-400">• {task.location.zone_name}</span>
            </div>
            <h3 className="font-bold text-slate-100 text-base mt-0.5">
              {task.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Complaint Image if present */}
          {task.image_url && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video max-h-52">
              <img
                src={task.image_url}
                alt="Complaint Site"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* AI Segregation Score & Earned Bonus if available */}
          {task.segregation_score !== null && task.segregation_score !== undefined && (() => {
            const earnedBonus = (task.bonus_awarded !== undefined && task.bonus_awarded !== null && task.bonus_awarded > 0)
              ? task.bonus_awarded
              : calculateSegregationBonus(task.segregation_score, task.verification_status);

            return (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs ${
                    task.segregation_score >= 80
                      ? 'bg-emerald-500 text-slate-950'
                      : task.segregation_score >= 60
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-rose-600 text-white'
                  }`}>
                    <span>{task.segregation_score}%</span>
                    <span className="text-[8px] uppercase">Purity</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">
                      {task.verification_status || (task.segregation_score >= 75 ? 'PASSED' : 'WARNING')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      NMC AI Purity Verified
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Purity Bonus</span>
                  <span className="text-sm font-black text-lime-400">
                    {earnedBonus > 0 ? `+₹${earnedBonus}` : '₹0 (Low Score)'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Description */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1 text-[10px]">
              Issue Description
            </span>
            <p className="text-slate-200 leading-relaxed">{task.description}</p>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-bold">WASTE TYPE</span>
              <span className="text-amber-300 font-semibold text-xs">{task.waste_type}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-bold">ESTIMATED TIME</span>
              <span className="text-slate-200 font-semibold text-xs">{task.estimated_duration_mins} mins</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-bold">CITIZEN NAME</span>
              <span className="text-slate-200 font-semibold text-xs">{task.citizen_name || 'NMC Public Desk'}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-bold">CITIZEN PHONE</span>
              <span className="text-emerald-400 font-semibold text-xs">{task.citizen_contact || 'N/A'}</span>
            </div>
          </div>

          {/* Location */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] block font-bold uppercase">LOCATION & LANDMARK</span>
            <p className="text-slate-200 font-medium">{task.location.address}</p>
            {task.location.landmark && (
              <p className="text-amber-400/90 text-[11px]">📍 Landmark: {task.location.landmark}</p>
            )}
          </div>

          {/* Worker Field Notes */}
          <div>
            <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1.5">
              Field Action Notes / Resegregation Remarks
            </label>
            <textarea
              rows={3}
              value={workerNotes}
              onChange={e => setWorkerNotes(e.target.value)}
              placeholder="e.g. Segregated 4 bins of wet waste. Disinfected site with lime powder."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex justify-end mt-1">
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700"
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => {
                onNavigateToMap(task);
                onClose();
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
            >
              <span>🗺️</span>
              <span>View On GIS Map</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onVerify(task);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-md"
              >
                📷 {language === 'mr' ? 'AI तपासणी' : 'AI Verify'}
              </button>
              {task.status !== 'COMPLETED' ? (
                <button
                  onClick={() => {
                    onStatusUpdate(task.id, 'COMPLETED', workerNotes);
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  ✓ {language === 'mr' ? 'पूर्ण करा' : 'Complete'}
                </button>
              ) : (
                <span className="text-emerald-400 font-bold px-2 py-1">Completed</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
