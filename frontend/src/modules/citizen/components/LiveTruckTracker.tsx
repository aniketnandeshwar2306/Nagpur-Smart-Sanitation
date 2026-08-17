import React, { useEffect, useState, useRef } from 'react';

const LiveTruckTracker: React.FC = () => {
  const [etaSeconds, setEtaSeconds] = useState(254); // 4 min 14 sec
  const [distanceMeters, setDistanceMeters] = useState(480);
  const [speedKmh] = useState(16);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [truckStatus, setTruckStatus] = useState<'approaching' | 'nearby' | 'stopped'>('approaching');
  const currentStreet = 'West High Court Road (Gokulpeth)';

  // Animation frame loop for truck movement simulation on map canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animProgressRef = useRef(0.2);

  useEffect(() => {
    // Countdown timer interval
    const timer = setInterval(() => {
      setEtaSeconds(prev => {
        if (prev <= 1) {
          setTruckStatus('nearby');
          return 0;
        }
        return prev - 1;
      });
      setDistanceMeters(prev => Math.max(20, prev - 2));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Draw interactive dark mode map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Route Polyline (Gokulpeth Market → Law College Square → Citizen Home)
      const routePoints = [
        { x: 50, y: 220, label: 'Gokulpeth Depot' },
        { x: 180, y: 220, label: 'WHC Road' },
        { x: 320, y: 120, label: 'Law College Sq' },
        { x: 480, y: 120, label: 'VIP Road' },
        { x: 620, y: 200, label: '📍 Your Home (Ward 14)' },
      ];

      // Draw Route path line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      routePoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Draw Route Dash animation overlay
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -Date.now() / 50;
      routePoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Draw Waypoint nodes
      routePoints.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, i === routePoints.length - 1 ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = i === routePoints.length - 1 ? '#22c55e' : '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Labels
        ctx.fillStyle = i === routePoints.length - 1 ? '#4ade80' : '#94a3b8';
        ctx.font = 'bold 11px system-ui';
        ctx.fillText(pt.label, pt.x - 30, pt.y + 22);
      });

      // Calculate Truck position along route curve
      animProgressRef.current += 0.0008;
      if (animProgressRef.current > 0.95) animProgressRef.current = 0.95;

      const p = animProgressRef.current;
      // Interpolate along route segments
      let tx = 50 + p * (620 - 50);
      let ty = 220;
      if (p > 0.25 && p <= 0.6) {
        const segP = (p - 0.25) / 0.35;
        tx = 180 + segP * (320 - 180);
        ty = 220 - segP * (220 - 120);
      } else if (p > 0.6) {
        const segP = (p - 0.6) / 0.35;
        tx = 320 + segP * (300);
        ty = 120 + segP * (80);
      }

      // Radar Pulse Rings around Truck
      const time = Date.now() / 400;
      const ringRadius = (time % 1) * 35 + 10;
      ctx.beginPath();
      ctx.arc(tx, ty, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - (time % 1)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Truck Marker Icon (🚛)
      ctx.beginPath();
      ctx.arc(tx, ty, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
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
    <div className="citizen-fade-in space-y-6 max-w-6xl mx-auto pb-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1A2E22] dark:text-white flex items-center gap-2">
              <span>🚛</span> Live Sanitation Truck GPS Radar
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Real-time GPS tracking for NMC Vehicle #NMC-T101 in Dharampeth Ward 14.</p>
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm capitalize">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            GPS Linked • {truckStatus}
          </span>
        </div>
      </div>

      {/* Map Canvas Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <canvas
          ref={canvasRef}
          width={700}
          height={300}
          className="w-full h-[280px] md:h-[320px] object-cover block"
        />

        {/* Floating Overlay HUD */}
        <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <div className="text-3xl">⏱️</div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Estimated Arrival</div>
            <div className="text-2xl font-black text-sky-400 font-mono citizen-count-pulse">
              {formatEta(etaSeconds)}
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-3 flex items-center gap-3 shadow-xl">
          <button
            onClick={() => setAlertEnabled(!alertEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
              alertEnabled
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <span>{alertEnabled ? '🔔 Chime Alert On' : '🔕 Alert Off'}</span>
          </button>
        </div>
      </div>

      {/* Truck Info Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-2xl">
            📍
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Distance Remaining</div>
            <div className="text-2xl font-black text-white mt-0.5">{distanceMeters} meters</div>
            <div className="text-xs text-sky-400 truncate mt-0.5">{currentStreet}</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl">
            ⚡
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Speed</div>
            <div className="text-2xl font-black text-white mt-0.5">{speedKmh} km/h</div>
            <div className="text-xs text-emerald-400 mt-0.5">Moving smoothly</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
            🚚
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Assigned Driver</div>
            <div className="text-base font-bold text-white mt-0.5">Ramesh Gawande</div>
            <div className="text-xs text-slate-400">NMC Tipper #NMC-T101</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTruckTracker;
