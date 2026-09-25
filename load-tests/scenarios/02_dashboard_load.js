import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { getBaseUrl, getAuthHeaders } from '../helpers/auth.js';

// Custom metrics to measure feature performance under concurrency
const StatsLatency = new Trend('stats_latency_ms');
const RecentIdeasLatency = new Trend('recent_ideas_latency_ms');
const FailureRate = new Rate('feature_failure_rate');

export const options = {
  scenarios: {
    ramping_dashboard_traffic: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 10 },  // Baseline ramp
        { duration: '30s', target: 30 },  // Moderate user concurrency
        { duration: '30s', target: 75 },  // Peak concurrent traffic
        { duration: '20s', target: 120 }, // Stress limit
        { duration: '20s', target: 0 },   // Graceful cool-down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    'stats_latency_ms': ['p(95)<600', 'p(99)<1200'],
    'recent_ideas_latency_ms': ['p(95)<600', 'p(99)<1200'],
    'feature_failure_rate': ['rate<0.02'],
    'http_req_failed': ['rate<0.02'],
  },
};

export default function () {
  const baseUrl = getBaseUrl();
  const headers = getAuthHeaders();

  group('Feature: Dashboard Load Profile', () => {
    // 1. Query dashboard aggregate counts
    const statsRes = http.get(`${baseUrl}/api/dashboard/stats`, { headers });
    StatsLatency.add(statsRes.timings.duration);

    const statsOk = check(statsRes, {
      'stats status 200': (r) => r.status === 200,
    });
    FailureRate.add(!statsOk);

    // Realistic think time between dashboard widget queries
    sleep(0.3);

    // 2. Query recent ideas list
    const ideasRes = http.get(`${baseUrl}/api/dashboard/recent-ideas?limit=5`, { headers });
    RecentIdeasLatency.add(ideasRes.timings.duration);

    const ideasOk = check(ideasRes, {
      'ideas status 200': (r) => r.status === 200,
    });
    FailureRate.add(!ideasOk);

    // Simulated user reading dashboard
    sleep(1.5);
  });
}
