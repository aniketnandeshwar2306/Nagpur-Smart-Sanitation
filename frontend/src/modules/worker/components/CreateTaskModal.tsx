import React, { useState, useRef, useEffect } from 'react';
import type { DailyTask, WasteCategory, TaskPriority, AISpotDetectionResult } from '../types';
import { workerApi } from '../api';

interface CreateTaskModalProps {
  language: 'en' | 'mr' | 'hi';
  workerGps: { latitude: number; longitude: number };
  zoneAssigned: string;
  wardNumber: number;
  onClose: () => void;
  onTaskCreated: (newTask: DailyTask) => void;
}

const CATEGORIES: { label: WasteCategory; label_mr: string; icon: string }[] = [
  { label: 'Wet Organic', label_mr: 'ओला सेंद्रिय कचरा', icon: '🥬' },
  { label: 'Dry Recyclable', label_mr: 'सुका पुनर्वापरयोग्य कचरा', icon: '📦' },
  { label: 'Mixed Waste', label_mr: 'मिश्रित कचरा', icon: '🗑️' },
  { label: 'Sanitary / Hazardous', label_mr: 'धोकादायक / वैद्यकीय कचरा', icon: '⚠️' },
  { label: 'E-Waste', label_mr: 'ई-कचरा (इलेक्ट्रॉनिक्स)', icon: '🔌' },
  { label: 'Construction Scrap', label_mr: 'बांधकाम डेब्रिज व राडारोडा', icon: '🧱' }
];

