import React, { useState, useRef } from 'react';
import type { DailyTask, SegregationVerificationResult } from '../types';
import { workerApi } from '../api';

interface SegregationModalProps {
  task: DailyTask | null;
  language: 'en' | 'mr' | 'hi';
  onClose: () => void;
  onVerificationComplete: (taskId: string, result: SegregationVerificationResult) => void;
}

const PRESET_SAMPLES = [
  {
    name: 'Futala Organic Wet Waste',
    name_mr: 'ओला सेंद्रिय कचरा (भाजीपाला व फळे)',
    hint: 'WET',
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80',
    desc: 'Clean kitchen vegetable scraps, tea leaves, compostable matter'
  },
  {
    name: 'Sitabuldi Dry Recyclables',
    name_mr: 'सुका पुनर्वापरयोग्य कचरा (कागद/प्लास्टिक)',
    hint: 'DRY',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    desc: 'Cardboard boxes, PET bottles, clean packaging'
  },
  {
    name: 'Mixed Contaminated Bin',
    name_mr: 'मिश्रित / अयोग्य वर्गीकृत कचरा',
    hint: 'MIXED',
    imageUrl: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=600&auto=format&fit=crop&q=80',
    desc: 'Plastic carry bags mixed with wet food & thermocol'
  },
  {
    name: 'Medical / Hazardous Lane',
    name_mr: 'धोकादायक / वैद्यकीय कचरा',
    hint: 'HAZARDOUS',
    imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&auto=format&fit=crop&q=80',
    desc: 'Clinical disposables, yellow bag items, chemical containers'
  }
];

