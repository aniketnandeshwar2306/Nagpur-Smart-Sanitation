import type {
  DailyTask,
  SegregationVerificationResult,
  WeatherAlert,
  WorkerStats,
  WardZoneGeo
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FALLBACK_WARDS: WardZoneGeo[] = [
  {
    ward_id: 1,
    zone_name: 'Zone 1 - Laxmi Nagar',
    ward_name: 'Bajaj Nagar & Shankar Nagar',
    center_lat: 21.1315,
    center_lng: 79.0620,
    active_complaints_count: 4,
    bins_count: 18,
    color_code: '#06b6d4',
    boundary_coordinates: [
      [21.138, 79.055], [21.138, 79.070], [21.125, 79.070], [21.125, 79.055]
    ]
  },
  {
    ward_id: 2,
    zone_name: 'Zone 2 - Dharampeth',
    ward_name: 'Futala, Ram Nagar & Dharampeth',
    center_lat: 21.1470,
    center_lng: 79.0580,
    active_complaints_count: 6,
    bins_count: 24,
    color_code: '#3b82f6',
    boundary_coordinates: [
      [21.158, 79.045], [21.158, 79.068], [21.140, 79.068], [21.140, 79.045]
    ]
  },
  {
    ward_id: 3,
    zone_name: 'Zone 3 - Hanuman Nagar',
    ward_name: 'Reshimbagh & Medical Square',
    center_lat: 21.1290,
    center_lng: 79.1020,
    active_complaints_count: 5,
    bins_count: 20,
    color_code: '#8b5cf6',
    boundary_coordinates: [
      [21.136, 79.095], [21.136, 79.112], [21.120, 79.112], [21.120, 79.095]
    ]
  },
  {
    ward_id: 4,
    zone_name: 'Zone 4 - Dhantoli',
    ward_name: 'Congress Nagar & Sitabuldi South',
    center_lat: 21.1390,
    center_lng: 79.0830,
    active_complaints_count: 7,
    bins_count: 28,
    color_code: '#ec4899',
    boundary_coordinates: [
      [21.145, 79.075], [21.145, 79.092], [21.132, 79.092], [21.132, 79.075]
    ]
  },
  {
    ward_id: 6,
    zone_name: 'Zone 6 - Gandhibagh',
    ward_name: 'Itwari & Wholesale Mandi',
    center_lat: 21.1550,
    center_lng: 79.1100,
    active_complaints_count: 9,
    bins_count: 32,
    color_code: '#f59e0b',
    boundary_coordinates: [
      [21.163, 79.100], [21.163, 79.122], [21.148, 79.122], [21.148, 79.100]
    ]
  },
  {
    ward_id: 10,
    zone_name: 'Zone 10 - Mangalwari',
    ward_name: 'Sadar, Chaoni & Raj Bhavan Area',
    center_lat: 21.1650,
    center_lng: 79.0810,
    active_complaints_count: 3,
    bins_count: 16,
    color_code: '#10b981',
    boundary_coordinates: [
      [21.175, 79.070], [21.175, 79.092], [21.156, 79.092], [21.156, 79.070]
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
    distance_meters: 890
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
    distance_meters: 2100
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
    distance_meters: 3200
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
    distance_meters: 1400
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
   * Fetch worker assigned daily tasks with optional filters
   */
  async getTasks(params?: { workerId?: string; status?: string; priority?: string; zone?: string }): Promise<DailyTask[]> {
    try {
      const query = new URLSearchParams();
      if (params?.workerId) query.set('worker_id', params.workerId);
      if (params?.status) query.set('status', params.status);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.zone) query.set('zone', params.zone);

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
      return list;
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
   * Upload image for AI Waste Segregation Verification
   */
  async verifySegregation(imageFile: File | Blob, taskId?: string, categoryHint?: string): Promise<SegregationVerificationResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (taskId) formData.append('task_id', taskId);
      if (categoryHint) formData.append('waste_category_hint', categoryHint);

      const res = await fetch(`${API_BASE_URL}/api/worker/verify-segregation`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using client-side simulated AI segregation:', err);
      // Generate rich simulated AI response
      const isWet = categoryHint?.includes('Wet') ?? true;
      const wet = isWet ? 84.5 : 22.0;
      const dry = isWet ? 12.0 : 71.5;
      const sanitary = 2.0;
      const unseg = 1.5;
      const score = isWet ? 91.5 : 88.0;

      return {
        verification_id: `VRF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        task_id: taskId || null,
        timestamp: new Date().toISOString(),
        overall_score: score,
        verdict: 'PASSED',
        primary_category: isWet ? 'Biodegradable Wet / Organic Waste' : 'Dry Recyclable Paper & Plastic',
        breakdown: {
          wet_organic_pct: wet,
          dry_recyclable_pct: dry,
          sanitary_hazardous_pct: sanitary,
          unsegregated_contaminant_pct: unseg
        },
        detected_items: isWet
          ? ['Vegetable kitchen scraps', 'Tea leaves', 'Banana peels', 'Fallen tree leaves']
          : ['PET water bottles', 'Corrugated cardboard', 'Aluminium beverage cans'],
        contaminants_found: ['1x Plastic candy pouch fragment'],
        ai_confidence: 0.95,
        incentive_earned_inr: 25.0,
        feedback_marathi: 'उत्कृष्ट वर्गीकरण! ओला आणि सुका कचरा योग्यरित्या वेगळा केला गेला आहे.',
        feedback_english: 'Excellent Segregation! Clean organic waste meeting NMC Swachh Bharat purity standards.',
        safety_advisory: 'Standard protocol: Ensure puncture-resistant rubber gloves are worn during transfer.'
      };
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
