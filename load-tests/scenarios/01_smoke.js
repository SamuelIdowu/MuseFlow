import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { getBaseUrl, getAuthHeaders } from '../helpers/auth.js';

export const options = {
  vus: 3,
  duration: '15s',
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should complete under 1s
    http_req_failed: ['rate<0.01'],    // less than 1% errors
  },
};

export default function () {
  const baseUrl = getBaseUrl();
  const headers = getAuthHeaders();

  group('01. Public Landing Page', () => {
    const res = http.get(`${baseUrl}/`);
    check(res, {
      'landing page status is 200': (r) => r.status === 200,
    });
    sleep(0.5);
  });

  group('02. Authenticated Dashboard Stats API', () => {
    const res = http.get(`${baseUrl}/api/dashboard/stats`, { headers });
    check(res, {
      'stats status is 200': (r) => r.status === 200,
      'stats response has contentCount': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.contentCount !== undefined;
        } catch (_) {
          return false;
        }
      },
    });
    sleep(0.5);
  });

  group('03. Authenticated Recent Ideas API', () => {
    const res = http.get(`${baseUrl}/api/dashboard/recent-ideas?limit=3`, { headers });
    check(res, {
      'recent ideas status is 200': (r) => r.status === 200,
      'recent ideas is an array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch (_) {
          return false;
        }
      },
    });
    sleep(1);
  });
}
