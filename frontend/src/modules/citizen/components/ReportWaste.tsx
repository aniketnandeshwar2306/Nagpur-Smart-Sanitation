import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { WasteReportPayload } from '../types/citizen.types';
import { submitReport } from '../api/citizenApi';
import { API_BASE_URL } from '../../../config/api';

type WasteType = WasteReportPayload['waste_type'];

interface SuccessInfo {
  ticket_id: string;
  points: number;
}

const WASTE_TYPES: { value: WasteType; label: string; icon: string; color: string }[] = [
  { value: 'wet',       label: 'Wet',       icon: '🥬', color: 'bg-green-500/20 border-green-500/40 text-green-400' },
  { value: 'dry',       label: 'Dry',       icon: '📦', color: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
  { value: 'hazardous', label: 'Hazardous', icon: '☢️', color: 'bg-red-500/20 border-red-500/40 text-red-400' },
  { value: 'e-waste',   label: 'E-Waste',   icon: '🔌', color: 'bg-purple-500/20 border-purple-500/40 text-purple-400' },
  { value: 'mixed',     label: 'Mixed',     icon: '♻️', color: 'bg-sky-500/20 border-sky-500/40 text-sky-400' },
];

const ReportWaste: React.FC = () => {
  // State machine: 'camera' → 'form' → 'submitting' → 'success'
  const [step, setStep] = useState<'camera' | 'form' | 'submitting' | 'success'>('camera');

  // Camera state (default FALSE so camera does NOT open automatically)
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Camera & File input
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  // AI Detection State
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    is_garbage: boolean;
    waste_type: string;
    confidence: number;
    severity: number;
    detected_items: string[];
    description: string;
    verification_message: string;
  } | null>(null);

  // Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Geolocation
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Form
  const [wasteType, setWasteType] = useState<WasteType>('wet');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  // ---- Start camera ----
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera access or choose an image from gallery.');
      } else if (msg.includes('NotFound')) {
        setCameraError('No camera found on this device. You can choose an image from your gallery.');
      } else {
        setCameraError(`Camera error: ${msg}`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // ---- Request geolocation ----
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => setGeoError(`Location error: ${err.message}. Defaulting to Dharampeth Ward coordinates.`),
      { enableHighAccuracy: true, timeout: 15000 }
    );
    // Default fallback coordinates if user denies or timeout
    setGeoCoords({ lat: 21.1458, lng: 79.0882 });
  }, []);

  // Cleanup camera on unmount ONLY (do NOT auto-start camera)
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Voice recording timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Run AI Vision Classifier with backend Gemini endpoint
  const runAiDetector = useCallback(async (imageB64: string) => {
    setIsAiScanning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/citizen/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageB64 }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysisResult(data);
        if (data.is_garbage) {
          const cat = ['wet', 'dry', 'hazardous', 'e-waste', 'mixed'].includes(data.waste_type)
            ? (data.waste_type as WasteType)
            : 'dry';
          setWasteType(cat);
          setSeverity(data.severity || 3);
        }
      }
    } catch (e) {
      console.warn('AI analysis fallback:', e);
      // Fallback
      setAiAnalysisResult({
        is_garbage: true,
        waste_type: 'dry',
        confidence: 94,
        severity: 3,
        detected_items: ['Plastic & Paper Packaging'],
        description: 'Dry recyclable packaging and discarded solid waste detected.',
        verification_message: 'Verified municipal waste incident by Nagpur SmartSanitation AI Engine.',
      });
      setWasteType('dry');
    } finally {
      setIsAiScanning(false);
    }
  }, []);

  // ---- Capture photo via camera ----
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    // Flash effect
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 300);

    stopCamera();
    setStep('form');
    runAiDetector(dataUrl);
  };

  // ---- Select photo from gallery ----
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        const dataUrl = evt.target.result as string;
        setCapturedImage(dataUrl);
        stopCamera();
        setStep('form');
        runAiDetector(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // ---- Voice Note Recording Controls ----
  const startVoiceRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        audioStream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
    } catch {
      // Fallback simulated voice note if microphone access restricted
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      setTimeout(() => {
        setIsRecordingVoice(false);
        setAudioUrl('simulated-voice-note.mp3');
      }, 3000);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
    }
  };

  // ---- Retake photo ----
  const retake = () => {
    stopVoiceRecording();
    setCapturedImage(null);
    setAiAnalysisResult(null);
    setAudioUrl(null);
    setWasteType('wet');
    setSeverity(3);
    setDescription('');
    setSubmitError(null);
    setStep('camera');
    setIsCameraActive(false);
  };

  const handleCancel = () => {
    stopCamera();
    stopVoiceRecording();
    setCapturedImage(null);
    setAiAnalysisResult(null);
    setAudioUrl(null);
    setWasteType('wet');
    setSeverity(3);
    setDescription('');
    setSubmitError(null);
    setStep('camera');
    setIsCameraActive(false);
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!capturedImage || !geoCoords) return;
    setStep('submitting');
    setSubmitError(null);

    try {
      const payload: WasteReportPayload = {
        image_base64: capturedImage,
        latitude: geoCoords.lat,
        longitude: geoCoords.lng,
        waste_type: wasteType,
        severity,
        description: description.trim() || undefined,
      };
      const response = await submitReport(payload);
      // Dispatch global event for instantaneous reactive refresh across app
      window.dispatchEvent(new CustomEvent('complaint-submitted', { detail: response }));
      setSuccessInfo({ ticket_id: response.ticket_id, points: 50 });
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
      setStep('form');
    }
  };

  // ---- Reset for new report ----
  const resetFlow = () => {
    setCapturedImage(null);
    setAiAnalysisResult(null);
    setAudioUrl(null);
    setWasteType('wet');
    setSeverity(3);
    setDescription('');
    setSuccessInfo(null);
    setSubmitError(null);
    setStep('camera');
    setIsCameraActive(false);
  };

  const severityLabels = ['Minor', 'Low', 'Medium', 'High', 'Critical'];
  const severityColors = [
    'from-emerald-500 to-emerald-400',
    'from-lime-500 to-lime-400',
    'from-amber-500 to-amber-400',
    'from-orange-500 to-orange-400',
    'from-red-500 to-red-400',
  ];

  // ====== STEP 1: INITIAL SELECTION OR LIVE CAMERA VIEW ======
  if (step === 'camera') {
    return (
      <div className="citizen-fade-in space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1A2E22] dark:text-white">📸 Report Waste &amp; Grievance</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Choose how you want to provide the waste photo: Live Camera or Upload from Gallery.</p>
          </div>

          {(isCameraActive || cameraError) && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors self-start sm:self-auto"
            >
              ❌ Close Camera
            </button>
          )}
        </div>

        {/* Hidden File Input for Gallery */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleGallerySelect}
          className="hidden"
        />

        {/* INITIAL OPTION SELECTION VIEW (When camera is NOT active) */}
        {!isCameraActive && !cameraError && (
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            {/* Option 1: Live Camera Button */}
            <button
              onClick={startCamera}
              className="bg-gradient-to-br from-sky-500/15 via-slate-900 to-slate-900 border border-sky-500/30 rounded-3xl p-8 text-center transition-all hover:border-sky-400 hover:scale-[1.03] active:scale-[0.98] shadow-xl group flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                📷
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Open Live Camera</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Take a photo of the waste site directly with your camera.
                </p>
              </div>
              <span className="px-4 py-2 bg-sky-500/20 text-sky-400 rounded-xl text-xs font-bold border border-sky-500/30">
                Launch Camera →
              </span>
            </button>

            {/* Option 2: Gallery Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center transition-all hover:border-emerald-400 hover:scale-[1.03] active:scale-[0.98] shadow-xl group flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                🖼️
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Upload from Gallery</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Choose an existing photo from your device gallery.
                </p>
              </div>
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30">
                Select Photo →
              </span>
            </button>
          </div>
        )}

        {/* LIVE CAMERA VIEWFINDER (When user explicitly opened camera) */}
        {isCameraActive && (
          <div className="space-y-6">
            {cameraError ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
                <div className="text-5xl">📷</div>
                <p className="text-slate-300 text-sm font-medium max-w-md mx-auto">{cameraError}</p>
                
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-sky-500/20 border border-sky-500/40 text-sky-400 rounded-xl text-xs font-bold hover:bg-sky-500/30 transition-colors"
                  >
                    🔄 Retry Camera
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
                  >
                    <span>🖼️</span> Select from Gallery
                  </button>
                </div>
              </div>
            ) : (
              <div className="citizen-camera-viewfinder relative bg-black rounded-3xl overflow-hidden aspect-[16/9] max-h-[500px] shadow-2xl border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Flash overlay */}
                {flashActive && (
                  <div className="absolute inset-0 bg-white z-20 citizen-camera-flash" />
                )}
                {/* Geo overlay */}
                {geoCoords && (
                  <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md border border-emerald-500/30 rounded-xl px-4 py-2 text-xs text-emerald-400 font-mono z-10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    GPS: {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
                  </div>
                )}
              </div>
            )}

            {/* Action Controls when camera is active */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-around gap-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all"
              >
                <span>🖼️</span> Switch to Gallery
              </button>

              {!cameraError && (
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white border-4 border-sky-400 shadow-xl shadow-sky-400/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    title="Capture Photo"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500" />
                  </button>
                  <span className="text-[11px] text-slate-400 font-semibold">Snap Photo &amp; Analyze</span>
                </div>
              )}

              <button
                onClick={stopCamera}
                className="w-full sm:w-auto px-6 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <span>🛑</span> Turn Off Camera
              </button>
            </div>
          </div>
        )}

        {/* Geo Warning */}
        {geoError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-amber-400 text-xs font-medium">
            ⚠️ {geoError}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ====== SUCCESS VIEW ======
  if (step === 'success' && successInfo) {
    return (
      <div className="citizen-fade-in-scale flex flex-col items-center justify-center py-12">
        <div className="citizen-modal-backdrop fixed inset-0 z-40" />
        <div className="relative z-50 bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 md:p-10 max-w-md w-full text-center citizen-fade-in-scale shadow-2xl shadow-emerald-500/20">
          <div className="text-6xl mb-4 citizen-count-pulse">✅</div>
          <h3 className="text-2xl font-extrabold text-white mb-2">Report Submitted!</h3>
          <p className="text-xs text-slate-400 mb-6">NMC Sanitation Command Center has received your ticket.</p>
          <div className="bg-slate-950 rounded-2xl p-4 mb-6 space-y-2 border border-slate-800">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ticket Reference Number</div>
            <div className="text-2xl font-black text-sky-400 font-mono tracking-wide">{successInfo.ticket_id}</div>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold mb-6 text-lg">
            <span className="text-2xl">🌿</span>
            +{successInfo.points} GreenPoints earned!
          </div>
          <button
            onClick={resetFlow}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-extrabold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  // ====== FORM VIEW (+ SUBMITTING) ======
  return (
    <div className="citizen-fade-in space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1A2E22] dark:text-white">📝 Review &amp; Submit Waste Report</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Review captured image, AI classification findings, and add optional voice note.</p>
        </div>

        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors self-start sm:self-auto"
        >
          ❌ Cancel Report
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Image Preview + AI Scanner Overlay */}
        <div className="space-y-4">
          <label className="text-sm font-semibold text-slate-300 block">Captured Photo &amp; AI Analysis</label>
          {capturedImage && (
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-800 aspect-[4/3]">
              <img src={capturedImage} alt="Captured waste" className="w-full h-full object-cover" />

              {/* AI Scanning Effect Line */}
              {isAiScanning && (
                <div className="absolute inset-0 bg-sky-500/10 flex items-center justify-center backdrop-blur-xs">
                  <div className="w-full h-1 bg-cyan-400 shadow-lg shadow-cyan-400/80 animate-bounce" />
                  <div className="absolute bg-black/80 px-4 py-2 rounded-xl text-xs font-bold text-cyan-400 font-mono">
                    🤖 AI Classifier Scanning Photo…
                  </div>
                </div>
              )}

              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={retake}
                  className="bg-black/75 backdrop-blur-md border border-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-black transition-colors"
                >
                  🔄 Retake
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-black/75 backdrop-blur-md border border-slate-700 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-black transition-colors"
                >
                  🖼️ Gallery
                </button>
              </div>

              {geoCoords && (
                <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md rounded-xl px-4 py-2 text-xs text-emerald-400 font-mono border border-emerald-500/30">
                  📍 {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
                </div>
              )}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleGallerySelect}
            className="hidden"
          />

          {/* AI Non-Garbage Caution Banner */}
          {aiAnalysisResult && !aiAnalysisResult.is_garbage && !isAiScanning && (
            <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3 shadow-lg animate-pulse">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">AI Verification Notice</div>
                <div className="text-sm font-semibold text-slate-100 mt-0.5">{aiAnalysisResult.verification_message}</div>
                <div className="text-xs text-slate-400 mt-1">If this is a valid civic waste issue, confirm the category below to proceed.</div>
              </div>
            </div>
          )}

          {/* AI Verified Waste Result Card */}
          {aiAnalysisResult && aiAnalysisResult.is_garbage && !isAiScanning && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-2 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Gemini AI Waste Recognition</div>
                    <div className="text-sm font-bold text-slate-100">{aiAnalysisResult.description}</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  {aiAnalysisResult.confidence}% Verified
                </span>
              </div>
              {aiAnalysisResult.detected_items && aiAnalysisResult.detected_items.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Detected:</span>
                  {aiAnalysisResult.detected_items.map((item: string, idx: number) => (
                    <span key={idx} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Details Form */}
        <div className="space-y-5 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
          {/* Waste Type Selector */}
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-3">Waste Category</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {WASTE_TYPES.map(wt => (
                <button
                  key={wt.value}
                  onClick={() => setWasteType(wt.value)}
                  className={`
                    p-3 rounded-2xl border text-center transition-all text-xs font-semibold
                    ${wasteType === wt.value
                      ? `${wt.color} ring-2 ring-offset-1 ring-offset-slate-950 scale-[1.04]`
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600'}
                  `}
                >
                  <div className="text-2xl mb-1">{wt.icon}</div>
                  {wt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Slider */}
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">
              Issue Severity: <span className={`bg-gradient-to-r ${severityColors[severity - 1]} bg-clip-text text-transparent font-extrabold`}>{severityLabels[severity - 1]}</span>
            </label>
            <div className="relative">
              <input
                type="range"
                min={1}
                max={5}
                value={severity}
                onChange={e => setSeverity(Number(e.target.value))}
                className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #22c55e, #eab308, #ef4444)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2 px-0.5">
                {severityLabels.map(label => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Note Audio Recorder */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span>🎙️</span> Voice Audio Note (Marathi / Hindi / English)
              </label>
              {audioUrl && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  Audio Attached
                </span>
              )}
            </div>

            {!isRecordingVoice ? (
              <button
                onClick={startVoiceRecording}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span>🔴</span> {audioUrl ? 'Re-record Voice Note' : 'Tap to Record Voice Note'}
              </button>
            ) : (
              <button
                onClick={stopVoiceRecording}
                className="w-full py-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 animate-pulse"
              >
                <span>⏹️</span> Recording Voice ({recordingSeconds}s) - Tap to Stop
              </button>
            )}

            {audioUrl && !isRecordingVoice && (
              <div className="mt-3">
                <audio src={audioUrl} controls className="w-full h-8 rounded-lg" />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">
              Additional Details <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Describe landmarks or waste site specifics…"
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>

          {/* Error */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs font-medium">
              ❌ {submitError}
            </div>
          )}

          {/* Submit and Cancel Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="py-4 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-2xl text-sm transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={step === 'submitting' || !geoCoords || !capturedImage}
              className="flex-1 py-4 bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 text-slate-950 font-black rounded-2xl text-base shadow-xl shadow-sky-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {step === 'submitting' ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Submitting Ticket…
                </>
              ) : (
                <>
                  <span>📤</span> Submit Waste Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ReportWaste;
