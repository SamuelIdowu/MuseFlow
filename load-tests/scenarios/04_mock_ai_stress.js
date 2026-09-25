import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { getBaseUrl, getAuthHeaders } from '../helpers/auth.js';

const MockAiLatency = new Trend('mock_ai_throughput_latency_ms');
const StressFailureRate = new Rate('stress_failure_rate');

export const options = {
  scenarios: {
    peak_throughput_stress: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '20s', target: 25 },  // Fast ramp
        { duration: '30s', target: 75 },  // Medium stress
        { duration: '30s', target: 150 }, // Heavy stress (150 concurrent users)
        { duration: '30s', target: 200 }, // Peak serverless concurrency test
        { duration: '20s', target: 0 },   // Cool-down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    'mock_ai_throughput_latency_ms': ['p(95)<800', 'p(99)<1500'],
    'stress_failure_rate': ['rate<0.02'],
    'http_req_failed': ['rate<0.02'],
  },
};

export default function () {
  const baseUrl = getBaseUrl();
  const headers = getAuthHeaders();
  // Enable mock generation to benchmark pure Next.js + DB serverless routing
  headers['x-mock-generation'] = 'true';

  group('Feature: Canvas Generation High Concurrency (Mocked LLM)', () => {
    const payload = JSON.stringify({
      block_type: 'cta',
      canvas_title: 'SaaS Launch Strategy',
      active_profile: {
        profile_name: 'Product Manager',
        niche: 'AI Tools',
      },
      context_blocks: [],
      user_instruction: 'Generate a high-converting call to action.',
    });

    const res = http.post(`${baseUrl}/api/canvas/generate`, payload, {
      headers,
      timeout: '10s',
    });

    MockAiLatency.add(res.timings.duration);

    const success = check(res, {
      'mock generation status is 200': (r) => r.status === 200,
      'is_mock flag confirmed': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.is_mock === true;
        } catch (_) {
          return false;
        }
      },
    });

    StressFailureRate.add(!success);
    sleep(0.5);
  });
}
