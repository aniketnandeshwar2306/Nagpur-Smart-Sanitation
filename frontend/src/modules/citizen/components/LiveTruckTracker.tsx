import React, { useEffect, useState, useRef } from 'react';

interface Waypoint {
  name: string;
  landmark: string;
  passed: boolean;
  eta: string;
}

const LiveTruckTracker: React.FC = () => {
  const [etaSeconds, setEtaSeconds] = useState(254);
  const [distanceMeters, setDistanceMeters] = useState(480);
  const [speedKmh, setSpeedKmh] = useState(18);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [truckStatus, setTruckStatus] = useState<'approaching' | 'nearby' | 'stopped'>('approaching');
  const [wasteCapacityPct] = useState(64);
  const currentStreet = 'West High Court Road (Near Gokulpeth Market)';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animProgressRef = useRef(0.25);
  const sweepAngleRef = useRef(0);

  const waypoints: Waypoint[] = [
    { name: 'Gokulpeth Depot', landmark: 'Zone 2 Terminal', passed: true, eta: '08:15 AM' },
    { name: 'WHC Road Crossing', landmark: 'Coffee House Sq', passed: true, eta: '08:28 AM' },
    { name: 'Law College Sq', landmark: 'Amravati Rd Jn', passed: false, eta: '08:42 AM' },
    { name: 'VIP Road Junction', landmark: 'Civil Lines Entry', passed: false, eta: '08:50 AM' },
    { name: 'Your Location (Ward 14)', landmark: 'Citizen Household Point', passed: false, eta: '08:55 AM' },
  ];

  // Web Audio chime player
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // Audio not supported or blocked by user gesture
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds((prev) => {
        if (prev <= 1) {
          setTruckStatus('nearby');
          return 0;
        }
        return prev - 1;
      });
      setDistanceMeters((prev) => Math.max(15, prev - 2));
      setSpeedKmh(Math.floor(16 + Math.sin(Date.now() / 2000) * 4));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Canvas radar animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radar dark background
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 20,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
      );
      grad.addColorStop(0, '#0a101d');
      grad.addColorStop(1, '#030712');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Radar concentric distance circles
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      [60, 120, 180, 240].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.stroke();

      // Radar rotating sweep
      sweepAngleRef.current = (sweepAngleRef.current + 0.02) % (Math.PI * 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweepAngleRef.current);
      const sweepGrad = ctx.createLinearGradient(0, 0, 240, 0);
      sweepGrad.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
      sweepGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 240, 0, 0.35);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Route Path Nodes
      const routePoints = [
        { x: 70, y: 230, label: 'Depot (Start)' },
        { x: 200, y: 230, label: 'WHC Road' },
        { x: 350, y: 110, label: 'Law College Sq' },
        { x: 500, y: 110, label: 'VIP Road' },
        { x: 640, y: 210, label: '📍 Destination' },
      ];

      // Route line glow
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.25)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      routePoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Dashed active route line
      ctx.beginPath();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -Date.now() / 40;
      routePoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint beacons
      routePoints.forEach((pt, i) => {
        const isEnd = i === routePoints.length - 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isEnd ? 9 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isEnd ? '#22c55e' : '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isEnd ? '#4ade80' : '#94a3b8';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.fillText(pt.label, pt.x - 30, pt.y + 18);
      });

      // Calculate Truck Position
      animProgressRef.current = Math.min(0.92, animProgressRef.current + 0.0006);
      const p = animProgressRef.current;
      let tx = 70 + p * (640 - 70);
      let ty = 230;
      if (p > 0.23 && p <= 0.58) {
        const segP = (p - 0.23) / 0.35;
        tx = 200 + segP * (350 - 200);
        ty = 230 - segP * (230 - 110);
      } else if (p > 0.58) {
        const segP = (p - 0.58) / 0.34;
        tx = 350 + segP * (640 - 350);
        ty = 110 + segP * (210 - 110);
      }

      // Radar pulse ring on truck
      const time = Date.now() / 400;
      const ringRadius = (time % 1) * 32 + 12;
      ctx.beginPath();
      ctx.arc(tx, ty, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - (time % 1)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Truck marker
      ctx.beginPath();
      ctx.arc(tx, ty, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚛', tx, ty);

      animId = requestAnimationFrame(renderMap);
    };

    renderMap();
    return () => cancelAnimationFrame(animId);
  }, []);

  const formatEta = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="citizen-fade-in space-y-6 max-w-6xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
            <span>🚛</span> Live Sanitation Truck GPS Radar
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Real-time GPS telemetry &amp; live route dispatch for NMC Vehicle #NMC-T101 (Dharampeth Ward 14).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs capitalize">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            GPS Online • {truckStatus}
          </span>
          <button
            onClick={() => {
              setAlertEnabled(!alertEnabled);
              if (!alertEnabled) playChime();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              alertEnabled
                ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>{alertEnabled ? '🔔 Chime On' : '🔕 Chime Off'}</span>
          </button>
        </div>
      </div>

      {/* Radar Screen Canvas Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl relative">
        <canvas
          ref={canvasRef}
          width={720}
          height={320}
          className="w-full h-[280px] sm:h-[320px] object-cover block"
        />

        {/* Floating Telemetry HUD (Top Left) */}
        <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md border border-sky-500/30 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-xl">
            ⏱️
          </div>
          <div>
            <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Estimated Arrival</div>
            <div className="text-xl sm:text-2xl font-bold text-sky-200 font-mono tracking-tight">
              {formatEta(etaSeconds)}
            </div>
          </div>
        </div>

        {/* GPS Coordinates HUD (Bottom Right) */}
        <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-mono text-emerald-400 shadow-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>21.1458° N, 79.0882° E • Sector 14-B</span>
        </div>
      </div>

      {/* Real-time Telemetry Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-xl">
              📍
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Distance</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{distanceMeters} meters</div>
              <div className="text-[11px] text-sky-600 dark:text-sky-300 truncate">{currentStreet}</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl">
              ⚡
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Vehicle Speed</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{speedKmh} km/h</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">Steady urban cruise</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl">
              🗑️
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Bin Load Capacity</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{wasteCapacityPct}% Full</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${wasteCapacityPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xl">
              👷
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Assigned Driver</div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">Ramesh Gawande</div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">NMC Tipper #NMC-T101</div>
            </div>
          </div>
        </div>
      </div>

      {/* Waypoint Route Progression Checklist */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>🗺️</span> Today&apos;s Collection Route Stops
        </h3>
        <div className="grid sm:grid-cols-5 gap-2.5 pt-1">
          {waypoints.map((wp, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border transition-all text-xs ${
                wp.passed
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                  : idx === 2
                  ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1 font-bold">
                <span>{wp.passed ? '✓ Completed' : wp.eta}</span>
                <span>{wp.passed ? '🟢' : idx === 2 ? '🚚' : '⚪'}</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{wp.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{wp.landmark}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTruckTracker;