export const SegregationModal: React.FC<SegregationModalProps> = ({
  task,
  language,
  onClose,
  onVerificationComplete
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(
    task?.image_url || PRESET_SAMPLES[0].imageUrl
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedHint, setSelectedHint] = useState<string>('WET');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [result, setResult] = useState<SegregationVerificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleSelectPreset = (sample: typeof PRESET_SAMPLES[0]) => {
    setSelectedImage(sample.imageUrl);
    setSelectedFile(null);
    setSelectedHint(sample.hint);
    setResult(null);
  };

  const handleRunAIAnalysis = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      setAnalysisStep('Uploading frame & preprocessing image matrix...');
      await new Promise(r => setTimeout(r, 600));

      setAnalysisStep('Extracting deep spectral & texture feature maps...');
      await new Promise(r => setTimeout(r, 700));

      setAnalysisStep('Computing Wet/Dry/Hazardous segregation purity scores...');
      await new Promise(r => setTimeout(r, 700));

      // Call verification API
      let fileToUpload: File | Blob;
      if (selectedFile) {
        fileToUpload = selectedFile;
      } else {
        // Create dummy blob from preset
        fileToUpload = new Blob([`preset-${selectedHint}-${Date.now()}`], { type: 'image/jpeg' });
      }

      const res = await workerApi.verifySegregation(fileToUpload, task?.id, selectedHint);
      setResult(res);
    } catch (err) {
      console.error('AI verification failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmCompletion = () => {
    if (task && result) {
      onVerificationComplete(task.id, result);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scaleUp">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {language === 'mr' ? 'AI कचरा वर्गीकरण तपासणी' : 'AI Waste Segregation Verification'}
              </h3>
              <p className="text-xs text-slate-400">
                {task ? `${task.ticket_number} • ${task.title}` : 'Nagpur SmartSanitation Vision AI'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Preset Selector for Fast Field Testing */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
              {language === 'mr' ? 'नमुना कचरा निवडा किंवा स्वतःचा फोटो घ्या' : 'Select Demonstration Sample or Capture Photo'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(sample)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    selectedImage === sample.imageUrl
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">
                    {language === 'mr' ? sample.name_mr : sample.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                    {sample.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview & Upload Controls */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video max-h-72 flex items-center justify-center group">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Waste for AI Verification"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <span className="text-4xl block mb-2">📷</span>
                <span className="text-sm">No photo captured yet</span>
              </div>
            )}

            {/* AI Scanline Overlay Animation */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center p-4">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
                <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-4 text-center shadow-2xl max-w-sm">
                  <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="font-bold text-amber-400 text-sm">NMC AI Engine Scanning...</p>
                  <p className="text-xs text-slate-300 mt-1 font-mono">{analysisStep}</p>
                </div>
              </div>
            )}

            {/* Upload / Camera Trigger Buttons */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 backdrop-blur-md shadow-lg flex items-center gap-1.5"
              >
                <span>📁</span>
                <span>Upload File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Action to trigger AI Scan */}
          {!result && (
            <button
              onClick={handleRunAIAnalysis}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-right transition-all text-slate-950 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <span>⚡</span>
              <span>
                {language === 'mr' ? 'AI वर्गीकरण तपासणी सुरू करा' : 'Run AI Segregation Verification'}
              </span>
            </button>
          )}

          {/* AI Result Card */}
          {result && (
            <div className="bg-slate-950 border border-slate-700 rounded-2xl p-4 space-y-4 animate-fadeIn">
              {/* Top Score & Verdict */}
              <div className="flex items-center justify-between gap-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg ${
                      result.verdict === 'PASSED'
                        ? 'bg-emerald-500 text-slate-950'
                        : result.verdict === 'WARNING'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    <span className="text-lg leading-none">{result.overall_score}%</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold">Purity</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                          result.verdict === 'PASSED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : result.verdict === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {result.verdict === 'PASSED' ? 'o Segregation Verified' : result.verdict === 'WARNING' ? '⚠️ Minor Contamination' : '✕ Unsegregated'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Conf: {(result.ai_confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm mt-1">
                      {result.primary_category}
                    </h4>
                  </div>
                </div>

                {/* Incentive Badge */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Worker Bonus</span>
                  <span className="text-base font-black text-lime-400">+₹{result.incentive_earned_inr}</span>
                </div>
              </div>

              {/* Composition Breakdown Bars */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Composition Analysis
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl">
                    <span className="text-[10px] text-emerald-300 block">Wet Organic</span>
                    <span className="font-bold text-emerald-400 text-sm">{result.breakdown.wet_organic_pct}%</span>
                  </div>
                  <div className="bg-sky-950/40 border border-sky-500/30 p-2 rounded-xl">
                    <span className="text-[10px] text-sky-300 block">Dry Recyclable</span>
                    <span className="font-bold text-sky-400 text-sm">{result.breakdown.dry_recyclable_pct}%</span>
                  </div>
                  <div className="bg-purple-950/40 border border-purple-500/30 p-2 rounded-xl">
                    <span className="text-[10px] text-purple-300 block">Sanitary / Haz</span>
                    <span className="font-bold text-purple-400 text-sm">{result.breakdown.sanitary_hazardous_pct}%</span>
                  </div>
                  <div className="bg-rose-950/40 border border-rose-500/30 p-2 rounded-xl">
                    <span className="text-[10px] text-rose-300 block">Contaminants</span>
                    <span className="font-bold text-rose-400 text-sm">{result.breakdown.unsegregated_contaminant_pct}%</span>
                  </div>
                </div>
              </div>

              {/* Detected Objects & Contaminants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-300 block mb-1.5">Detected Materials:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.detected_items.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        o {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-1.5">Contaminants Flagged:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.contaminants_found.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 text-[11px]">
                        ⚠️ {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feedback Note in Marathi / English */}
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200 leading-relaxed">
                <p className="font-semibold">{language === 'mr' ? result.feedback_marathi : result.feedback_english}</p>
                <p className="text-[11px] text-slate-400 mt-1">🛡️ {result.safety_advisory}</p>
              </div>

              {/* Confirmation Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Rescan Photo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCompletion}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all active:scale-95"
                >
                  Confirm & Update Task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
