import React, { useState, useRef, useEffect } from 'react';
import type { DailyTask, SegregationVerificationResult } from '../types';
import { workerApi } from '../api';

interface SegregationModalProps {
  task: DailyTask | null;
  language: 'en' | 'mr' | 'hi';
  onClose: () => void;
  onVerificationComplete: (taskId: string, result: SegregationVerificationResult) => void;
}

export const SegregationModal: React.FC<SegregationModalProps> = ({
  task,
  language,
  onClose,
  onVerificationComplete
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(task?.image_url || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [result, setResult] = useState<SegregationVerificationResult | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLiveCaptured, setIsLiveCaptured] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly on unmount or when modal closes
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraActive(false);
  };

  useEffect(() => {
    // Open camera immediately on mount for live mobile inspection
    startLiveCamera();
    return () => {
      stopLiveCamera();
    };
  }, []);

  const startLiveCamera = async () => {
    setCameraError(null);
    setResult(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device. Please use the Upload button.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      setIsLiveCameraActive(true);

      // Short delay to allow video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Video play error:', e));
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera stream access warning:', err);
      setCameraError(err.message || 'Unable to access camera directly. Please check browser permissions or upload an image.');
      setIsLiveCameraActive(false);
    }
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      canvas.toBlob(blob => {
        if (blob) {
          const timestamp = Date.now();
          const file = new File([blob], `live_camera_capture_${timestamp}.jpg`, { type: 'image/jpeg' });
          setSelectedFile(file);
          setSelectedImage(dataUrl);
          setIsLiveCaptured(true);
          setResult(null);

          // Automatically trigger AI verification upon frame capture
          runAIAnalysisOnFile(file);
        }
      }, 'image/jpeg', 0.92);
    }

    stopLiveCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setIsLiveCaptured(false);
      setResult(null);
      stopLiveCamera();
      runAIAnalysisOnFile(file);
    }
  };

  const runAIAnalysisOnFile = async (fileToUpload: File | Blob) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      setAnalysisStep('Uploading frame & preprocessing image matrix...');
      await new Promise(r => setTimeout(r, 350));

      setAnalysisStep('Querying Google Gemini 3.6 Flash Vision AI...');
      await new Promise(r => setTimeout(r, 450));

      setAnalysisStep('Computing Wet/Dry/Hazardous segregation purity scores...');
      await new Promise(r => setTimeout(r, 350));

      const res = await workerApi.verifySegregation(fileToUpload, task?.id, task?.category);
      setResult(res);
    } catch (err) {
      console.error('AI verification failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualRunAIAnalysis = () => {
    if (selectedFile) {
      runAIAnalysisOnFile(selectedFile);
    } else if (selectedImage) {
      fetch(selectedImage)
        .then(r => r.blob())
        .then(blob => runAIAnalysisOnFile(blob))
        .catch(() => {
          const dummyFile = new File(['dummy'], 'sample.jpg', { type: 'image/jpeg' });
          runAIAnalysisOnFile(dummyFile);
        });
    }
  };

  const handleConfirmCompletion = () => {
    if (task && result) {
      onVerificationComplete(task.id, result);
    }
    stopLiveCamera();
    onClose();
  };

  const handleModalClose = () => {
    stopLiveCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scaleUp">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {language === 'mr' ? 'AI कचरा वर्गीकरण तपासणी (थेट कॅमेरा)' : 'Live AI Segregation Camera Scanner'}
              </h3>
              <p className="text-xs text-slate-400">
                {task ? `${task.ticket_number} • ${task.title}` : 'Nagpur SmartSanitation Vision AI'}
              </p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Quick Action Camera & Upload Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startLiveCamera}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all ${
                  isLiveCameraActive
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110'
                }`}
              >
                <span>📷</span>
                <span>
                  {isLiveCameraActive
                    ? (language === 'mr' ? 'कॅमेरा सुरू आहे...' : 'Camera Live...')
                    : (language === 'mr' ? 'थेट कॅमेरा सुरू करा' : 'Open Live Camera')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <span>📁</span>
                <span>{language === 'mr' ? 'फोटो निवडा / अपलोड' : 'Upload / Select Photo'}</span>
              </button>
            </div>

            {isLiveCaptured && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span>✓</span>
                <span>Live Camera Photo Ready</span>
              </span>
            )}
          </div>

          {/* Camera Error Banner */}
          {cameraError && (
            <div className="bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-2">
              <span>⚠️ {cameraError}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-rose-500 text-slate-950 font-bold rounded-lg text-[11px]"
              >
                Use File Upload
              </button>
            </div>
          )}

          {/* Main Viewfinder / Live Video Stream / Captured Image */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video max-h-80 flex items-center justify-center group shadow-2xl">
            {isLiveCameraActive ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Scanner Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div className="w-full h-full border-2 border-amber-400/50 rounded-2xl relative">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />
                    <span className="absolute top-2 left-3 text-[10px] font-mono text-amber-300 bg-slate-950/70 px-2 py-0.5 rounded">
                      LIVE NMC VISION CAMERA FEED
                    </span>
                  </div>
                </div>

                {/* Live Camera Bottom Action Controls */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20">
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 shadow-xl"
                  >
                    ✕ Cancel
                  </button>

                  <button
                    type="button"
                    onClick={capturePhotoFromCamera}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ring-4 ring-amber-400/30"
                  >
                    <span className="text-lg">📸</span>
                    <span>{language === 'mr' ? 'फोटो काढा व तपासा' : 'Click & Run AI Verification'}</span>
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              <img
                src={selectedImage}
                alt="Waste for AI Verification"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                onClick={startLiveCamera}
                className="text-center p-6 text-slate-400 cursor-pointer hover:bg-slate-900/50 transition-colors w-full h-full flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-3xl mb-2">
                  📷
                </div>
                <span className="text-sm font-bold text-slate-200 block">Click to Open Camera & Snap Waste Bin</span>
                <span className="text-xs text-slate-500 mt-1">Live mobile camera feed for NMC Swachh Bharat purity audit</span>
              </div>
            )}

            {/* Hidden Canvas for Frame Capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* AI Scanline Overlay Animation */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 z-30">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
                <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-4 text-center shadow-2xl max-w-sm">
                  <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="font-bold text-amber-400 text-sm">NMC AI Engine Scanning...</p>
                  <p className="text-xs text-slate-300 mt-1 font-mono">{analysisStep}</p>
                </div>
              </div>
            )}

            {/* Retake / Upload Overlay Button when Photo is Frozen */}
            {!isLiveCameraActive && selectedImage && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={startLiveCamera}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span>📸</span>
                  <span>{language === 'mr' ? 'पुन्हा फोटो काढा' : 'Retake via Camera'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 backdrop-blur-md shadow-lg flex items-center gap-1.5"
                >
                  <span>📁</span>
                  <span>Upload</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Action to trigger AI Scan manually if not auto-triggered */}
          {!result && !isLiveCameraActive && selectedImage && !isAnalyzing && (
            <button
              onClick={handleManualRunAIAnalysis}
              disabled={isAnalyzing || !selectedImage}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] hover:bg-right transition-all text-slate-950 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <span>⚡</span>
              <span>
                {language === 'mr' ? 'AI वर्गीकरण तपासणी सुरू करा' : 'Run AI Segregation Verification on Captured Photo'}
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
                        {result.verdict === 'PASSED' ? '✓ Segregation Verified' : result.verdict === 'WARNING' ? '⚠️ Minor Contamination' : (result.overall_score === 0 ? '✕ Non-Waste / Failed' : '✕ Unsegregated')}
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

              {/* Bonus Tier Matrix Scaled to Segregation Score */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>💰 {language === 'mr' ? 'वर्गीकरण आधारित बक्षीस रचना:' : 'NMC Purity-Scaled Incentive Tier:'}</span>
                  <span className="text-lime-400 font-extrabold">+₹{result.incentive_earned_inr} Awarded</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-center text-[10px] pt-1">
                  <div className={`p-1.5 rounded-lg border ${result.overall_score >= 95 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold ring-1 ring-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span className="block font-medium">95%+</span>
                    <span className="font-bold text-lime-400">₹50</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${result.overall_score >= 90 && result.overall_score < 95 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold ring-1 ring-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span className="block font-medium">90-94%</span>
                    <span className="font-bold text-lime-400">₹40</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${result.overall_score >= 80 && result.overall_score < 90 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold ring-1 ring-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span className="block font-medium">80-89%</span>
                    <span className="font-bold text-lime-400">₹30</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${result.overall_score >= 70 && result.overall_score < 80 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span className="block font-medium">70-79%</span>
                    <span className="font-bold text-lime-400">₹20</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${result.overall_score >= 60 && result.overall_score < 70 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span className="block font-medium">60-69%</span>
                    <span className="font-bold text-lime-400">₹10</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border ${result.overall_score < 60 ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold ring-1 ring-rose-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span className="block font-medium">&lt;60%</span>
                    <span className="font-bold text-slate-400">₹0</span>
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
                        ✓ {item}
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
                  onClick={startLiveCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  📸 Retake Photo
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
export default SegregationModal;
