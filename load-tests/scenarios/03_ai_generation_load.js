import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { getBaseUrl, getAuthHeaders } from '../helpers/auth.js';

const GenerationLatency = new Trend('gemini_generation_latency_ms');
const GenerationFailures = new Rate('gemini_generation_failure_rate');

export const options = {
  scenarios: {
    controlled_ai_traffic: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 2 },  // 2 concurrent generations
        { duration: '30s', target: 5 },  // 5 concurrent generations
        { duration: '30s', target: 10 }, // 10 concurrent generations
        { duration: '15s', target: 0 },  // Cool-down
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    'gemini_generation_latency_ms': ['p(90)<25000', 'p(95)<35000'],
    'gemini_generation_failure_rate': ['rate<0.05'], // Allow up to 5% due to LLM provider fluctuations
  },
};

export default function () {
  const baseUrl = getBaseUrl();
  const headers = getAuthHeaders();

  group('Feature: Canvas AI Block Generation', () => {
    const payload = JSON.stringify({
      block_type: 'hook',
      canvas_title: '10x Content Distribution Playbook',
      active_profile: {
        profile_name: 'Growth Marketer',
        niche: 'SaaS & Tech',
        tone_config: { professionalism: 8, creativity: 8, casualness: 5, directness: 9 },
      },
      context_blocks: [],
      user_instruction: 'Generate a short, viral hook for LinkedIn.',
      contentTypeId: 'linkedin_post',
    });

    const res = http.post(`${baseUrl}/api/canvas/generate`, payload, {
      headers,
      timeout: '60s',
    });

    GenerationLatency.add(res.timings.duration);

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'has generated_content': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Boolean(body.generated_content && body.generated_content.length > 0);
        } catch (_) {
          return false;
        }
      },
    });

    GenerationFailures.add(!success);

    // AI users typically take 5-10s before generating their next block
    sleep(5);
  });
}
