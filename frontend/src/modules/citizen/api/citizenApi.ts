// ---------------------------------------------------------------------------
// Citizen Module — API Helpers with Mock Data Fallback
// When backend (localhost:8000) is unavailable, returns realistic mock data.
// ---------------------------------------------------------------------------

import type {
  WasteReportPayload,
  ReportResponse,
  ScheduleDay,
  RewardProfile,
  LeaderboardEntry,
  SegregationData,
} from '../types/citizen.types';

const BASE_URL = 'http://localhost:8000/api/citizen';

// ──────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ──────────────────────────────────────────────────────────────────────────────

const MOCK_REPORTS: ReportResponse[] = [
  {
    ticket_id: 'NMC-2024-0841',
    waste_type: 'wet',
    status: 'in_progress',
    severity: 4,
    latitude: 21.1458,
    longitude: 79.0882,
    description: 'Large pile of wet waste outside Sitabuldi market gate, attracting stray animals.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    assigned_authority: { name: 'Zone B Inspector – Ravi Kumar', contact: '9876543210' },
  },
  {
    ticket_id: 'NMC-2024-0798',
    waste_type: 'hazardous',
    status: 'submitted',
    severity: 5,
    latitude: 21.1535,
    longitude: 79.0949,
    description: 'Chemical drums dumped near drainage nala behind Cotton Market.',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    assigned_authority: null,
  },
  {
    ticket_id: 'NMC-2024-0732',
    waste_type: 'dry',
    status: 'resolved',
    severity: 2,
    latitude: 21.1388,
    longitude: 79.0816,
    description: 'Cardboard and plastic waste blocking footpath on Wardha Road.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    assigned_authority: { name: 'Zone A Inspector – Priya Deshpande', contact: '9765432100' },
  },
  {
    ticket_id: 'NMC-2024-0715',
    waste_type: 'e-waste',
    status: 'resolved',
    severity: 3,
    latitude: 21.1490,
    longitude: 79.1012,
    description: 'Old CRT monitors and circuit boards dumped near Ambedkar Square.',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    assigned_authority: { name: 'E-Waste Cell – NMC', contact: '9812345678' },
  },
  {
    ticket_id: 'NMC-2024-0689',
    waste_type: 'mixed',
    status: 'resolved',
    severity: 3,
    latitude: 21.1578,
    longitude: 79.0780,
    description: 'Unsegregated garbage overflowing from community bin near Dharampeth colony.',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    assigned_authority: { name: 'Zone C Inspector – Suresh Patil', contact: '9823456789' },
  },
  {
    ticket_id: 'NMC-2024-0650',
    waste_type: 'wet',
    status: 'resolved',
    severity: 2,
    latitude: 21.1420,
    longitude: 79.0960,
    description: 'Kitchen waste bags left on road outside apartment complex Gokulpeth.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    assigned_authority: { name: 'Zone B Inspector – Ravi Kumar', contact: '9876543210' },
  },
];

const MOCK_SCHEDULE: ScheduleDay[] = [
  { day: 'Monday',    date: '2024-10-21', waste_type: 'wet',       time_window: '6:00 AM – 10:00 AM', truck_id: 'NMC-T42', zone: 'Dharampeth Ward 14', is_today: false },
  { day: 'Tuesday',   date: '2024-10-22', waste_type: 'dry',       time_window: '7:00 AM – 11:00 AM', truck_id: 'NMC-T18', zone: 'Dharampeth Ward 14', is_today: false },
  { day: 'Wednesday', date: '2024-10-23', waste_type: 'wet',       time_window: '6:00 AM – 10:00 AM', truck_id: 'NMC-T42', zone: 'Dharampeth Ward 14', is_today: true  },
  { day: 'Thursday',  date: '2024-10-24', waste_type: 'hazardous', time_window: '8:00 AM – 12:00 PM', truck_id: 'NMC-T07', zone: 'Dharampeth Ward 14', is_today: false },
  { day: 'Friday',    date: '2024-10-25', waste_type: 'dry',       time_window: '7:00 AM – 11:00 AM', truck_id: 'NMC-T18', zone: 'Dharampeth Ward 14', is_today: false },
  { day: 'Saturday',  date: '2024-10-26', waste_type: 'mixed',     time_window: '6:30 AM – 10:30 AM', truck_id: 'NMC-T33', zone: 'Dharampeth Ward 14', is_today: false },
  { day: 'Sunday',    date: '2024-10-27', waste_type: '—',         time_window: 'No Collection',      truck_id: '—',        zone: 'Dharampeth Ward 14', is_today: false },
];

