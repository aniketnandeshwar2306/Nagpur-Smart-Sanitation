import React, { useEffect, useRef, useState } from 'react';
import type { DailyTask, WardZoneGeo } from '../types';

interface GISWardMapProps {
  tasks: DailyTask[];
  wards: WardZoneGeo[];
  language: 'en' | 'mr' | 'hi';
  onSelectTask: (task: DailyTask) => void;
  onVerifyTask: (task: DailyTask) => void;
  selectedTaskId?: string | null;
}

// Global declaration for Leaflet injected window
declare global {
  interface Window {
    L: any;
  }
}

export const GISWardMap: React.FC<GISWardMapProps> = ({
  tasks,
  wards,
  language,
  onSelectTask,
  onVerifyTask,
  selectedTaskId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const wardsLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite'>('dark');
  const [activeZoneFilter, setActiveZoneFilter] = useState<string>('ALL');
  const [showWards, setShowWards] = useState<boolean>(true);
  const [showRoute, setShowRoute] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);

  // Worker's simulated live location in Nagpur (Zone 2 Dharampeth)
  const workerLocation: [number, number] = [21.1470, 79.0580];

  // 1. Dynamically Load Leaflet Scripts & CSS if not already in DOM
  useEffect(() => {
    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (window.L) {
        setMapLoaded(true);
        return;
      }

      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.L) {
            setMapLoaded(true);
            clearInterval(interval);
          }
        }, 100);
        return () => clearInterval(interval);
      }
    };

    loadLeaflet();
  }, []);

  // 2. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapContainerRef.current, {
      center: workerLocation,
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    wardsLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    // Initial tile layer setup
    updateTileLayer(map, 'dark');

    // Add Worker Simulated Live GPS Radar Pin
    const workerIcon = L.divIcon({
      className: 'custom-worker-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-slate-900 shadow-xl flex items-center justify-center text-slate-950 font-bold text-xs z-10 animate-bounce">
            🚛
          </div>
          <div class="absolute w-12 h-12 rounded-full bg-amber-400/40 animate-ping"></div>
          <div class="absolute w-16 h-16 rounded-full bg-amber-500/20 animate-pulse"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    userMarkerRef.current = L.marker(workerLocation, { icon: workerIcon })
      .bindPopup(`
        <div class="text-xs font-sans">
          <p class="font-bold text-slate-900">NMC Tipper #12 (Live GPS)</p>
          <p class="text-slate-600">Rajesh Rao • Active on Route</p>
          <p class="text-amber-700 font-medium">Zone 2 - Dharampeth</p>
        </div>
      `)
      .addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapLoaded]);

  // Update Tile Layer Helper
  const updateTileLayer = (map: any, style: 'dark' | 'streets' | 'satellite') => {
    if (!map) return;
    const L = window.L;

    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap &copy; CARTO';

    if (style === 'streets') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    } else if (style === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri World Imagery';
    }

    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);
  };

  // Switch Tile Layer when user toggles
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateTileLayer(mapInstanceRef.current, mapStyle);
    }
  }, [mapStyle]);

  // 3. Render Ward Polygons
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !wardsLayerRef.current) return;
    const L = window.L;
    wardsLayerRef.current.clearLayers();

    if (!showWards) return;

    wards.forEach(ward => {
      if (activeZoneFilter !== 'ALL' && !ward.zone_name.includes(activeZoneFilter)) {
        return;
      }

      const polygon = L.polygon(ward.boundary_coordinates, {
        color: ward.color_code,
        weight: 2,
        dashArray: '4, 6',
        fillColor: ward.color_code,
        fillOpacity: 0.12
      });

      polygon.bindTooltip(
        `<div class="font-sans font-bold text-xs">${ward.zone_name}<br/><span class="font-normal text-[10px]">${ward.ward_name}</span></div>`,
        { permanent: false, direction: 'center', className: 'bg-slate-900 text-slate-100 border border-slate-700 px-2 py-1 rounded shadow-lg' }
      );

      wardsLayerRef.current.addLayer(polygon);
    });
  }, [mapLoaded, wards, showWards, activeZoneFilter]);

  // 4. Render Complaint Pins & Optimized Route Polyline
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markersLayerRef.current || !routeLayerRef.current) return;
    const L = window.L;

    markersLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    const filteredTasks = tasks.filter(task => {
      if (activeZoneFilter !== 'ALL' && !task.location.zone_name.includes(activeZoneFilter)) {
        return false;
      }
      return true;
    });

    const routePoints: [number, number][] = [workerLocation];

    filteredTasks.forEach(task => {
      const isCritical = task.priority === 'CRITICAL';
      const isHigh = task.priority === 'HIGH';
      const isCompleted = task.status === 'COMPLETED';
      const isInProgress = task.status === 'IN_PROGRESS';
      const isSelected = selectedTaskId === task.id;

      const markerColor = isCompleted
        ? 'bg-emerald-500 ring-emerald-400'
        : isCritical
        ? 'bg-rose-600 ring-rose-400'
        : isHigh
        ? 'bg-amber-500 ring-amber-300'
        : isInProgress
        ? 'bg-sky-500 ring-sky-300'
        : 'bg-indigo-500 ring-indigo-300';

      const pinIcon = L.divIcon({
        className: 'custom-task-pin',
        html: `
          <div class="relative cursor-pointer group">
            <div class="w-8 h-8 rounded-full ${markerColor} text-white font-bold text-xs flex items-center justify-center shadow-2xl ring-2 ${
          isSelected ? 'ring-4 ring-amber-400 scale-125' : ''
        } transition-transform">
              ${isCompleted ? '✓' : isCritical ? '!' : '🗑️'}
            </div>
            ${
              isCritical
                ? '<div class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-400 animate-ping"></div>'
                : ''
            }
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([task.location.latitude, task.location.longitude], { icon: pinIcon });

      marker.on('click', () => {
        setSelectedTask(task);
        onSelectTask(task);
      });

      markersLayerRef.current.addLayer(marker);

      if (!isCompleted) {
        routePoints.push([task.location.latitude, task.location.longitude]);
      }
    });

    // Draw Route Polyline
    if (showRoute && routePoints.length > 1) {
      const polyline = L.polyline(routePoints, {
        color: '#f59e0b',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
        lineCap: 'round'
      });

      polyline.bindTooltip(
        '<div class="text-[11px] font-sans font-bold text-amber-300">NMC Optimal Collection Route (7.8 km)</div>',
        { sticky: true }
      );

      routeLayerRef.current.addLayer(polyline);
    }
  }, [mapLoaded, tasks, activeZoneFilter, showRoute, selectedTaskId]);

  const handleCenterOnWorker = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(workerLocation, 15, { animate: true, duration: 1.2 });
    }
  };

  const handleFitAll = () => {
    if (mapInstanceRef.current && tasks.length > 0) {
      const L = window.L;
      const bounds = L.latLngBounds(tasks.map(t => [t.location.latitude, t.location.longitude]));
      bounds.extend(workerLocation);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="relative w-full h-[580px] sm:h-[650px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Map Element Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl pointer-events-auto">
          <select
            value={activeZoneFilter}
            onChange={e => setActiveZoneFilter(e.target.value)}
            className="bg-slate-800 text-xs font-semibold text-amber-400 px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">📍 All Nagpur Zones ({tasks.length})</option>
            <option value="Dharampeth">Zone 2 - Dharampeth</option>
            <option value="Dhantoli">Zone 4 - Dhantoli</option>
            <option value="Hanuman">Zone 3 - Hanuman Nagar</option>
            <option value="Laxmi">Zone 1 - Laxmi Nagar</option>
            <option value="Gandhibagh">Zone 6 - Gandhibagh</option>
            <option value="Mangalwari">Zone 10 - Mangalwari</option>
          </select>

          <button
            onClick={() => setShowWards(!showWards)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showWards
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Ward Polygons"
          >
            {language === 'mr' ? 'प्रभाग सीमा' : 'Wards'}
          </button>

          <button
            onClick={() => setShowRoute(!showRoute)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showRoute
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Collection Route"
          >
            {language === 'mr' ? 'कचरा मार्ग' : 'Route'}
          </button>
        </div>

        {/* Right Map Mode Switcher & GPS Recenter */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Map Layer Toggle */}
          <div className="flex bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl text-xs">
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-1 rounded-lg font-medium ${
                mapStyle === 'dark' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2 py-1 rounded-lg font-medium ${
                mapStyle === 'streets' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-1 rounded-lg font-medium ${
                mapStyle === 'satellite' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sat
            </button>
          </div>

          {/* GPS Recenter */}
          <button
            onClick={handleCenterOnWorker}
            className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xl font-bold transition-all active:scale-90"
            title="Locate My Truck"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Fit All Tasks */}
          <button
            onClick={handleFitAll}
            className="p-2 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700 shadow-xl transition-all"
            title="Fit All Assigned Pins"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Popup Card for Selected Task */}
      {selectedTask && (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-lg mx-auto bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl animate-slideUp">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    selectedTask.priority === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {selectedTask.priority}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {selectedTask.ticket_number}
                </span>
                <span className="text-xs font-medium text-cyan-400">
                  • {selectedTask.waste_type}
                </span>
              </div>
              <h4 className="font-bold text-slate-100 text-sm mt-1 leading-tight">
                {selectedTask.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                📍 {selectedTask.location.address}
              </p>
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800">
            <div className="text-xs text-slate-300">
              <span className="text-slate-400">Citizen:</span>{' '}
              <span className="font-semibold text-slate-200">{selectedTask.citizen_name || 'NMC Portal'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onVerifyTask(selectedTask)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                <span>📷</span>
                <span>AI Verify</span>
              </button>
              <button
                onClick={() => onSelectTask(selectedTask)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-3 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>High Priority</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Resolved</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-amber-400" />
          <span>NMC Route</span>
        </div>
      </div>
    </div>
  );
};
