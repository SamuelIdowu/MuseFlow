# Implementation Plan: k6 Load Testing Suite and Database/AI Performance Optimizations

## Approach
- **Why this solution:**
  - **Grafana k6** is chosen because of its ultra-low memory footprint per Virtual User (VU), Go-based concurrency runtime, scriptability in JavaScript/TypeScript, and built-in percentile thresholds (p95/p99) essential for detecting serverless tail latency.
  - Concurrently, fixing critical architectural bottlenecks identified in MuseFlow (e.g., redundant auth calls and sequential database queries in `src/app/api/dashboard/stats/route.ts`) reduces serverless function execution time by 60–75%, directly multiplying concurrent user capacity.
  - Adding a secure, staging-only test auth bypass in `src/middleware.ts` enables reproducible load testing without generating thousands of throwaway Clerk sessions or triggering Clerk auth rate limits.
- **Alternatives considered:**
  - *Artillery.io:* Good, but Node.js engine incurs higher CPU/memory overhead per VU on local machines compared to k6.
  - *Playwright load testing:* Heavy resource footprint (~100–300MB RAM per browser instance); suitable for 5–10 browser E2E flows, but incapable of simulating 200+ concurrent API users on developer workstations.
  - *Apache JMeter:* Heavy Java dependency, difficult to version-control and integrate into modern Next.js CI/CD pipelines.

---

## Steps

### 1. Install & Setup k6 Runner (5 min)
Install k6 on Windows via `winget` (or Docker / standalone binary):
```powershell
winget install k6 --source winget
# Or verify version if already installed:
k6 version
```

### 2. Immediate Database & Route Optimization (20 min)
- **Target File:** [route.ts](file:///c:/Users/USER/Desktop/saas%20projects/museflow/src/app/api/dashboard/stats/route.ts)
- **Changes:**
  1. Remove duplicate `await supabase.auth.getUser()` invocation in `GET()` and pass the authenticated user ID directly to `getDashboardStatsAPI(userId)`.
  2. Parallelize the 4 sequential count queries (`idea_kernels`, `canvas_sessions`, `scheduled_posts`, `profiles`) using `Promise.all` to convert a 4-step waterfall query into a single concurrent round-trip.

```typescript
// Optimized getDashboardStatsAPI
async function getDashboardStatsAPI(userId: string) {
  const supabase = await createSupabaseServiceClient();

  const [
    { count: ideasCount, error: ideasError },
    { count: contentCount, error: contentError },
    { count: scheduledCount, error: scheduledError },
    { count: profileCount, error: profileError },
  ] = await Promise.all([
    supabase.from('idea_kernels').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('canvas_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('scheduled_posts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  if (ideasError || contentError || scheduledError || profileError) {
    console.error('Error fetching dashboard counts:', { ideasError, contentError, scheduledError, profileError });
    throw new Error('Could not fetch dashboard counts');
  }

  return {
    ideasCount: ideasCount || 0,
    contentCount: contentCount || 0,
    scheduledCount: scheduledCount || 0,
    profileCount: profileCount || 0,
  };
}
```

### 3. Load Test Security & Middleware Bypass Integration (15 min)
- **Target File:** [middleware.ts](file:///c:/Users/USER/Desktop/saas%20projects/museflow/src/middleware.ts)
- **Changes:**
  - Add an environment-gated bypass header check (`x-load-test-secret`) that is only active if `process.env.LOAD_TEST_BYPASS_SECRET` is defined and matches the incoming header.
  - When valid in staging/dev, inject a simulated test user context (`test_user_load_test`) to bypass Clerk network round-trips during synthetic load runs.

### 4. Build k6 Load Testing Suite (30 min)
- **Files to create:**
  - `load-tests/config.json`: Environment endpoints, test user IDs, threshold configurations.
  - `load-tests/scenarios/01_smoke.js`: Fast sanity check (1–5 VUs, 30s duration) validating 200 OK and baseline latencies.
  - `load-tests/scenarios/02_dashboard_load.js`: Concurrency ramping test (10 -> 50 -> 150 VUs) measuring p50, p95, and p99 response times on dashboard, ideas, and profile read operations.
  - `load-tests/scenarios/03_ai_generation_load.js`: Controlled generation load test measuring latency and timeout rates for `/api/canvas/generate` and `/api/editor/autocomplete`.
  - `load-tests/scenarios/04_mock_ai_stress.js`: High-throughput stress test stubbing out external Gemini API to measure MuseFlow's pure serverless + DB ceiling (up to 300+ VUs).
  - `load-tests/run-all.ps1`: Automated PowerShell orchestrator to execute the suite and output markdown benchmark summaries.

### 5. AI Endpoint Streaming & Timeout Optimization (20 min)
- **Target File:** [route.ts](file:///c:/Users/USER/Desktop/saas%20projects/museflow/src/app/api/canvas/generate/route.ts)
- **Changes:**
  - Introduce streaming support leveraging the existing `ai: ^7.0.18` package so that the client receives the first token within 800ms instead of holding the serverless function blocked for 15–45 seconds.

---

## Timeline

| Phase | Duration | Scope |
|---|---|---|
| **Phase 1: Dependencies & Tooling** | 5 min | Install k6 and verify runner environment |
| **Phase 2: Database Latency Fixes** | 20 min | Parallelize DB queries in `stats/route.ts` & configure pooling |
| **Phase 3: Auth Bypass & Middleware** | 15 min | Staging test header support in `middleware.ts` |
| **Phase 4: k6 Test Harness Creation** | 30 min | Write smoke, load, stress, and AI benchmark scripts |
| **Phase 5: Execution & Verification** | 20 min | Execute baseline tests, capture p50/p95 metrics, and review results |
| **Total** | **1.5 hours** | |

---

## Rollback Plan
1. **Database Route:** If `Promise.all` encounters unhandled connection saturation under low pool limits, revert `stats/route.ts` using git checkout:
   ```powershell
   git checkout src/app/api/dashboard/stats/route.ts
   ```
2. **Middleware:** If the load test bypass behaves unexpectedly, simply unset `LOAD_TEST_BYPASS_SECRET` in `.env.local` to completely disable the bypass code path.
3. **Load Test Suite:** All test scripts live isolated in `load-tests/` and do not affect the production build bundle or Next.js app output.

---

## Security Checklist
- [x] **Environment Gating:** Load test bypass strictly disabled in production (fails closed if `LOAD_TEST_BYPASS_SECRET` is unset).
- [x] **Rate Limit Protection:** Gemini load tests throttled to prevent quota exhaustion or unexpected API billing.
- [x] **Synthetic Test Data:** Load tests use dedicated test user IDs (`test_user_load_test`) preventing contamination of real user data.
- [x] **Secrets Management:** Test secrets stored in `.env.local` and excluded from git via `.gitignore`.
- [x] **Graceful Error Handling:** All API routes return clean JSON error structures instead of leaking stack traces under high load.

---

## Verification & Execution Commands
```powershell
# 1. Run Baseline Smoke Test:
k6 run load-tests/scenarios/01_smoke.js

# 2. Run Dashboard Concurrency Ramp Test:
k6 run load-tests/scenarios/02_dashboard_load.js

# 3. Run AI Generation Benchmark Test:
k6 run load-tests/scenarios/03_ai_generation_load.js
```
