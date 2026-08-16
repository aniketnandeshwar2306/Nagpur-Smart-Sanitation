import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { WasteReportPayload } from '../types/citizen.types';
import { submitReport } from '../api/citizenApi';

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

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState(false);

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
        setCameraError('Camera permission denied. Please allow camera access in your browser settings to report waste.');
      } else if (msg.includes('NotFound')) {
        setCameraError('No camera found on this device. A camera is required to report waste.');
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
  }, []);

  // ---- Request geolocation ----
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => setGeoError(`Location error: ${err.message}. Please enable location services.`),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ---- Capture photo ----
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);

    // Flash effect
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 300);

    stopCamera();
    setStep('form');
  };

  // ---- Retake ----
  const retake = () => {
    setCapturedImage(null);
    setStep('camera');
    startCamera();
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!capturedImage || !geoCoords) return;
    setStep('submitting');
    setSubmitError(null);

    try {
      const base64 = capturedImage.split(',')[1] || capturedImage;
      const payload: WasteReportPayload = {
        image_base64: base64,
        latitude: geoCoords.lat,
        longitude: geoCoords.lng,
        waste_type: wasteType,
        severity,
        description: description.trim() || undefined,
      };
      const response = await submitReport(payload);
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
    setWasteType('wet');
    setSeverity(3);
    setDescription('');
    setSuccessInfo(null);
    setSubmitError(null);
    setStep('camera');
    startCamera();
  };

  const severityLabels = ['Minor', 'Low', 'Medium', 'High', 'Critical'];
  const severityColors = [
    'from-emerald-500 to-emerald-400',
    'from-lime-500 to-lime-400',
    'from-amber-500 to-amber-400',
    'from-orange-500 to-orange-400',
    'from-red-500 to-red-400',
  ];

  // ====== CAMERA VIEW ======
  if (step === 'camera') {
    return (
      <div className="citizen-fade-in space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-white">📸 Live Camera Waste Capture</h2>
          <p className="text-slate-400 text-sm mt-1">Capture a photo of the garbage site. Live GPS coordinates will be attached automatically.</p>
        </div>

        {cameraError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center">
            <div className="text-5xl mb-4">📵</div>
            <p className="text-red-400 text-base font-semibold">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-5 px-6 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-colors"
            >
              Retry Camera Connection
            </button>
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

        {/* Geo Error */}
        {geoError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 text-sm font-medium">
            ⚠️ {geoError}
          </div>
        )}

        {/* Capture Button */}
        {!cameraError && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={capturePhoto}
              disabled={!geoCoords}
              className="w-20 h-20 rounded-full bg-white border-4 border-sky-400 shadow-xl shadow-sky-400/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title={!geoCoords ? 'Waiting for GPS location...' : 'Capture photo'}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500" />
            </button>
            <span className="text-xs text-slate-400 font-medium">Tap to Snap Photo</span>
          </div>
        )}
        {!geoCoords && !geoError && (
          <p className="text-center text-slate-500 text-xs animate-pulse">
            Acquiring GPS location…
          </p>
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
      <div>
        <h2 className="text-2xl font-bold text-white">📝 Review &amp; Submit Waste Report</h2>
        <p className="text-slate-400 text-sm mt-1">Review captured image, specify waste category, and set severity level.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Image Preview */}
        <div className="space-y-4">
          <label className="text-sm font-semibold text-slate-300 block">Captured Photo &amp; Geotag</label>
          {capturedImage && (
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-800 aspect-[4/3]">
              <img src={capturedImage} alt="Captured waste" className="w-full h-full object-cover" />
              <button
                onClick={retake}
                className="absolute top-4 right-4 bg-black/75 backdrop-blur-md border border-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black transition-colors"
              >
                🔄 Retake Photo
              </button>
              {geoCoords && (
                <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md rounded-xl px-4 py-2 text-xs text-emerald-400 font-mono border border-emerald-500/30">
                  📍 {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
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

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">
              Additional Details <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Describe nearby landmarks or specific waste overflow issues…"
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
            <div className="text-right text-xs text-slate-500 mt-1">{description.length}/500</div>
          </div>

          {/* Error */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs font-medium">
              ❌ {submitError}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={step === 'submitting' || !geoCoords || !capturedImage}
            className="w-full py-4 bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 text-slate-950 font-black rounded-2xl text-base shadow-xl shadow-sky-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ReportWaste;
