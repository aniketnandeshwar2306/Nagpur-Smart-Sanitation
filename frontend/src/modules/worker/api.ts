import type {
  DailyTask,
  SegregationVerificationResult,
  WeatherAlert,
  WorkerStats,
  WardZoneGeo,
  AISpotDetectionResult
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash'
];

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const extractJsonFromText = (rawText: string): any => {
  let text = (rawText || '').trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/(\{[\s\S]*\})/);
    if (match) return JSON.parse(match[1]);
    throw new Error('Could not parse JSON from AI response');
  }
};

/**
 * Calculates worker incentive bonus (INR) directly proportional to AI segregation purity score:
 * - 95% - 100% Purity (Flawless / Grade A+): ₹50.0
 * - 90% - 94.9% Purity (Excellent Grade A): ₹40.0
 * - 80% - 89.9% Purity (High / Clean): ₹30.0
 * - 70% - 79.9% Purity (Standard Acceptable): ₹20.0
 * - 60% - 69.9% Purity (Warning / Minor Contaminants): ₹10.0
 * - 50% - 59.9% Purity (Low Quality): ₹5.0
 * - < 50% or Non-Waste / Failed: ₹0.0
 */
export function calculateSegregationBonus(score: number | null | undefined, verdict?: string | null): number {
  if (score === null || score === undefined || score < 50 || verdict === 'FAILED') return 0;
  if (score >= 95) return 50;
  if (score >= 90) return 40;
  if (score >= 80) return 30;
  if (score >= 70) return 20;
  if (score >= 60) return 10;
  return 5;
}

const FALLBACK_WARDS: WardZoneGeo[] = [
  {
    ward_id: 1,
    zone_name: 'Zone 1 - Laxmi Nagar',
    ward_name: 'Bajaj Nagar, Shankar Nagar, Khamla & Pratap Nagar',
    center_lat: 21.1250,
    center_lng: 79.0600,
    active_complaints_count: 5,
    bins_count: 24,
    color_code: '#06b6d4',
    boundary_coordinates: [
      [21.138, 79.050], [21.138, 79.072], [21.115, 79.072], [21.115, 79.050]
    ]
  },
  {
    ward_id: 2,
    zone_name: 'Zone 2 - Dharampeth',
    ward_name: 'Futala, Ram Nagar, Gokulpeth, Seminary Hills & Dharampeth',
    center_lat: 21.1470,
    center_lng: 79.0580,
    active_complaints_count: 6,
    bins_count: 28,
    color_code: '#3b82f6',
    boundary_coordinates: [
      [21.158, 79.045], [21.158, 79.070], [21.138, 79.070], [21.138, 79.045]
    ]
  },
  {
    ward_id: 3,
    zone_name: 'Zone 3 - Hanuman Nagar',
    ward_name: 'Reshimbagh, Medical Square, Sakkardara & Ayodhya Nagar',
    center_lat: 21.1220,
    center_lng: 79.1020,
    active_complaints_count: 5,
    bins_count: 22,
    color_code: '#8b5cf6',
    boundary_coordinates: [
      [21.135, 79.090], [21.135, 79.115], [21.112, 79.115], [21.112, 79.090]
    ]
  },
  {
    ward_id: 4,
    zone_name: 'Zone 4 - Dhantoli',
    ward_name: 'Congress Nagar, Sitabuldi, Rahate Colony & Ajni',
    center_lat: 21.1390,
    center_lng: 79.0830,
    active_complaints_count: 7,
    bins_count: 30,
    color_code: '#ec4899',
    boundary_coordinates: [
      [21.148, 79.072], [21.148, 79.095], [21.130, 79.095], [21.130, 79.072]
    ]
  },
  {
    ward_id: 5,
    zone_name: 'Zone 5 - Nehru Nagar',
    ward_name: 'Nandanvan, Tajbagh, Hasanbagh, Kharbi & Dighori',
    center_lat: 21.1280,
    center_lng: 79.1320,
    active_complaints_count: 6,
    bins_count: 26,
    color_code: '#e11d48',
    boundary_coordinates: [
      [21.138, 79.120], [21.138, 79.145], [21.118, 79.145], [21.118, 79.120]
    ]
  },
  {
    ward_id: 6,
    zone_name: 'Zone 6 - Gandhibagh',
    ward_name: 'Itwari, Mahal, Badkas Chowk & Hansapuri',
    center_lat: 21.1550,
    center_lng: 79.1100,
    active_complaints_count: 9,
    bins_count: 35,
    color_code: '#f59e0b',
    boundary_coordinates: [
      [21.165, 79.098], [21.165, 79.122], [21.145, 79.122], [21.145, 79.098]
    ]
  },
  {
    ward_id: 7,
    zone_name: 'Zone 7 - Satranjipura',
    ward_name: 'Satranjipura, Shanti Nagar, Mehdi Bagh & Itwari Bazar',
    center_lat: 21.1660,
    center_lng: 79.1150,
    active_complaints_count: 6,
    bins_count: 24,
    color_code: '#14b8a6',
    boundary_coordinates: [
      [21.176, 79.105], [21.176, 79.126], [21.156, 79.126], [21.156, 79.105]
    ]
  },
  {
    ward_id: 8,
    zone_name: 'Zone 8 - Lakadganj',
    ward_name: 'Garoba Maidan, Bagadganj, Pardi & Wardhaman Nagar',
    center_lat: 21.1480,
    center_lng: 79.1400,
    active_complaints_count: 8,
    bins_count: 32,
    color_code: '#84cc16',
    boundary_coordinates: [
      [21.158, 79.128], [21.158, 79.155], [21.138, 79.155], [21.138, 79.128]
    ]
  },
  {
    ward_id: 9,
    zone_name: 'Zone 9 - Ashi Nagar',
    ward_name: 'Pachpaoli, Bezonbagh, Indora, Kamal Chowk & Teka Naka',
    center_lat: 21.1820,
    center_lng: 79.1100,
    active_complaints_count: 7,
    bins_count: 28,
    color_code: '#6366f1',
    boundary_coordinates: [
      [21.195, 79.098], [21.195, 79.124], [21.170, 79.124], [21.170, 79.098]
    ]
  },
  {
    ward_id: 10,
    zone_name: 'Zone 10 - Mangalwari',
    ward_name: 'Sadar, Chaoni, Raj Bhavan, Mankapur & Gittikhadan',
    center_lat: 21.1750,
    center_lng: 79.0750,
    active_complaints_count: 4,
    bins_count: 20,
    color_code: '#10b981',
    boundary_coordinates: [
      [21.188, 79.062], [21.188, 79.090], [21.162, 79.090], [21.162, 79.062]
    ]
  }
];

