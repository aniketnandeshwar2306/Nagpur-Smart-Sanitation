// ---------------------------------------------------------------------------
// Citizen Module — API Helpers
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

export async function submitReport(data: WasteReportPayload): Promise<ReportResponse> {
  return apiFetch<ReportResponse>('/report', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchReports(): Promise<ReportResponse[]> {
  return apiFetch<ReportResponse[]>('/reports');
}

export async function fetchSchedule(): Promise<ScheduleDay[]> {
  return apiFetch<ScheduleDay[]>('/schedule');
}

export async function fetchRewards(): Promise<RewardProfile> {
  return apiFetch<RewardProfile>('/rewards');
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiFetch<LeaderboardEntry[]>('/leaderboard');
}

export async function fetchSegregationGuide(): Promise<SegregationData> {
  return apiFetch<SegregationData>('/segregation-guide');
}