const NAGPUR_ZONES_LIST = [
  { ward_id: 1, name: 'Zone 1 - Laxmi Nagar', label: 'Zone 1 - Laxmi Nagar (Bajaj Nagar, Shankar Nagar, Khamla)' },
  { ward_id: 2, name: 'Zone 2 - Dharampeth', label: 'Zone 2 - Dharampeth (Futala, Gokulpeth, Ram Nagar, Civil Lines)' },
  { ward_id: 3, name: 'Zone 3 - Hanuman Nagar', label: 'Zone 3 - Hanuman Nagar (Reshimbagh, Medical Square, Sakkardara)' },
  { ward_id: 4, name: 'Zone 4 - Dhantoli', label: 'Zone 4 - Dhantoli (Congress Nagar, Sitabuldi, Ajni, Rahate)' },
  { ward_id: 5, name: 'Zone 5 - Nehru Nagar', label: 'Zone 5 - Nehru Nagar (Nandanvan, Tajbagh, Kharbi, Dighori)' },
  { ward_id: 6, name: 'Zone 6 - Gandhibagh', label: 'Zone 6 - Gandhibagh (Itwari, Mahal, Badkas Chowk, Hansapuri)' },
  { ward_id: 7, name: 'Zone 7 - Satranjipura', label: 'Zone 7 - Satranjipura (Shanti Nagar, Mehdi Bagh, Itwari Bazar)' },
  { ward_id: 8, name: 'Zone 8 - Lakadganj', label: 'Zone 8 - Lakadganj (Garoba Maidan, Bagadganj, Pardi, Wardhaman)' },
  { ward_id: 9, name: 'Zone 9 - Ashi Nagar', label: 'Zone 9 - Ashi Nagar (Pachpaoli, Indora, Kamal Chowk, Teka Naka)' },
  { ward_id: 10, name: 'Zone 10 - Mangalwari', label: 'Zone 10 - Mangalwari (Sadar, Chaoni, Raj Bhavan, Mankapur)' }
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  language,
  workerGps,
  zoneAssigned,
  wardNumber,
  onClose,
  onTaskCreated
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiDetectionResult, setAiDetectionResult] = useState<AISpotDetectionResult | null>(null);
  const [isManualEditOpen, setIsManualEditOpen] = useState<boolean>(false);
  const [hasOptedForManualWithoutPhoto, setHasOptedForManualWithoutPhoto] = useState<boolean>(false);

  // Form Field States
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<WasteCategory>('Wet Organic');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [address, setAddress] = useState<string>(`${zoneAssigned.split(' - ')[1] || 'Dharampeth'}, Nagpur`);
  const [landmark, setLandmark] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<number>(wardNumber || 2);
  const [selectedZone, setSelectedZone] = useState<string>(zoneAssigned || 'Zone 2 - Dharampeth');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Camera States
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    // Open camera by default on mount for quick spot logging
    startLiveCamera();
    return () => {
      stopLiveCamera();
    };
  }, []);

  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device. Please use upload button.');
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

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Video play error:', e));
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Could not access device camera. Please upload a photo or enter details manually.');
      setIsLiveCameraActive(false);
    }
  };

  // Run AI Spot Analysis as soon as photo is captured / uploaded
  const triggerAiSpotAnalysis = async (file: File) => {
    setIsAiAnalyzing(true);
    try {
      const result = await workerApi.analyzeWasteSpot(file, workerGps.latitude, workerGps.longitude);
      setAiDetectionResult(result);

      // Auto-populate all fields from AI output
      if (result.category) {
        setCategory(result.category as WasteCategory);
      }
      if (result.priority) {
        setPriority(result.priority as TaskPriority);
      }
      if (result.suggested_title) {
        setTitle(result.suggested_title);
      }
      if (result.description) {
        setDescription(result.description);
      }
      if (result.ward_number) {
        setSelectedWard(result.ward_number);
      }
      if (result.zone_name) {
        setSelectedZone(result.zone_name);
      }
      if (result.address) {
        setAddress(result.address);
      }
      if (result.landmark) {
        setLandmark(result.landmark);
      }
    } catch (err) {
      console.error('AI spot detection failed:', err);
    } finally {
      setIsAiAnalyzing(false);
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
          const file = new File([blob], `spot_snap_${timestamp}.jpg`, { type: 'image/jpeg' });
          setImageFile(file);
          setCapturedImage(dataUrl);
          setHasOptedForManualWithoutPhoto(false);
          triggerAiSpotAnalysis(file);
        }
      }, 'image/jpeg', 0.92);
    }

    stopLiveCamera();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setCapturedImage(URL.createObjectURL(file));
      setHasOptedForManualWithoutPhoto(false);
      stopLiveCamera();
      triggerAiSpotAnalysis(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle = title.trim() || `${category} Waste Spot at ${address.split(',')[0]}`;

    setIsSubmitting(true);
    try {
      const newTask = await workerApi.reportWasteTask({
        title: finalTitle,
        description: description.trim() || undefined,
        category,
        priority,
        latitude: workerGps.latitude,
        longitude: workerGps.longitude,
        address: address.trim() || `${selectedZone.split(' - ')[1]}, Nagpur`,
        landmark: landmark.trim() || undefined,
        ward_number: selectedWard,
        zone_name: selectedZone,
        citizen_name: 'Field Worker Spot Report',
        imageFile
      });

      stopLiveCamera();
      onTaskCreated(newTask);
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to log task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    stopLiveCamera();
    onClose();
  };

  const handleZoneChange = (zoneName: string) => {
    setSelectedZone(zoneName);
    const found = NAGPUR_ZONES_LIST.find(z => z.name === zoneName);
    if (found) {
      setSelectedWard(found.ward_id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md">
              📷
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {language === 'mr' ? 'नवीन कचरा स्पॉट नोंदवा (AI स्वयं-शोध)' : 'Log Waste Spot (AI Auto-Detection)'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'mr' ? 'फोटो काढा • AI कचरा प्रकार, प्राधान्य व प्रभाग आपोआप ओळखेल' : 'Snap photo • AI automatically detects waste type, priority & ward'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          {/* Camera Viewfinder & Snap Controls */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                {language === 'mr' ? 'कचरा स्पॉट कॅमेरा फोटो' : 'Live Spot Camera Viewfinder'}
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startLiveCamera}
                  className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold rounded-lg text-[10px] hover:bg-amber-500/30 flex items-center gap-1"
                >
                  <span>📷</span>
                  <span>{isLiveCameraActive ? 'Camera Live' : 'Open Camera'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg text-[10px] hover:bg-slate-700 flex items-center gap-1"
                >
                  <span>📁</span>
                  <span>Upload</span>
                </button>
              </div>
            </div>

            {cameraError && (
              <div className="mb-2 p-2 bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[11px] rounded-lg flex items-center justify-between">
                <span>⚠️ {cameraError}</span>
                <button
                  type="button"
                  onClick={() => setHasOptedForManualWithoutPhoto(true)}
                  className="underline text-amber-400 font-bold ml-2"
                >
                  Enter Manually
                </button>
              </div>
            )}

            {/* Viewfinder Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video max-h-60 flex flex-col items-center justify-center group shadow-xl">
              {isLiveCameraActive ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Corner Target Guides */}
                  <div className="absolute inset-0 pointer-events-none p-6 flex items-center justify-center">
                    <div className="w-full h-full border border-amber-400/40 rounded-xl relative">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                    </div>
                  </div>

                  {/* Shutter Action */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-20">
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="px-3 py-1.5 bg-slate-900/90 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700"
                    >
                      ✕ Close
                    </button>
                    <button
                      type="button"
                      onClick={capturePhotoFromCamera}
                      className="px-5 py-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <span>📸</span>
                      <span>{language === 'mr' ? 'फोटो काढा व AI ने शोधा' : 'Click Photo & AI Detect'}</span>
                    </button>
                  </div>
                </div>
              ) : capturedImage ? (
                <>
                  <img
                    src={capturedImage}
                    alt="Captured waste spot"
                    className="w-full h-full object-cover"
                  />

                  {/* AI Scanning Overlay */}
                  {isAiAnalyzing && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-30">
                      <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="font-bold text-amber-300 text-sm">🤖 NMC Vision AI Analyzing Spot...</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Detecting category, priority, materials & ward location</p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-lg"
                    >
                      📸 Retake Camera Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-900/90 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                    >
                      📁 Upload Different Photo
                    </button>
                  </div>
                </>
              ) : (
                <div
                  onClick={startLiveCamera}
                  className="text-center p-4 space-y-2 cursor-pointer w-full h-full flex flex-col items-center justify-center hover:bg-slate-900/60 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform">
                    📷
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 text-sm">
                      {language === 'mr' ? 'कॅमेरा सुरू करण्यासाठी येथे दाबा' : 'Click to Open Camera & Snap Waste Spot'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      AI will automatically detect waste category, priority, and ward
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden elements */}
            <canvas ref={canvasRef} className="hidden" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Skip Photo Button (Toggles Manual Mode if worker doesn't take photo) */}
          {!capturedImage && !isLiveCameraActive && !hasOptedForManualWithoutPhoto && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setHasOptedForManualWithoutPhoto(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
              >
                {language === 'mr' ? 'फोटो न घेता थेट हाताने माहिती भरा ➔' : 'Cannot take photo? Enter spot details manually ➔'}
              </button>
            </div>
          )}

          {/* AI AUTO-DETECTED RESULT CARD (Shown when photo is captured and analyzed) */}
          {capturedImage && aiDetectionResult && !isAiAnalyzing && (
            <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 space-y-3.5 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                    🤖 AI Auto-Detected Spot
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Conf: {(aiDetectionResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsManualEditOpen(!isManualEditOpen)}
                  className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>✏️</span>
                  <span>{isManualEditOpen ? 'Hide Edit' : 'Edit Details'}</span>
                </button>
              </div>

              {/* Summary Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Category</span>
                  <span className="font-bold text-amber-300 text-xs mt-0.5 block truncate">
                    {category}
                  </span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Priority Level</span>
                  <span className={`font-black text-xs mt-0.5 block ${priority === 'CRITICAL' ? 'text-rose-400' : priority === 'HIGH' ? 'text-amber-400' : 'text-sky-400'}`}>
                    {priority === 'CRITICAL' ? '🚨 CRITICAL' : priority === 'HIGH' ? '⚡ HIGH' : priority}
                  </span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Ward & Zone</span>
                  <span className="font-bold text-cyan-300 text-xs mt-0.5 block truncate">
                    Ward {selectedWard} ({selectedZone.split(' - ')[1] || selectedZone})
                  </span>
                </div>
              </div>

              {/* Title & Description Preview */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-slate-100 text-xs leading-snug">
                  📌 {title || `${category} Waste Spot at ${address.split(',')[0]}`}
                </h4>
                {description && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {description}
                  </p>
                )}
                {aiDetectionResult.detected_materials && aiDetectionResult.detected_materials.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {aiDetectionResult.detected_materials.map((m, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                        ✓ {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 1-Tap Submit from AI Detection */}
              {!isManualEditOpen && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit()}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? '⏳' : '✓'}</span>
                  <span>
                    {isSubmitting
                      ? (language === 'mr' ? 'नोंदणी सुरू आहे...' : 'Logging Spot...')
                      : (language === 'mr' ? 'AI माहितीसह थेट काम नोंदवा (१-टॅप)' : 'Confirm & Add to Route (1-Tap)')}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* MANUAL FORM FIELDS (Visible when no photo captured, or when worker toggles 'Edit Details') */}
          {(hasOptedForManualWithoutPhoto || isManualEditOpen || (!capturedImage && !isLiveCameraActive)) && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  {capturedImage ? '✏️ Edit Spot Details' : '📝 Manual Spot Information'}
                </span>
                {!capturedImage && (
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="text-[11px] text-amber-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>📷</span>
                    <span>Switch to Camera</span>
                  </button>
                )}
              </div>

              {/* Waste Category Selector */}
              <div>
                <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  {language === 'mr' ? 'कचरा प्रकार' : 'Waste Category'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => {
                        setCategory(cat.label);
                        if (!title || title.includes('Waste Spot')) {
                          setTitle(`${cat.label} Waste Spot at ${address.split(',')[0]}`);
                        }
                      }}
                      className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 ${
                        category === cat.label
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold block truncate">
                          {language === 'mr' ? cat.label_mr : cat.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority & Ward Selector Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                    {language === 'mr' ? 'प्राधान्य पातळी' : 'Priority Level'}
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="CRITICAL">🚨 Critical (Urgent Spill / Drain Choke)</option>
                    <option value="HIGH">⚡ High Priority (Overflowing Heap)</option>
                    <option value="MEDIUM">Medium Priority (Standard Bin)</option>
                    <option value="LOW">Low Priority (Minor Litter)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                    {language === 'mr' ? 'नागपूर प्रभाग व झोन' : 'Nagpur Zone & Ward'}
                  </label>
                  <select
                    value={selectedZone}
                    onChange={e => handleZoneChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {NAGPUR_ZONES_LIST.map(z => (
                      <option key={z.name} value={z.name}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                  {language === 'mr' ? 'कामाचे नाव / शीर्षक' : 'Task Title / Spot Headline'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Unsegregated Waste Heap near Gokulpeth Market"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Street Address & Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                    {language === 'mr' ? 'पत्ता / रस्ता' : 'Street Location'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. West High Court Road, Dharampeth"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                    {language === 'mr' ? 'लँडमार्क (ऐच्छिक)' : 'Nearby Landmark (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite Bata Showroom"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                  {language === 'mr' ? 'तपशीलवार नोंदी (ऐच्छिक)' : 'Observation Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Commercial cardboard & plastic accumulated behind food stalls. Needs green compactor truck pickup."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Live GPS Pin Bar */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📍</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {workerGps.latitude.toFixed(4)}° N, {workerGps.longitude.toFixed(4)}° E
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  • GPS Geotagged
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{isSubmitting ? '⏳' : '✓'}</span>
                  <span>
                    {isSubmitting
                      ? (language === 'mr' ? 'नोंदणी सुरू आहे...' : 'Logging Task...')
                      : (language === 'mr' ? 'स्पॉट नोंदवा व यादी अपडेट करा' : 'Submit & Add to Route')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default CreateTaskModal;