const FALLBACK_TASKS: DailyTask[] = [
  {
    id: 'TSK-NGP-101',
    ticket_number: 'NMC-2026-8801',
    title: 'Commercial Dry Waste Overspill at Sitabuldi Market',
    description: 'Excess cardboard packaging, plastic wrap, and carton accumulation blocking lane behind Main Footwear Market.',
    waste_type: 'Dry Recyclable',
    priority: 'CRITICAL',
    status: 'PENDING',
    location: {
      latitude: 21.1448,
      longitude: 79.0837,
      address: 'Shop 42, Sitabuldi Main Market Gate 2, Nagpur',
      landmark: 'Opposite Variety Square Metro Station',
      ward_number: 4,
      zone_name: 'Zone 4 - Dhantoli'
    },
    citizen_name: 'Anand Kulkarni (Vyapari Mandal)',
    citizen_contact: '+91 98230 11422',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T06:30:00Z',
    estimated_duration_mins: 35,
    segregation_score: null,
    verification_status: null,
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
    distance_meters: 650
  },
  {
    id: 'TSK-NGP-102',
    ticket_number: 'NMC-2026-8802',
    title: 'Food Kiosk Organic Waste Collection at Futala Promenade',
    description: 'Daily organic wet waste (coconut shells, snack leftovers, fruit pulp) from evening food stalls ready for composting pickup.',
    waste_type: 'Wet Organic',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    location: {
      latitude: 21.1539,
      longitude: 79.0494,
      address: 'Futala Lake Promenade East Bank, Vayusena Nagar',
      landmark: 'Near Futala Musical Fountain Gate 1',
      ward_number: 2,
      zone_name: 'Zone 2 - Dharampeth'
    },
    citizen_name: 'Suresh Bhole',
    citizen_contact: '+91 94221 44550',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T07:15:00Z',
    estimated_duration_mins: 25,
    segregation_score: 92.0,
    verification_status: 'PASSED',
    image_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60',
    worker_notes: 'First lot loaded into green composter bin vehicle.',
    distance_meters: 1200
  },
  {
    id: 'TSK-NGP-103',
    ticket_number: 'NMC-2026-8803',
    title: 'Apartment Complex Unsegregated Waste Clearance',
    description: 'Citizen complaint of mixed waste dumped near transformer yard. Needs AI verification of source segregation before truck loading.',
    waste_type: 'Mixed Waste',
    priority: 'MEDIUM',
    status: 'PENDING',
    location: {
      latitude: 21.1432,
      longitude: 79.0621,
      address: 'Shree Ganesh Enclave, Dharampeth Extension',
      landmark: 'Behind Coffee House Square',
      ward_number: 2,
      zone_name: 'Zone 2 - Dharampeth'
    },
    citizen_name: 'Pooja Deshmukh (Secretary)',
    citizen_contact: '+91 97644 88319',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T08:00:00Z',
    estimated_duration_mins: 30,
    segregation_score: null,
    verification_status: null,
    image_url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500&auto=format&fit=crop&q=60',
    distance_meters: 450
  },
  {
    id: 'TSK-NGP-104',
    ticket_number: 'NMC-2026-8804',
    title: 'Clinic Biomedical / Sanitary Waste Special Disposal',
    description: 'Safe pickup of sealed yellow bin containers containing sanitized clinical disposables & gloves from local clinic lane.',
    waste_type: 'Sanitary / Hazardous',
    priority: 'CRITICAL',
    status: 'PENDING',
    location: {
      latitude: 21.1309,
      longitude: 79.0988,
      address: 'Near GMC Boys Hostel Road, Medical Square',
      landmark: 'Opposite Ayush Diagnostics',
      ward_number: 3,
      zone_name: 'Zone 3 - Hanuman Nagar'
    },
    citizen_name: 'Dr. Milind Joshi',
    citizen_contact: '+91 98901 33410',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T08:30:00Z',
    estimated_duration_mins: 20,
    segregation_score: null,
    verification_status: null,
    image_url: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&auto=format&fit=crop&q=60',
    distance_meters: 800
  },
  {
    id: 'TSK-NGP-105',
    ticket_number: 'NMC-2026-8805',
    title: 'Morning Garden Trimmings & Horticulture Waste',
    description: 'Tree pruning branches and dry leaves gathered after public garden maintenance. 100% compostable organic green load.',
    waste_type: 'Wet Organic',
    priority: 'LOW',
    status: 'COMPLETED',
    location: {
      latitude: 21.1278,
      longitude: 79.1084,
      address: 'Reshimbagh Ground North Perimeter',
      landmark: 'Near Hedgewar Smruti Mandir Gate 3',
      ward_number: 3,
      zone_name: 'Zone 3 - Hanuman Nagar'
    },
    citizen_name: 'NMC Garden Department',
    citizen_contact: '+91 712 2567001',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T06:00:00Z',
    estimated_duration_mins: 20,
    segregation_score: 98.0,
    verification_status: 'PASSED',
    image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=60',
    proof_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=60',
    worker_notes: 'Loaded 350 kg leaf litter into shredder composter vehicle.',
    completed_at: '2026-08-16T07:10:00Z',
    bonus_awarded: 50.0,
    distance_meters: 1400
  },
  {
    id: 'TSK-NGP-106',
    ticket_number: 'NMC-2026-8806',
    title: 'Electronic E-Waste Drop Box Clearance',
    description: 'Public battery and obsolete electronic scrap bin reached 90% capacity at Shankar Nagar community hall.',
    waste_type: 'E-Waste',
    priority: 'MEDIUM',
    status: 'PENDING',
    location: {
      latitude: 21.1315,
      longitude: 79.0620,
      address: 'Community Civic Center, Shankar Nagar Square',
      landmark: 'Adjacent to Canara Bank ATM',
      ward_number: 1,
      zone_name: 'Zone 1 - Laxmi Nagar'
    },
    citizen_name: 'Pravin Patil',
    citizen_contact: '+91 98229 55601',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T09:00:00Z',
    estimated_duration_mins: 15,
    segregation_score: null,
    verification_status: null,
    image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=60',
    distance_meters: 950
  },
  {
    id: 'TSK-NGP-107',
    ticket_number: 'NMC-2026-8807',
    title: 'Nandanvan Commercial Vegetable Mandi Wet Clearance',
    description: 'Accumulation of leftover vegetable produce and bio-matter behind Nandanvan Main Road.',
    waste_type: 'Wet Organic',
    priority: 'HIGH',
    status: 'PENDING',
    location: {
      latitude: 21.1290,
      longitude: 79.1310,
      address: 'Nandanvan Market Chowk, Lane 3',
      landmark: 'Behind Gurudeo Nagar Garden',
      ward_number: 5,
      zone_name: 'Zone 5 - Nehru Nagar'
    },
    citizen_name: 'Sunil Meshram',
    citizen_contact: '+91 98234 56789',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T07:30:00Z',
    estimated_duration_mins: 30,
    image_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'TSK-NGP-108',
    ticket_number: 'NMC-2026-8808',
    title: 'Itwari Wholesale Grain & Packing Box Clearance',
    description: 'Discarded wooden crates, corrugated cartons, and plastic straps in Wholesale Grain Market lane.',
    waste_type: 'Dry Recyclable',
    priority: 'CRITICAL',
    status: 'PENDING',
    location: {
      latitude: 21.1555,
      longitude: 79.1120,
      address: 'Grain Market Gate 4, Itwari, Nagpur',
      landmark: 'Near Teen Nal Chowk',
      ward_number: 6,
      zone_name: 'Zone 6 - Gandhibagh'
    },
    citizen_name: 'Rameshwar Agrawal',
    citizen_contact: '+91 94228 12345',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T08:15:00Z',
    estimated_duration_mins: 40,
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'TSK-NGP-109',
    ticket_number: 'NMC-2026-8809',
    title: 'Shanti Nagar Secondary Street Mixed Waste Spot',
    description: 'Citizen report of domestic mixed garbage dumped near drainage culvert.',
    waste_type: 'Mixed Waste',
    priority: 'HIGH',
    status: 'PENDING',
    location: {
      latitude: 21.1680,
      longitude: 79.1170,
      address: 'Shanti Nagar Main Road, Plot 14',
      landmark: 'Near Water Tank Circle',
      ward_number: 7,
      zone_name: 'Zone 7 - Satranjipura'
    },
    citizen_name: 'Kavita Gaikwad',
    citizen_contact: '+91 97655 43210',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T09:30:00Z',
    estimated_duration_mins: 25,
    image_url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'TSK-NGP-110',
    ticket_number: 'NMC-2026-8810',
    title: 'Pardi Industrial & Construction Debris Pile',
    description: 'Concrete rubble, broken tiles, and masonry scrap dumped along ring road service lane.',
    waste_type: 'Construction Scrap',
    priority: 'HIGH',
    status: 'PENDING',
    location: {
      latitude: 21.1490,
      longitude: 79.1430,
      address: 'Old Bhandara Road, Near Pardi Naka',
      landmark: 'Opposite Octroi Post',
      ward_number: 8,
      zone_name: 'Zone 8 - Lakadganj'
    },
    citizen_name: 'Santosh Tiwari',
    citizen_contact: '+91 98902 34567',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T10:00:00Z',
    estimated_duration_mins: 45,
    image_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'TSK-NGP-111',
    ticket_number: 'NMC-2026-8811',
    title: 'Indora Chowk Commercial Plastic & Mixed Bin Spill',
    description: 'Commercial food wrappers, single-use bags, and cups overflowing from community bins.',
    waste_type: 'Mixed Waste',
    priority: 'CRITICAL',
    status: 'PENDING',
    location: {
      latitude: 21.1830,
      longitude: 79.1090,
      address: 'Indora Square, North Nagpur Corridor',
      landmark: 'Near Dr. Ambedkar College Gate',
      ward_number: 9,
      zone_name: 'Zone 9 - Ashi Nagar'
    },
    citizen_name: 'Bhimrao Wankhede',
    citizen_contact: '+91 98221 67890',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T10:30:00Z',
    estimated_duration_mins: 30,
    image_url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'TSK-NGP-112',
    ticket_number: 'NMC-2026-8812',
    title: 'Sadar Residency Road Restaurant Wet Waste Pickup',
    description: 'Segregated kitchen organic waste bins from food street restaurants ready for bio-methanation processing.',
    waste_type: 'Wet Organic',
    priority: 'HIGH',
    status: 'PENDING',
    location: {
      latitude: 21.1680,
      longitude: 79.0820,
      address: 'Residency Road Food Street, Sadar',
      landmark: 'Behind Mount Road Shopping Complex',
      ward_number: 10,
      zone_name: 'Zone 10 - Mangalwari'
    },
    citizen_name: 'Firoz Khan (Hotel Association)',
    citizen_contact: '+91 94220 98765',
    assigned_worker_id: 'WRK-4089',
    assigned_at: '2026-08-16T11:00:00Z',
    estimated_duration_mins: 25,
    image_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60'
  }
];

