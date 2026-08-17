export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FLAGGED' | 'RESEGREGATED';
export type WasteCategory = 'Wet Organic' | 'Dry Recyclable' | 'Mixed Waste' | 'Sanitary / Hazardous' | 'E-Waste' | 'Construction Scrap';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  ward_number: number;
  zone_name: string;
}

export interface DailyTask {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  waste_type: WasteCategory | string;
  priority: TaskPriority;
  status: TaskStatus;
  location: LocationCoordinates;
  citizen_name?: string;
  citizen_contact?: string;
  assigned_worker_id: string;
  assigned_at: string;
  estimated_duration_mins: number;
  segregation_score?: number | null;
  verification_status?: 'PASSED' | 'WARNING' | 'FAILED' | null;
  image_url?: string | null;
  proof_image_url?: string | null;
  worker_notes?: string | null;
  completed_at?: string | null;
  distance_meters?: number;
}

export interface SegregationBreakdown {
  wet_organic_pct: number;
  dry_recyclable_pct: number;
  sanitary_hazardous_pct: number;
  unsegregated_contaminant_pct: number;
}

export interface SegregationVerificationResult {
  verification_id: string;
  task_id?: string | null;
  timestamp: string;
  overall_score: number;
  verdict: 'PASSED' | 'WARNING' | 'FAILED';
  primary_category: string;
  breakdown: SegregationBreakdown;
  detected_items: string[];
  contaminants_found: string[];
  ai_confidence: number;
  incentive_earned_inr: number;
  feedback_marathi: string;
  feedback_english: string;
  safety_advisory: string;
}

export interface WeatherAlert {
  alert_id: string;
  alert_type: 'HEATWAVE' | 'MONSOON_RAIN' | 'THUNDERSTORM' | 'AIR_QUALITY' | 'NORMAL';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  headline: string;
  headline_marathi: string;
  description: string;
  temperature_celsius: number;
  feels_like_celsius: number;
  humidity_pct: number;
  precipitation_prob_pct: number;
  wind_speed_kmh: number;
  uv_index: number;
  affected_zones: string[];
  issued_at: string;
  valid_until: string;
  operational_instructions: string[];
  safety_gear_required: string[];
}

export interface WorkerStats {
  worker_id: string;
  worker_name: string;
  zone_assigned: string;
  ward_number: number;
  shift_start: string;
  shift_end: string;
  total_assigned_today: number;
  completed_today: number;
  pending_today: number;
  in_progress_today: number;
  avg_segregation_accuracy: number;
  daily_incentive_earned_inr: number;
  safety_compliance_score: number;
  distance_covered_km: number;
  active_vehicle_number: string;
}

export interface WardZoneGeo {
  ward_id: number;
  zone_name: string;
  ward_name: string;
  center_lat: number;
  center_lng: number;
  active_complaints_count: number;
  bins_count: number;
  color_code: string;
  boundary_coordinates: [number, number][];
}
