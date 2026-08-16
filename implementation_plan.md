# Implementation Plan - Nagpur SmartSanitation Worker Module

We will implement the complete Sanitation Worker backend and mobile-first frontend module for the **Nagpur SmartSanitation** platform under strict project boundaries:
- Backend: `/backend/routers/worker.py`
- Frontend: `/frontend/src/modules/worker/`

---

## User Review Required

> [!IMPORTANT]
> - All backend logic will reside strictly in `backend/routers/worker.py` mounting on `APIRouter(prefix="/api/worker")`.
> - Safe import of DB models `User` and `Complaint` from `../models/schema.py` will be implemented with fallbacks so concurrent development on `schema.py` does not break runtime.
> - Frontend will export a single `WorkerDashboard` component from `frontend/src/modules/worker/WorkerDashboard.tsx` and `index.ts`.
> - Leaflet GIS map will load dynamically with full Nagpur ward boundaries (Dharampeth, Dhantoli, Gandhibagh, Mangalwari, Laxmi Nagar, etc.) and complaint geo-coordinates without requiring extra external npm dependencies.

---

## Proposed Changes

### 1. Backend: `/backend/routers/worker.py`

#### [MODIFY] [worker.py](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/backend/routers/worker.py)
We will implement the following endpoints with full Pydantic models, mock/database integration, and comprehensive documentation:
1. `GET /api/worker/tasks` (Daily assigned tasks and citizen complaints with filters by `worker_id`, `ward_zone`, `status`, `priority`).
2. `GET /api/worker/tasks/{task_id}` (Detailed view of a single task with location coordinates, citizen details, timeline).
3. `PATCH /api/worker/tasks/{task_id}/status` (Update task status: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FLAGGED`, `RESEGREGATED` with remarks & GPS proof).
4. `POST /api/worker/verify-segregation` (AI segregation verification endpoint accepting waste photo upload; analyzes wet vs dry vs hazardous segregation %, gives confidence score, contamination breakdown, and validation badge).
5. `GET /api/worker/weather-alerts` (Real-time Nagpur weather advisories from IMD/NMC mock API - extreme heatwave, monsoon waterlogging alerts, UV advisory, operational safety SOPs).
6. `GET /api/worker/stats` (Daily worker metrics: bins cleared, segregation accuracy %, incentives earned, safety score).
7. `GET /api/worker/wards` (Nagpur sanitation wards/zones coordinates and boundaries for GIS layer).

---

### 2. Frontend: `/frontend/src/modules/worker/`

#### [NEW] [types.ts](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/frontend/src/modules/worker/types.ts)
- TypeScript interfaces for `DailyTask`, `ComplaintMarker`, `WeatherAlert`, `SegregationVerificationResult`, `WorkerProfile`, `WardZoneGeo`.

#### [NEW] [api.ts](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/frontend/src/modules/worker/api.ts)
- Resilient client service calling `/api/worker/*` endpoints with smart offline/fallback data for flawless demonstration.

#### [NEW] [WeatherAlertBanner.tsx](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/frontend/src/modules/worker/components/WeatherAlertBanner.tsx)
- Push-style animated banner system for Rain / Extreme Heat / Storm alerts.
- Expandable safety directive drawer (e.g. hydration break, rain gear, organic waste coverage).
- Visual urgency indicators and one-tap acknowledge button.

#### [NEW] [GISWardMap.tsx](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/frontend/src/modules/worker/components/GISWardMap.tsx)
- Mobile-optimized Leaflet GIS map centered on Nagpur (`21.1458° N, 79.0882° E`).
- Ward polygons with color coding for Nagpur Zones (Dharampeth, Dhantoli, Sitabuldi, Gandhibagh, Mangalwari).
- Interactive pins for assigned complaints & smart bins with priority badges and quick-action popups.
- Polyline route optimization overlay simulating worker collection route and live GPS locator.

#### [NEW] [SegregationModal.tsx](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/frontend/src/modules/worker/components/SegregationModal.tsx)
- AI Image verification interface with live preview, preset sample bins (Wet Waste, Dry Recyclable, Mixed Contaminated), file picker / camera simulator.
- Real-time AI classification progress animation, segregation % breakdown (Wet, Dry, Hazardous, Contamination), pass/fail verdict, and instant completion hook.

#### [NEW] [TaskList.tsx](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/frontend/src/modules/worker/components/TaskList.tsx)
- Mobile-first task cards with priority badges, distance in km, time left, quick status toggle, photo previews, and Marathi/English text support.

#### [NEW] [WorkerHeader.tsx](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/frontend/src/modules/worker/components/WorkerHeader.tsx)
- Field worker profile bar (NMC Worker Badge, shift timer, Marathi/English toggle, live GPS sync indicator, daily incentive tracker).

#### [MODIFY] [WorkerDashboard.tsx](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/frontend/src/modules/worker/WorkerDashboard.tsx)
- Integrates all subcomponents into a cohesive, mobile-first responsive dashboard with bottom navigation tabs (`Tasks`, `GIS Map`, `AI Camera`, `Shift Stats`).

#### [NEW] [index.ts](file:///d:/VS%20code/Project/Nagpur-Smart-Sanitation%20(NSS)/Nagpur-Smart-Sanitation/frontend/src/modules/worker/index.ts)
- Clean re-export of `WorkerDashboard`.

---

## Verification Plan

### Automated Verification
- Python syntax & FastAPI route validation:
  ```powershell
  python -c "import sys; sys.path.append('backend'); from routers import worker; print('Worker router loaded successfully with routes:', [r.path for r in worker.router.routes])"
  ```
- Frontend build & TypeScript compilation:
  ```powershell
  cd frontend; npm run build
  ```

### Manual & Interactive Verification
- Verify weather alerts push banner with dismiss & safety SOPs.
- Verify GIS map renders Nagpur ward polygons and complaint geo-markers with popups.
- Verify AI camera image upload & waste segregation verification flow.
- Verify mobile responsiveness across viewport sizes.