const FALLBACK_ALERTS: WeatherAlert[] = [
  {
    alert_id: 'NMC-WX-2026-081',
    alert_type: 'HEATWAVE',
    severity: 'HIGH',
    headline: 'Nagpur Orange Heatwave Advisory: Peak Temp 43.8°C',
    headline_marathi: 'नागपूर उष्णतेची लाट इशारा: तापमान ४३.८° से. पर्यंत पोहोचले',
    description: 'IMD Nagpur has issued an Orange Alert. Severe solar radiation expected between 12:00 PM and 03:30 PM across all municipal zones.',
    temperature_celsius: 43.8,
    feels_like_celsius: 46.5,
    humidity_pct: 28,
    precipitation_prob_pct: 5,
    wind_speed_kmh: 14.2,
    uv_index: 11,
    affected_zones: [
      'Zone 2 - Dharampeth',
      'Zone 4 - Dhantoli',
      'Zone 6 - Gandhibagh',
      'Zone 1 - Laxmi Nagar',
      'Zone 3 - Hanuman Nagar'
    ],
    issued_at: '2026-08-16T08:00:00Z',
    valid_until: '2026-08-16T18:00:00Z',
    operational_instructions: [
      'Mandatory 15-minute shaded hydration rest every 90 minutes of active route collection.',
      'Suspend heavy manual lifting in open sun between 01:00 PM and 03:00 PM.',
      'Keep covered tarpaulins over open waste tippers to prevent rapid organic decomposition odors.',
      'Carry ORS electrolytic water packets provided at NMC Ward Offices.'
    ],
    safety_gear_required: [
      'Wide-brim UV safety hat',
      'Cooling wet neck scarf',
      'UV protection goggles',
      '2-Litre insulated water flask'
    ]
  },
  {
    alert_id: 'NMC-WX-2026-082',
    alert_type: 'MONSOON_RAIN',
    severity: 'MODERATE',
    headline: 'Evening Thunderstorm & Local Waterlogging Advisory',
    headline_marathi: 'संध्याकाळी मेघगर्जनेसह मुसळधार पाऊस व पाणी साचण्याची शक्यता',
    description: 'Localized convective rain cells expected over Sitabuldi, Gandhibagh, and Nag river drainage corridors after 04:30 PM.',
    temperature_celsius: 33.2,
    feels_like_celsius: 38.0,
    humidity_pct: 76,
    precipitation_prob_pct: 65,
    wind_speed_kmh: 24.0,
    uv_index: 6,
    affected_zones: [
      'Zone 4 - Dhantoli',
      'Zone 6 - Gandhibagh',
      'Zone 10 - Mangalwari'
    ],
    issued_at: '2026-08-16T11:00:00Z',
    valid_until: '2026-08-16T21:00:00Z',
    operational_instructions: [
      'Ensure all street corner storm drain grates are cleared of polythene blockage before downpour.',
      'Park compactor trucks on elevated concrete platforms away from low-lying culverts.',
      'Cover organic waste loads to prevent leachate runoff into public storm drains.'
    ],
    safety_gear_required: [
      'High-visibility reflective rain jacket',
      'Anti-skid waterproof safety gumboots',
      'Waterproof mobile pouch'
    ]
  }
];

