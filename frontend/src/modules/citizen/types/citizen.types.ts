// ---------------------------------------------------------------------------
// Citizen Module — TypeScript Interfaces
// Mirrors the Pydantic models in backend/routers/citizen.py
// ---------------------------------------------------------------------------

export interface WasteReportPayload {
  image_base64: string;
  latitude: number;
  longitude: number;
  waste_type: 'wet' | 'dry' | 'hazardous' | 'e-waste' | 'mixed';
  description?: string;
  severity?: number;
}

export interface AssignedAuthority {
  name: string;
  role: string;
  phone: string;
  email: string;
  department: string;
  avatar_icon: string;
  avatar_url?: string;
}

export interface TimelineEvent {
  status: string;
  timestamp: string;
  note: string;
}

export interface ReportResponse {
  ticket_id: string;
  status: 'submitted' | 'in_progress' | 'resolved';
  waste_type: string;
  latitude: number;
  longitude: number;
  description: string | null;
  severity: number;
  created_at: string;
  image_url?: string;
  assigned_authority?: AssignedAuthority;
  timeline?: TimelineEvent[];
}

export interface ScheduleDay {
  day: string;
  date: string;
  waste_type: string;
  time_window: string;
  truck_id: string;
  zone: string;
  is_today: boolean;
}

export interface RewardTransaction {
  id: string;
  action: string;
  points: number;
  date: string;
}

export interface RedeemableReward {
  name: string;
  cost: number;
  icon: string;
}

export interface RewardProfile {
  total_points: number;
  tier: string;
  tier_progress: number;
  next_tier: string;
  points_to_next_tier: number;
  streak_days: number;
  history: RewardTransaction[];
  redeemable: RedeemableReward[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  tier: string;
  is_current_user: boolean;
}

export interface SegregationItem {
  name: string;
  icon: string;
  tip: string;
}

export interface SegregationCategory {
  category: string;
  color: string;
  description: string;
  items: SegregationItem[];
}

export interface QuizQuestion {
  question: string;
  answer: 'wet' | 'dry';
  explanation: string;
}

export interface SegregationData {
  categories: SegregationCategory[];
  quiz: QuizQuestion[];
  tips: string[];
}

// Tab navigation
export type CitizenTab = 'home' | 'report' | 'myReports' | 'tracker' | 'schedule' | 'rewards' | 'learn';