const MOCK_REWARDS: RewardProfile = {
  total_points: 1480,
  streak_days: 7,
  tier: 'Sapling',
  tier_progress: 74,
  next_tier: 'Tree',
  points_to_next_tier: 520,
  history: [
    { id: 'txn-001', action: 'Report submitted – Wet waste (Sitabuldi)', points: 50,  date: '2024-10-23' },
    { id: 'txn-002', action: 'Segregation verified – Dry waste',          points: 75,  date: '2024-10-22' },
    { id: 'txn-003', action: '7-day streak bonus',                         points: 200, date: '2024-10-21' },
    { id: 'txn-004', action: 'Report submitted – Hazardous (Cotton Mkt)', points: 100, date: '2024-10-20' },
    { id: 'txn-005', action: 'Redeemed: Bus Pass Discount',               points: -150, date: '2024-10-18' },
  ],
  redeemable: [
    { id: 'r1', name: 'NMC Bus Pass (1 Day)', cost: 150, icon: '🚌', description: 'Free single-day MSRTC bus travel within Nagpur.' },
    { id: 'r2', name: 'Compost Bag Pack',     cost: 200, icon: '🪣', description: '10L compostable waste bags – home delivery.' },
    { id: 'r3', name: 'Tree Sapling',         cost: 300, icon: '🌳', description: 'Receive a native tree sapling for home planting.' },
    { id: 'r4', name: 'NMC Tax Rebate ₹50',  cost: 500, icon: '💰', description: '₹50 discount on municipal property tax bill.' },
  ],
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1,  name: 'Anjali Bhatt',    points: 3800, ward: 'Laxmi Nagar',    tier: 'Forest',   streak: 28 },
  { rank: 2,  name: 'Suresh Kolte',    points: 3650, ward: 'Dharampeth',     tier: 'Forest',   streak: 22 },
  { rank: 3,  name: 'Meera Dongre',    points: 3410, ward: 'Hanuman Nagar',  tier: 'Tree',     streak: 19 },
  { rank: 4,  name: 'Rajan Wankhede',  points: 3100, ward: 'Sitabuldi',      tier: 'Tree',     streak: 15 },
  { rank: 5,  name: 'Pooja Kukde',     points: 2890, ward: 'Mangalwari',     tier: 'Tree',     streak: 12 },
  { rank: 6,  name: 'You (Dharampeth)',points: 1480, ward: 'Dharampeth W14', tier: 'Sapling',  streak: 7  },
];

const MOCK_SEGREGATION: SegregationData = {
  categories: [
    {
      name: 'Wet Waste',
      category: 'Wet Waste',
      icon: '🥬',
      color: '#22c55e',
      description: 'Biodegradable organic waste from kitchen and garden.',
      examples: ['Vegetable & fruit peels', 'Cooked food leftovers', 'Tea leaves & coffee grounds', 'Egg shells', 'Garden weeds'],
      tips: 'Drain excess liquid before disposal. Use a separate green-lidded bin. Ideal for home composting.',
      do: ['Keep moist', 'Mix with dry leaves', 'Compost at home'],
      dont: ['Mix with dry waste', 'Add to plastic waste', 'Leave in open air for more than 24 hrs'],
      items: [
        { name: 'Vegetable Peels', icon: '🥕', tip: 'Compost directly' },
        { name: 'Cooked Food', icon: '🍲', tip: 'Drain excess liquid' },
        { name: 'Tea Leaves', icon: '☕', tip: 'Great nitrogen source for soil' },
      ],
    },
    {
      name: 'Dry Waste',
      category: 'Dry Waste',
      icon: '📦',
      color: '#f59e0b',
      description: 'Recyclable non-biodegradable household packaging and materials.',
      examples: ['Cardboard & newspaper', 'Plastic bottles & bags', 'Glass jars', 'Metal cans & foil', 'Cloth & rubber'],
      tips: 'Rinse containers before placing in dry waste bin. Flatten cardboard boxes to save space.',
      do: ['Clean before disposing', 'Flatten boxes', 'Sort by material type'],
      dont: ['Mix with wet or food waste', 'Include soiled paper', 'Dispose broken glass without wrapping'],
      items: [
        { name: 'Plastic Bottles', icon: '🍾', tip: 'Rinse and crush' },
        { name: 'Cardboard Boxes', icon: '📦', tip: 'Flatten to save space' },
        { name: 'Glass Containers', icon: '🫙', tip: 'Rinse thoroughly' },
      ],
    },
  ],
  quiz: [
    { question: 'Where does an empty plastic mineral water bottle go?', answer: 'dry', explanation: 'Plastic bottles are recyclable dry waste. Rinse and crush them before disposal.' },
    { question: 'Where do banana peels and vegetable scraps go?', answer: 'wet', explanation: 'Organic kitchen waste is wet waste and should be composted.' },
  ],
  tips: [
    'Always use separate green (wet) and blue (dry) bins at home.',
    'Rinse milk packets and plastic containers before putting them in dry waste.',
    'Keep electronic waste separate for quarterly NMC e-waste collection drives.',
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// API HELPER with fallback
// ──────────────────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${res.status}: ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

async function withFallback<T>(path: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const result = await apiFetch<T>(path, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return result;
  } catch {
    console.warn(`[CitizenAPI] Backend unavailable for ${path}, using mock data.`);
    return fallback;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// EXPORTED FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────

export async function submitReport(data: WasteReportPayload): Promise<ReportResponse> {
  try {
    return await apiFetch<ReportResponse>('/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    const mockResponse: ReportResponse = {
      ticket_id: `NMC-2024-${Math.floor(900 + Math.random() * 99)}`,
      waste_type: data.waste_type,
      status: 'submitted',
      severity: data.severity ?? 3,
      latitude: data.latitude || 21.1458,
      longitude: data.longitude || 79.0882,
      description: data.description || '',
      created_at: new Date().toISOString(),
      assigned_authority: null,
    };
    await new Promise(r => setTimeout(r, 1000));
    return mockResponse;
  }
}

export async function fetchReports(): Promise<ReportResponse[]> {
  return withFallback<ReportResponse[]>('/reports', MOCK_REPORTS);
}

export async function fetchSchedule(): Promise<ScheduleDay[]> {
  return withFallback<ScheduleDay[]>('/schedule', MOCK_SCHEDULE);
}

export async function fetchRewards(): Promise<RewardProfile> {
  return withFallback<RewardProfile>('/rewards', MOCK_REWARDS);
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return withFallback<LeaderboardEntry[]>('/leaderboard', MOCK_LEADERBOARD);
}

export async function fetchSegregationGuide(): Promise<SegregationData> {
  return withFallback<SegregationData>('/segregation-guide', MOCK_SEGREGATION);
}