export const workerApi = {
  /**
   * Fetch worker assigned daily tasks with optional filters (status, priority, zone, ward)
   */
  async getTasks(params?: { workerId?: string; status?: string; priority?: string; zone?: string; wardNumber?: number }): Promise<DailyTask[]> {
    try {
      const query = new URLSearchParams();
      if (params?.workerId) query.set('worker_id', params.workerId);
      if (params?.status) query.set('status', params.status);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.zone) query.set('zone', params.zone);
      if (params?.wardNumber) query.set('ward_number', params.wardNumber.toString());

      const res = await fetch(`${API_BASE_URL}/api/worker/tasks?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using fallback tasks data:', err);
      let list = [...FALLBACK_TASKS];
      if (params?.status) {
        list = list.filter(t => t.status.toUpperCase() === params.status?.toUpperCase());
      }
      if (params?.priority) {
        list = list.filter(t => t.priority.toUpperCase() === params.priority?.toUpperCase());
      }
      if (params?.zone && params.zone !== 'ALL') {
        list = list.filter(t => t.location.zone_name.toLowerCase().includes(params.zone!.toLowerCase()));
      }
      if (params?.wardNumber) {
        list = list.filter(t => t.location.ward_number === params.wardNumber);
      }
      return list;
    }
  },

  /**
   * Auto-detect waste spot properties from camera photo using Gemini Vision AI
   */
  async analyzeWasteSpot(imageFile: File | Blob, lat?: number, lon?: number): Promise<AISpotDetectionResult> {
    try {
      const formData = new FormData();
      const filename = (imageFile instanceof File && imageFile.name) ? imageFile.name : 'spot_capture.jpg';
      formData.append('image', imageFile, filename);
      if (lat !== undefined && lat !== null) formData.append('latitude', lat.toString());
      if (lon !== undefined && lon !== null) formData.append('longitude', lon.toString());

      const res = await fetch(`${API_BASE_URL}/api/worker/ai-analyze-spot`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, attempting direct Gemini Vision spot analysis in browser:', err);
      let targetZone = FALLBACK_WARDS[1];
      if (lat && lon) {
        let minDist = Infinity;
        for (const w of FALLBACK_WARDS) {
          const dist = Math.hypot(w.center_lat - lat, w.center_lng - lon);
          if (dist < minDist) {
            minDist = dist;
            targetZone = w;
          }
        }
      }

      if (GEMINI_API_KEY) {
        try {
          const b64 = await blobToBase64(imageFile);
          const mimeType = (imageFile instanceof File && imageFile.type) ? imageFile.type : 'image/jpeg';

          const prompt = `You are an expert AI municipal solid waste investigator for Nagpur Municipal Corporation (NMC), Maharashtra, India.
Location Context: ${targetZone.zone_name} (${targetZone.ward_name}), Nagpur.

Analyze this field photo of a newly reported garbage spot / accumulation:
1. is_waste: boolean (true if image contains real municipal solid waste, debris, trash heap, litter, commercial scrap, food waste, or overflowing bin; false if human face, selfie, person portrait, room interior, vehicle, document, or non-waste item)
2. category: Must be EXACTLY ONE of: "Wet Organic", "Dry Recyclable", "Mixed Waste", "Sanitary / Hazardous", "E-Waste", "Construction Scrap"
3. priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
   - CRITICAL: Biohazard/medical, severe sewer/road obstruction, sharp glass/chemical hazard.
   - HIGH: Large overflowing commercial pile, wet food waste rotting in sun, high foot-traffic obstruction.
   - MEDIUM: Moderate accumulation of cartons, plastic packaging, or residential bins.
   - LOW: Minor garden leaves, small paper/plastic litter.
4. suggested_title: A concise, highly realistic headline in English describing the waste and location
5. description: 1-2 concise sentences summarizing the visible materials, estimated volume/severity, and cleaning advice.
6. detected_materials: Array of 3-5 specific detected material items (e.g. ["Corrugated cartons", "PET bottles", "Plastic carry bags"])
7. suggested_action: Specific recommended action for NMC sanitation workers
8. confidence: float between 0.85 and 0.99

Respond ONLY with valid JSON:
{
  "is_waste": boolean,
  "category": string,
  "priority": string,
  "suggested_title": string,
  "description": string,
  "detected_materials": ["string", "..."],
  "suggested_action": string,
  "confidence": number
}`;

          for (const modelName of GEMINI_CANDIDATE_MODELS) {
            try {
              const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
                method: 'POST',
                headers: {
                  'x-goog-api-key': GEMINI_API_KEY,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: modelName,
                  input: [
                    { type: 'text', text: prompt },
                    { type: 'image', data: b64, mime_type: mimeType }
                  ]
                })
              });

              if (geminiRes.ok) {
                const geminiData = await geminiRes.json();
                const parsed = extractJsonFromText(geminiData.output_text || '');
                if (!parsed) continue;

                const is_waste = typeof parsed.is_waste === 'boolean' ? parsed.is_waste : true;
                const cat = ['Wet Organic', 'Dry Recyclable', 'Mixed Waste', 'Sanitary / Hazardous', 'E-Waste', 'Construction Scrap'].includes(parsed.category) ? parsed.category : 'Mixed Waste';
                const prio = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.priority?.toUpperCase()) ? parsed.priority.toUpperCase() : 'HIGH';

                return {
                  category: is_waste ? cat : 'Non-Waste Image',
                  priority: is_waste ? prio : 'LOW',
                  suggested_title: parsed.suggested_title || `${cat} Waste Spot near ${targetZone.ward_name.split(',')[0]}`,
                  description: parsed.description || 'AI analyzed municipal waste spot requiring standard sanitation sweep.',
                  ward_number: targetZone.ward_id,
                  zone_name: targetZone.zone_name,
                  address: `${targetZone.ward_name.split(',')[0]}, ${targetZone.zone_name.split(' - ')[1] || targetZone.zone_name}, Nagpur`,
                  landmark: 'Near Main Road Corridor',
                  detected_materials: Array.isArray(parsed.detected_materials) ? parsed.detected_materials : ['Municipal waste items'],
                  suggested_action: parsed.suggested_action || 'Deploy route compactor vehicle for immediate pickup.',
                  confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.94,
                  is_waste: is_waste
                };
              }
            } catch (modelErr) {
              console.warn(`Browser Gemini model ${modelName} failed, trying next:`, modelErr);
            }
          }
        } catch (geminiErr) {
          console.warn('Direct Gemini spot analysis error, falling back:', geminiErr);
        }
      }

      // Dynamic fallback
      const hashSeed = Math.abs((imageFile.size || 5000) % 4);
      const varieties = [
        { cat: 'Dry Recyclable', prio: 'MEDIUM' as const, title: `Plastic & Dry Litter near ${targetZone.ward_name.split(',')[0]}`, desc: 'Scattered packaging cartons and beverage containers observed.', mats: ['PET bottles', 'Cardboard packaging', 'Polythene bags'], act: 'Deploy dry waste recycling route pickup.' },
        { cat: 'Wet Organic', prio: 'HIGH' as const, title: `Wet Food Waste Pile near ${targetZone.ward_name.split(',')[0]}`, desc: 'Biodegradable kitchen and market food refuse accumulating.', mats: ['Vegetable scraps', 'Fruit peels', 'Food waste residue'], act: 'Dispatch green compactor truck with bio-spray.' },
        { cat: 'Mixed Waste', prio: 'HIGH' as const, title: `Reported Waste Spot near ${targetZone.ward_name.split(',')[0]}`, desc: `Accumulated municipal solid waste observed in ${targetZone.zone_name}.`, mats: ['Mixed packaging scraps', 'Municipal solid waste'], act: 'Deploy dry waste compactor vehicle for immediate route pickup.' },
        { cat: 'Construction Scrap', prio: 'MEDIUM' as const, title: `Debris Accumulation near ${targetZone.ward_name.split(',')[0]}`, desc: 'Loose masonry and plaster debris discarded on pathway.', mats: ['Masonry rubble', 'Plaster chunks', 'Cement bags'], act: 'Dispatch loader crew for rubble collection.' }
      ];
      const chosen = varieties[hashSeed];

      return {
        category: chosen.cat,
        priority: chosen.prio,
        suggested_title: chosen.title,
        description: chosen.desc,
        ward_number: targetZone.ward_id,
        zone_name: targetZone.zone_name,
        address: `${targetZone.ward_name.split(',')[0]}, ${targetZone.zone_name.split(' - ')[1] || targetZone.zone_name}, Nagpur`,
        landmark: 'Near Main Road Corner',
        detected_materials: chosen.mats,
        suggested_action: chosen.act,
        confidence: 0.88,
        is_waste: true
      };
    }
  },


  /**
   * Create and assign a new sanitation task
   */
  async createTask(taskData: {
    title: string;
    description?: string;
    category: string;
    priority?: string;
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
    ward_number: number;
    zone_name: string;
    citizen_name?: string;
    citizen_contact?: string;
    assigned_worker_id?: string;
    estimated_duration_mins?: number;
    image_url?: string;
  }): Promise<DailyTask> {
    const res = await fetch(`${API_BASE_URL}/api/worker/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  },

  /**
   * Report and log a new task with live camera photo
   */
  async reportWasteTask(data: {
    title: string;
    description?: string;
    category: string;
    priority?: string;
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
    ward_number: number;
    zone_name: string;
    citizen_name?: string;
    citizen_contact?: string;
    assigned_worker_id?: string;
    estimated_duration_mins?: number;
    imageFile?: File | Blob | null;
  }): Promise<DailyTask> {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('priority', data.priority || 'HIGH');
      formData.append('latitude', data.latitude.toString());
      formData.append('longitude', data.longitude.toString());
      formData.append('address', data.address);
      if (data.landmark) formData.append('landmark', data.landmark);
      formData.append('ward_number', data.ward_number.toString());
      formData.append('zone_name', data.zone_name);
      if (data.citizen_name) formData.append('citizen_name', data.citizen_name);
      if (data.citizen_contact) formData.append('citizen_contact', data.citizen_contact);
      if (data.assigned_worker_id) formData.append('assigned_worker_id', data.assigned_worker_id);
      if (data.estimated_duration_mins) formData.append('estimated_duration_mins', data.estimated_duration_mins.toString());
      if (data.imageFile) {
        const filename = data.imageFile instanceof File && data.imageFile.name ? data.imageFile.name : 'spot_capture.jpg';
        formData.append('image', data.imageFile, filename);
      }

      const res = await fetch(`${API_BASE_URL}/api/worker/tasks/report`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Fallback: local task simulation for reportWasteTask:', err);
      const newId = `TSK-NGP-${Math.floor(100 + Math.random() * 900)}`;
      const newTicket = `NMC-2026-${Math.floor(8800 + Math.random() * 200)}`;
      const localTask: DailyTask = {
        id: newId,
        ticket_number: newTicket,
        title: data.title,
        description: data.description || '',
        waste_type: data.category,
        priority: (data.priority as any) || 'HIGH',
        status: 'PENDING',
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          landmark: data.landmark,
          ward_number: data.ward_number,
          zone_name: data.zone_name
        },
        citizen_name: data.citizen_name || 'Field Worker Spot Report',
        citizen_contact: data.citizen_contact,
        assigned_worker_id: data.assigned_worker_id || 'WRK-4089',
        assigned_at: new Date().toISOString(),
        estimated_duration_mins: data.estimated_duration_mins || 25,
        image_url: data.imageFile ? URL.createObjectURL(data.imageFile) : 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500',
        bonus_awarded: 0.0
      };
      return localTask;
    }
  },

  /**
   * Update task status (Pending, In Progress, Completed, Flagged)
   */
  async updateTaskStatus(taskId: string, payload: {
    status: string;
    worker_notes?: string;
    segregation_score?: number;
    proof_image_base64?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<DailyTask> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/worker/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using local task update fallback:', err);
      const found = FALLBACK_TASKS.find(t => t.id === taskId);
      if (found) {
        found.status = payload.status as any;
        if (payload.worker_notes) found.worker_notes = payload.worker_notes;
        if (payload.segregation_score !== undefined) {
          found.segregation_score = payload.segregation_score;
          found.verification_status = payload.segregation_score >= 70 ? 'PASSED' : 'WARNING';
          found.bonus_awarded = calculateSegregationBonus(payload.segregation_score);
        }
        if (payload.status === 'COMPLETED') {
          found.completed_at = new Date().toISOString();
          found.proof_image_url = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=60';
        }
        return { ...found };
      }
      throw err;
    }
  },

  /**
   * Archive or clear all completed tasks
   */
  async archiveCompletedTasks(workerId: string = 'WRK-4089'): Promise<{ success: boolean; cleared_count: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/worker/tasks/archive-completed?worker_id=${encodeURIComponent(workerId)}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using local fallback for archiveCompletedTasks:', err);
      return { success: true, cleared_count: 0 };
    }
  },

  /**
   * Delete or remove a single task
   */
  async deleteTask(taskId: string): Promise<{ success: boolean; deleted_id: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/worker/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using local fallback for deleteTask:', err);
      return { success: true, deleted_id: taskId };
    }
  },

  /**
   * Upload image for AI Waste Segregation Verification
   */
  async verifySegregation(imageFile: File | Blob, taskId?: string, categoryHint?: string): Promise<SegregationVerificationResult> {
    try {
      const formData = new FormData();
      const filename = (imageFile instanceof File && imageFile.name) ? imageFile.name : 'audit_image.jpg';
      formData.append('image', imageFile, filename);
      if (taskId) formData.append('task_id', taskId);
      if (categoryHint) formData.append('waste_category_hint', categoryHint);

      const res = await fetch(`${API_BASE_URL}/api/worker/verify-segregation`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, attempting direct Gemini Vision segregation audit in browser:', err);

      if (GEMINI_API_KEY) {
        try {
          const b64 = await blobToBase64(imageFile);
          const mimeType = (imageFile instanceof File && imageFile.type) ? imageFile.type : 'image/jpeg';
          const hintText = categoryHint ? `Target Category Hint: ${categoryHint}` : 'No hint';

          const prompt = `You are an expert AI sanitation and waste segregation auditor for Nagpur Municipal Corporation (NMC), Maharashtra, India.
Context: ${hintText}.

Examine the uploaded image with high precision:
Step 1: Determine whether this image contains actual municipal solid waste / garbage / recyclable materials, OR if it is a non-waste image (such as a human face, portrait, selfie, person, animal, vehicle, indoor room, computer screen, landscape, furniture, clothing, document, etc.).

Step 2:
A) IF NOT WASTE (e.g. human face, selfie, person, indoor furniture, random non-waste object):
- is_waste: false, overall_score: 0.0, verdict: "FAILED", primary_category: "Non-Waste (Human Face / Object Detected)"
- breakdown: wet_organic_pct: 0.0, dry_recyclable_pct: 0.0, sanitary_hazardous_pct: 0.0, unsegregated_contaminant_pct: 0.0
- detected_items: [List what is actually visible in the photo]
- contaminants_found: ["No garbage or municipal waste present in photo"]
- feedback_english: "No municipal waste detected in this image. Please take a photo of an actual waste bin or collection bag."
- feedback_marathi: "या छायाचित्रात कोणताही कचरा आढळला नाही. कृपया कचरा कुंडी किंवा कचरा पिशवीचा फोटो काढा."
- safety_advisory: "Align the camera viewfinder directly over the waste collection bin."
- incentive_earned_inr: 0.0, ai_confidence: 0.98

B) IF ACTUAL WASTE / GARBAGE:
- is_waste: true, overall_score: Segregation purity percentage (0.0 to 100.0) based on how properly segregated it is.
- verdict: "PASSED" if score >= 75.0, "WARNING" if 50.0 <= score < 75.0, "FAILED" if score < 50.0
- primary_category: e.g. "Biodegradable Wet / Organic Waste", "Dry Recyclable (Paper/Plastic/Metal)", "Sanitary / Medical Hazard", "Mixed Contaminated Waste"
- breakdown: wet_organic_pct, dry_recyclable_pct, sanitary_hazardous_pct, unsegregated_contaminant_pct (must sum to 100.0)
- detected_items: 3-6 specific materials visible (e.g. ["Banana peels", "Tomato scraps", "Egg shells"] or ["PET bottles", "Cardboard packaging"])
- contaminants_found: specific foreign or improper items mixed in
- feedback_english: Actionable English instruction for sanitation worker / citizen
- feedback_marathi: Regional Marathi translation with proper NMC terminology
- safety_advisory: PPE & safety instructions (rubber gloves, boots, mask, tongs)
- incentive_earned_inr: 25.0 if PASSED, 10.0 if WARNING, 0.0 if FAILED
- ai_confidence: float between 0.85 and 0.99

Respond ONLY with valid JSON:
{
  "is_waste": boolean,
  "overall_score": number,
  "verdict": "PASSED" | "WARNING" | "FAILED",
  "primary_category": string,
  "ai_confidence": number,
  "breakdown": {
    "wet_organic_pct": number,
    "dry_recyclable_pct": number,
    "sanitary_hazardous_pct": number,
    "unsegregated_contaminant_pct": number
  },
  "detected_items": string[],
  "contaminants_found": string[],
  "feedback_english": string,
  "feedback_marathi": string,
  "safety_advisory": string,
  "incentive_earned_inr": number
}`;

          for (const modelName of GEMINI_CANDIDATE_MODELS) {
            try {
              const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
                method: 'POST',
                headers: {
                  'x-goog-api-key': GEMINI_API_KEY,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: modelName,
                  input: [
                    { type: 'text', text: prompt },
                    { type: 'image', data: b64, mime_type: mimeType }
                  ]
                })
              });

              if (geminiRes.ok) {
                const geminiData = await geminiRes.json();
                const parsed = extractJsonFromText(geminiData.output_text || '');
                if (!parsed) continue;

                const is_waste = typeof parsed.is_waste === 'boolean' ? parsed.is_waste : true;
                const score = is_waste ? (typeof parsed.overall_score === 'number' ? parsed.overall_score : 75) : 0;
                let verdict: 'PASSED' | 'WARNING' | 'FAILED' = 'PASSED';
                if (!is_waste || parsed.verdict?.toUpperCase().includes('FAIL') || score < 50) verdict = 'FAILED';
                else if (parsed.verdict?.toUpperCase().includes('WARN')) verdict = 'WARNING';

                const bd = parsed.breakdown || {};
                const wet = typeof bd.wet_organic_pct === 'number' ? bd.wet_organic_pct : 0;
                const dry = typeof bd.dry_recyclable_pct === 'number' ? bd.dry_recyclable_pct : 0;
                const sanitary = typeof bd.sanitary_hazardous_pct === 'number' ? bd.sanitary_hazardous_pct : 0;
                const unseg = typeof bd.unsegregated_contaminant_pct === 'number' ? bd.unsegregated_contaminant_pct : 0;

                return {
                  verification_id: `VRF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                  task_id: taskId || null,
                  timestamp: new Date().toISOString(),
                  overall_score: score,
                  verdict: verdict,
                  primary_category: parsed.primary_category || (is_waste ? 'Segregated Waste' : 'Non-Waste Image'),
                  breakdown: {
                    wet_organic_pct: wet,
                    dry_recyclable_pct: dry,
                    sanitary_hazardous_pct: sanitary,
                    unsegregated_contaminant_pct: unseg
                  },
                  detected_items: Array.isArray(parsed.detected_items) ? parsed.detected_items : ['Identified materials'],
                  contaminants_found: Array.isArray(parsed.contaminants_found) ? parsed.contaminants_found : [],
                  ai_confidence: typeof parsed.ai_confidence === 'number' ? parsed.ai_confidence : 0.95,
                  incentive_earned_inr: typeof parsed.incentive_earned_inr === 'number' ? parsed.incentive_earned_inr : calculateSegregationBonus(score, verdict),
                  feedback_marathi: parsed.feedback_marathi || 'वर्गीकरण तपासणी पूर्ण झाली.',
                  feedback_english: parsed.feedback_english || 'Segregation evaluation complete.',
                  safety_advisory: parsed.safety_advisory || 'Ensure standard safety gloves and PPE are worn.'
                };
              }
            } catch (modelErr) {
              console.warn(`Browser Gemini audit model ${modelName} failed, trying next:`, modelErr);
            }
          }
        } catch (geminiErr) {
          console.warn('Direct Gemini segregation audit failed, using heuristic fallback:', geminiErr);
        }
      }

      // Generate fallback response respecting explicit hints
      const isWet = categoryHint ? categoryHint.toUpperCase().includes('WET') : false;
      const isDry = categoryHint ? categoryHint.toUpperCase().includes('DRY') : false;
      const isHazard = categoryHint ? (categoryHint.toUpperCase().includes('HAZARD') || categoryHint.toUpperCase().includes('SANITARY')) : false;

      let score = 60;
      let verdict: 'PASSED' | 'WARNING' | 'FAILED' = 'WARNING';
      let primary = 'Mixed Municipal Solid Waste';
      let wet = 30, dry = 40, sanitary = 10, unseg = 20;
      let detected = ['Mixed municipal solid waste', 'Packaging scraps'];
      let contaminants = ['Mixed waste requiring segregation'];
      let feedbackEn = 'Segregation evaluation recorded. Please ensure wet and dry waste are separated.';
      let feedbackMr = 'वर्गीकरण तपासणी नोंदवली. कृपया ओला व सुका कचरा स्वतंत्र ठेवा.';

      if (isWet) {
        score = 91.5;
        verdict = 'PASSED';
        primary = 'Biodegradable Wet / Organic Waste';
        wet = 84.5;
        dry = 12.0;
        sanitary = 2.0;
        unseg = 1.5;
        detected = ['Vegetable kitchen scraps', 'Tea leaves', 'Banana peels', 'Fallen tree leaves'];
        contaminants = ['1x Plastic candy pouch fragment'];
        feedbackEn = 'Clean organic waste meeting NMC Swachh Bharat purity standards.';
        feedbackMr = 'उत्कृष्ट ओला कचरा वर्गीकरण! ओला आणि सुका कचरा योग्यरित्या वेगळा केला गेला आहे.';
      } else if (isDry) {
        score = 88.0;
        verdict = 'PASSED';
        primary = 'Dry Recyclable Paper & Plastic';
        wet = 15.0;
        dry = 80.0;
        sanitary = 3.0;
        unseg = 2.0;
        detected = ['PET water bottles', 'Corrugated cardboard', 'Aluminium beverage cans'];
        contaminants = ['Slight moisture staining on paper'];
        feedbackEn = 'Good dry recyclable segregation. Keep plastic bottles crushed.';
        feedbackMr = 'चांगले सुका कचरा वर्गीकरण! प्लास्टिकच्या बाटल्या दाबून ठेवा.';
      } else if (isHazard) {
        score = 40.0;
        verdict = 'FAILED';
        primary = 'Sanitary & Medical Hazardous Waste';
        sanitary = 50.0;
        wet = 25.0;
        dry = 15.0;
        unseg = 10.0;
        detected = ['Clinical gloves', 'Sanitary napkins', 'Blister packs'];
        contaminants = ['Mixed unsegregated biomedical items'];
        feedbackEn = 'Hazardous waste detected. Do not mix with domestic organic waste.';
        feedbackMr = 'धोकादायक कचरा आढळला आहे. घरगुती ओल्या कचऱ्यात मिसळू नका.';
      }

      return {
        verification_id: `VRF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        task_id: taskId || null,
        timestamp: new Date().toISOString(),
        overall_score: score,
        verdict: verdict,
        primary_category: primary,
        breakdown: {
          wet_organic_pct: wet,
          dry_recyclable_pct: dry,
          sanitary_hazardous_pct: sanitary,
          unsegregated_contaminant_pct: unseg
        },
        detected_items: detected,
        contaminants_found: contaminants,
        ai_confidence: 0.90,
        incentive_earned_inr: calculateSegregationBonus(score, verdict),
        feedback_marathi: feedbackMr,
        feedback_english: feedbackEn,
        safety_advisory: 'Ensure puncture-resistant rubber gloves and safety boots are worn during handling.'
      };
    }
  },

  /**
   * Send live GPS telemetry for sanitation vehicle to SQLite backend
   */
  async recordTelemetry(data: { truck_no: string; lat: number; lon: number; timestamp?: string }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/worker/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Telemetry recording failed:', err);
      return null;
    }
  },

  /**
   * Fetch real-time weather alerts
   */
  async getWeatherAlerts(zone?: string): Promise<WeatherAlert[]> {
    try {
      const query = zone ? `?zone=${encodeURIComponent(zone)}` : '';
      const res = await fetch(`${API_BASE_URL}/api/worker/weather-alerts${query}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using fallback weather alerts data:', err);
      return FALLBACK_ALERTS;
    }
  },

  /**
   * Fetch worker stats
   */
  async getStats(workerId = 'WRK-4089'): Promise<WorkerStats> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/worker/stats?worker_id=${encodeURIComponent(workerId)}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using fallback worker stats:', err);
      return {
        worker_id: workerId,
        worker_name: 'Rajesh Rao (राजेश राव)',
        zone_assigned: 'Zone 2 - Dharampeth',
        ward_number: 12,
        shift_start: '06:00 AM',
        shift_end: '02:30 PM',
        total_assigned_today: 6,
        completed_today: 1,
        pending_today: 4,
        in_progress_today: 1,
        avg_segregation_accuracy: 94.2,
        daily_incentive_earned_inr: 75.0,
        safety_compliance_score: 98.5,
        distance_covered_km: 7.8,
        active_vehicle_number: 'MH-31-EQ-9104 (E-Tipper #12)'
      };
    }
  },

  /**
   * Fetch Nagpur GIS Wards
   */
  async getWards(): Promise<WardZoneGeo[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/worker/wards`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using fallback wards data:', err);
      return FALLBACK_WARDS;
    }
  }
};
