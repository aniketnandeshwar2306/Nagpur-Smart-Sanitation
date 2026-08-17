import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue in Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  type: 'truck' | 'bin' | 'zone' | 'incident';
}

interface NagpurMapProps {
  className?: string;
  markers?: MapMarker[];
  zoom?: number;
  center?: [number, number];
}

const DEFAULT_MARKERS: MapMarker[] = [
  { lat: 21.1458, lng: 79.0882, label: 'Zone A – Dharampeth (Active)', type: 'truck' },
  { lat: 21.1535, lng: 79.0949, label: 'Bin #452 – Civil Lines (Full!)', type: 'bin' },
  { lat: 21.1388, lng: 79.0816, label: 'Zone B – Sitabuldi (In Progress)', type: 'truck' },
  { lat: 21.1490, lng: 79.1012, label: 'Incident – Kamptee Road', type: 'incident' },
  { lat: 21.1578, lng: 79.0780, label: 'Zone C – Gandhibagh (Completed)', type: 'zone' },
  { lat: 21.1420, lng: 79.0960, label: 'Bin #108 – Hanuman Nagar (65%)', type: 'bin' },
];

const MARKER_ICONS: Record<MapMarker['type'], { color: string; emoji: string }> = {
  truck:    { color: '#2D5A3F', emoji: '🚛' },
  bin:      { color: '#8B6D4C', emoji: '🗑️' },
  zone:     { color: '#5C936E', emoji: '📍' },
  incident: { color: '#dc2626', emoji: '⚠️' },
};

const NagpurMap: React.FC<NagpurMapProps> = ({
  className = '',
  markers = DEFAULT_MARKERS,
  zoom = 13,
  center = [21.1458, 79.0882],
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Initialize map centered on Nagpur
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Use OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | NMC Smart Sanitation',
      maxZoom: 19,
    }).addTo(map);

    // Add markers with custom icons
    markers.forEach((m) => {
      const { color, emoji } = MARKER_ICONS[m.type];

      const iconHtml = `
        <div style="
          background: ${color};
          border: 2.5px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          font-size: 14px;
        ">
          <span style="transform: rotate(45deg)">${emoji}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -36],
      });

      L.marker([m.lat, m.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px 2px; min-width: 160px;">
            <div style="font-size: 13px; font-weight: 700; color: #1A2E22; margin-bottom: 2px;">${emoji} ${m.label}</div>
            <div style="font-size: 11px; color: #5C6B61; text-transform: capitalize;">${m.type} · Nagpur</div>
          </div>
        `, {
          maxWidth: 220,
          className: 'eco-leaflet-popup',
        });
    });

    // Style attribution
    map.attributionControl.setPrefix('');

    leafletMapRef.current = map;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className={className}
      style={{ zIndex: 0 }}
    />
  );
};

export default NagpurMap;
