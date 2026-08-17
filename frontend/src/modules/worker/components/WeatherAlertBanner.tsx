import React, { useState, useEffect } from 'react';
import type { WeatherAlert } from '../types';
import { workerApi } from '../api';

interface WeatherAlertBannerProps {
  language: 'en' | 'mr' | 'hi';
  zoneFilter?: string;
  onOpenChecklist?: () => void;
}

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({
  language,
  zoneFilter,
  onOpenChecklist
}) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await workerApi.getWeatherAlerts(zoneFilter);
        if (isMounted) {
          setAlerts(data);
        }
      } catch (err) {
        console.error('Failed to load weather alerts:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAlerts();
    return () => { isMounted = false; };
  }, [zoneFilter]);

  if (isDismissed || alerts.length === 0 || loading) {
    return null;
  }

  const currentAlert = alerts[currentIndex] || alerts[0];
  const isAcknowledged = acknowledgedIds.has(currentAlert.alert_id);
  const isHeatwave = currentAlert.alert_type === 'HEATWAVE';
  const isRain = currentAlert.alert_type === 'MONSOON_RAIN' || currentAlert.alert_type === 'THUNDERSTORM';

  const handleAcknowledge = () => {
    const updated = new Set(acknowledgedIds);
    updated.add(currentAlert.alert_id);
    setAcknowledgedIds(updated);
    if (onOpenChecklist) {
      onOpenChecklist();
    }
  };

  const getSeverityBadge = () => {
    if (currentAlert.severity === 'CRITICAL' || currentAlert.severity === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          {language === 'mr' ? 'अति दक्षता' : language === 'hi' ? 'उच्च चेतावनी' : 'High Alert'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-sm">
        {language === 'mr' ? 'सावधानता' : language === 'hi' ? 'सावधानी' : 'Advisory'}
      </span>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-3 pb-1">
      <div
        className={`relative overflow-hidden rounded-xl border transition-all duration-300 shadow-xl ${
          isHeatwave
            ? 'bg-gradient-to-r from-orange-950/80 via-amber-950/60 to-rose-950/80 border-amber-500/40'
            : isRain
            ? 'bg-gradient-to-r from-slate-900 via-sky-950/70 to-indigo-950/80 border-sky-500/40'
            : 'bg-slate-900 border-slate-700'
        }`}
      >
        {/* Top Accent glow bar */}
        <div
          className={`h-1 w-full ${
            isHeatwave
              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500'
              : 'bg-gradient-to-r from-sky-400 via-teal-400 to-indigo-500'
          }`}
        />

        <div className="p-3.5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {/* Weather Icon with animated pulsation */}
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  isHeatwave
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 ring-2 ring-amber-500/20'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30 ring-2 ring-sky-500/20'
                }`}
              >
                {isHeatwave ? (
                  <svg className="w-6 h-6 animate-[spin_12s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getSeverityBadge()}
                  <span className="text-[11px] font-mono text-slate-300">
                    IMD Nagpur • {currentAlert.temperature_celsius}C
                  </span>
                  <span className="text-[11px] text-amber-400 font-semibold">
                    (Feels {currentAlert.feels_like_celsius}C)
                  </span>
                </div>
                <h3 className="font-bold text-slate-100 text-sm mt-0.5 leading-snug">
                  {language === 'mr' ? currentAlert.headline_marathi : currentAlert.headline}
                </h3>
              </div>
            </div>

            {/* Quick Actions & Carousel Controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {alerts.length > 1 && (
                <div className="flex items-center gap-1 mr-1">
                  {alerts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex ? 'bg-amber-400 w-4' : 'bg-slate-700 hover:bg-slate-500'
                      }`}
                      aria-label={`Alert ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand Guidelines'}
              >
                <svg
                  className={`w-4 h-4 transform transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                title="Dismiss Banner"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-slate-800/60 text-xs text-slate-300 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">💧 Humidity:</span>
              <span className="font-semibold">{currentAlert.humidity_pct}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">🌧️ Rain Prob:</span>
              <span className="font-semibold text-sky-400">{currentAlert.precipitation_prob_pct}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">☀️ UV Index:</span>
              <span className="font-semibold text-rose-400">{currentAlert.uv_index} (Extreme)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">📍 Zones:</span>
              <span className="font-semibold text-amber-300">
                {currentAlert.affected_zones.length} Nagpur Zones
              </span>
            </div>
          </div>

          {/* Expandable NMC Field Instructions & Safety SOP */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 text-xs animate-fadeIn">
              <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {currentAlert.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Field Operations SOP */}
                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                  <h4 className="font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                    <span>📋</span>
                    {language === 'mr' ? 'कार्यकारी सूचना (NMC SOP)' : language === 'hi' ? 'संचालन निर्देश' : 'Operational Directives'}
                  </h4>
                  <ul className="space-y-1 text-slate-300">
                    {currentAlert.operational_instructions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mandatory Safety Gear */}
                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                  <h4 className="font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                    <span>🦺</span>
                    {language === 'mr' ? 'आवश्यक सुरक्षा साधने' : language === 'hi' ? 'सुरक्षा किट' : 'Required PPE & Safety Gear'}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentAlert.safety_gear_required.map((gear, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-medium"
                      >
                        o {gear}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acknowledge Button */}
              <div className="flex justify-end items-center gap-2 pt-1">
                <button
                  onClick={handleAcknowledge}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-md active:scale-95 ${
                    isAcknowledged
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isAcknowledged
                    ? (language === 'mr' ? 'माहिती नोंदवली गेली (Acknowledged)' : 'Safety Directive Acknowledged')
                    : (language === 'mr' ? 'सुचना मान्य करा व सुरक्षा चेकलिस्ट उघडा' : 'Acknowledge & Confirm Safety SOP')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
