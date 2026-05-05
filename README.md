# LeadMap Studio

LeadMap Studio is a local-first prospecting workspace that combines:

- **Strategy generation** with Gemini
- **Website audits** with scraping + PageSpeed
- **Lead search** with map-based exploration

The app is intentionally designed to remain usable even when some external variables are missing. It clearly distinguishes between:

- **ready**
- **degraded**
- **blocked**

So the UI does not lie about what is real and what is still demo-backed.

---

## Current Product State

### Modules

1. **Strategy**
   - Uses `GEMINI_API_KEY`
   - Blocked if Gemini is not configured

2. **Audit**
   - Uses `GEMINI_API_KEY`
   - Uses `PAGESPEED_API_KEY` for real performance metrics
   - Works in **degraded mode** without PageSpeed by returning estimated metrics

3. **Lead Search**
   - Uses `GOOGLE_MAPS_API_KEY` for live geocoding
   - Works in **degraded mode** with demo geocoding if Maps is not configured

### Product constraints

- **No auth**
- **No Google OAuth**
- **Local exports only**
- **No build required after changes**

---

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 6
- **Styling:** Tailwind CSS v4
- **Animation:** Motion
- **Maps:** React Leaflet + Leaflet
- **Backend:** Express + tsx
- **AI:** `@google/genai`
- **Testing:** Vitest

---

## Project Structure

```txt
src/
├── components/
│   ├── AdsRecommendations.tsx
│   ├── LeadFinder.tsx
│   └── WebsiteAnalyzer.tsx
├── hooks/
│   ├── useConfigStatus.ts
│   └── useStrategy.ts
├── lib/
│   ├── api.ts
│   ├── exportUtils.ts
│   ├── readiness.ts
│   └── readiness.test.ts
├── geminiService.ts
├── App.tsx
├── main.tsx
└── types.ts

server.ts
vite.config.ts
```

---

## Environment Variables

Copy `.env.example` into your local env file and configure what you need.

### Required for full experience

```bash
GEMINI_API_KEY=
```

### Optional but recommended

```bash
PAGESPEED_API_KEY=
GOOGLE_MAPS_API_KEY=
```

### Behavior by variable

| Variable | Purpose | If missing |
| --- | --- | --- |
| `GEMINI_API_KEY` | Strategy + semantic audit | Strategy blocked, audit blocked |
| `PAGESPEED_API_KEY` | Real Lighthouse/PageSpeed metrics | Audit degraded with estimated metrics |
| `GOOGLE_MAPS_API_KEY` | Real geocoding for lead search | Lead search degraded with demo geocoding |

---

## Scripts

```bash
npm install
npm run dev
```

### Available scripts

```bash
npm run dev        # starts Express + Vite middleware
npm run start      # starts server with tsx
npm run lint       # TypeScript check
npm test           # runs Vitest
npm run test:watch # watch mode
```

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure variables

At minimum:

```bash
GEMINI_API_KEY=your_key_here
```

### 3. Run locally

```bash
npm run dev
```

If port `3000` is busy, run on another one:

```bash
PORT=3002 npm run dev
```

---

## API Endpoints

### `GET /api/config/status`

Returns runtime readiness for the app:

- connector availability
- mode by module
- missing variables

### `GET /api/google/geocode`

- live geocoding when Maps is configured
- demo fallback when not configured

### `POST /api/analyze/performance`

- real PageSpeed metrics when configured
- estimated metrics otherwise

### `POST /api/proxy/scrape`

- server-side website scraping for audit input
- protected against localhost/private-network SSRF targets

---

## Architecture Notes

### Frontend

- `App.tsx` orchestrates top-level layout and tabs
- hooks handle stateful flows:
  - `useConfigStatus`
  - `useStrategy`
- `lib/api.ts` centralizes fetch + API error handling

### Backend

- `server.ts` serves:
  - API endpoints
  - Vite middleware in development
- runtime config is exposed explicitly to the frontend through `/api/config/status`

### UX contract

The UI must always tell the truth about the operating state:

- **ready** → real integration is active
- **degraded** → usable, but with fallback/demo behavior
- **blocked** → feature intentionally disabled until required config exists

---

## Testing

Vitest is installed and active.

Current baseline:

- readiness helper tests

Run:

```bash
npm test
```

---

## Important Project Decisions

- The app is **auth-free**
- Export flows are **local-only**
- Readiness is exposed from backend to frontend explicitly
- Demo and real modes are intentionally separated
- Type-checking is the baseline validation step

---

## Relevant Files

- `server.ts` — Express server, runtime config, API endpoints
- `src/App.tsx` — main product shell
- `src/hooks/useConfigStatus.ts` — config/readiness state
- `src/hooks/useStrategy.ts` — strategy generation flow
- `src/lib/api.ts` — shared API client layer
- `src/lib/readiness.ts` — readiness helpers
- `src/components/WebsiteAnalyzer.tsx` — audit flow
- `src/components/LeadFinder.tsx` — lead search flow

---

## What is still pending

The only meaningful blocker for the full experience is:

- **loading the environment variables**

After that, the app is ready to operate with real integrations.
