import React, { useState, useRef, useEffect } from 'react';
import type { DailyTask, WasteCategory, TaskPriority } from '../types';
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
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<WasteCategory>('Wet Organic');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [address, setAddress] = useState<string>(`${zoneAssigned.split(' - ')[1] || 'Dharampeth'}, Nagpur`);
  const [landmark, setLandmark] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<number>(wardNumber || 2);
  const [selectedZone, setSelectedZone] = useState<string>(zoneAssigned || 'Zone 2 - Dharampeth');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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
      console.error('Camera stream error:', err);
      setCameraError(err.message || 'Could not access device camera. Please check permissions or upload a photo.');
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
          const file = new File([blob], `spot_capture_${timestamp}.jpg`, { type: 'image/jpeg' });
          setImageFile(file);
          setCapturedImage(dataUrl);
          if (!title || title.includes('Waste Spot')) {
            setTitle(`${category} Waste Spot at ${address.split(',')[0]}`);
          }
        }
      }, 'image/jpeg', 0.92);
    }

    stopLiveCamera();
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setCapturedImage(URL.createObjectURL(file));
      if (!title || title.includes('Waste Spot')) {
        setTitle(`${category} Waste Spot at ${address.split(',')[0]}`);
      }
      stopLiveCamera();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert(language === 'mr' ? 'कृपया कामाचे नाव टाका' : 'Please provide a task title');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask = await workerApi.reportWasteTask({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        latitude: workerGps.latitude,
        longitude: workerGps.longitude,
        address: address.trim() || 'Nagpur Central Zone',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md">
              📷
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {language === 'mr' ? 'नवीन कचरा स्पॉट नोंदवा (थेट कॅमेरा)' : 'Log New Waste Spot (Live Camera)'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'mr' ? 'कॅमेऱ्याने थेट फोटो काढून कामाची नोंद करा' : 'Capture live photo & add task to daily route'}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Camera Controls & Photo Capture Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                {language === 'mr' ? 'थेट कॅमेरा फोटो' : 'Live Camera Photo'}
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
              <div className="mb-2 p-2 bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[11px] rounded-lg">
                ⚠️ {cameraError}
              </div>
            )}

            {/* Viewfinder Area */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video max-h-56 flex flex-col items-center justify-center group shadow-xl">
              {isLiveCameraActive ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Corner Guides */}
                  <div className="absolute inset-0 pointer-events-none p-6 flex items-center justify-center">
                    <div className="w-full h-full border border-amber-400/40 rounded-xl relative">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                    </div>
                  </div>

                  {/* Shutter Controls */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-20">
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="px-3 py-1.5 bg-slate-900/90 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700"
                    >
                      ✕ Cancel
                    </button>
                    <button
                      type="button"
                      onClick={capturePhotoFromCamera}
                      className="px-5 py-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <span>📸</span>
                      <span>{language === 'mr' ? 'फोटो काढा' : 'Click / Snap Photo'}</span>
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
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-lg"
                    >
                      📸 Retake via Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-900/90 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                    >
                      📁 Upload Photo
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
                      {language === 'mr' ? 'कॅमेरा सुरू करण्यासाठी येथे दाबा' : 'Click to Open Camera & Snap Photo'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Direct live viewfinder on mobile & web
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
              onChange={handleImageCapture}
              className="hidden"
            />
          </div>

          {/* Live GPS Location Bar */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  {language === 'mr' ? 'थेट GPS स्थान' : 'Live GPS Geolocation'}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {workerGps.latitude.toFixed(4)}° N, {workerGps.longitude.toFixed(4)}° E
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              • Auto-Captured
            </span>
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
                <option value="CRITICAL">🚨 Critical (Urgent Spill)</option>
                <option value="HIGH">⚡ High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                {language === 'mr' ? 'प्रभाग व झोन' : 'Ward & Zone'}
              </label>
              <select
                value={selectedZone}
                onChange={e => {
                  setSelectedZone(e.target.value);
                  const wardMap: { [k: string]: number } = {
                    'Zone 1 - Laxmi Nagar': 1,
                    'Zone 2 - Dharampeth': 2,
                    'Zone 3 - Hanuman Nagar': 3,
                    'Zone 4 - Dhantoli': 4,
                    'Zone 6 - Gandhibagh': 6,
                    'Zone 10 - Mangalwari': 10
                  };
                  setSelectedWard(wardMap[e.target.value] || 2);
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Zone 2 - Dharampeth">Zone 2 - Dharampeth (Ward 2)</option>
                <option value="Zone 4 - Dhantoli">Zone 4 - Dhantoli (Ward 4)</option>
                <option value="Zone 1 - Laxmi Nagar">Zone 1 - Laxmi Nagar (Ward 1)</option>
                <option value="Zone 3 - Hanuman Nagar">Zone 3 - Hanuman Nagar (Ward 3)</option>
                <option value="Zone 6 - Gandhibagh">Zone 6 - Gandhibagh (Ward 6)</option>
                <option value="Zone 10 - Mangalwari">Zone 10 - Mangalwari (Ward 10)</option>
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

          {/* Action Row */}
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
      </div>
    </div>
  );
};
export default CreateTaskModal;
