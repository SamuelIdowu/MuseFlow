import { test, expect } from '@playwright/test';

test.describe('Security Audit & Compliance Test Suite', () => {

  test('Security Headers: verifies critical security headers on HTTP responses', async ({ request }) => {
    const response = await request.get('/pricing');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=()');
  });

  test('Cron Security: rejects unauthenticated requests to /api/cron/reminders', async ({ request }) => {
    // 1. Missing Authorization header
    const noAuthResponse = await request.get('/api/cron/reminders');
    expect([401, 503]).toContain(noAuthResponse.status());

    // 2. Invalid Bearer token
    const invalidAuthResponse = await request.get('/api/cron/reminders', {
      headers: {
        Authorization: 'Bearer invalid_random_token_12345',
      },
    });
    expect([401, 503]).toContain(invalidAuthResponse.status());
  });

  test('Flutterwave Webhook: rejects unsigned or invalid webhook payloads', async ({ request }) => {
    const response = await request.post('/api/webhooks/flutterwave', {
      data: {
        event: 'charge.completed',
        data: { status: 'successful', customer: { email: 'test@example.com' } },
      },
      headers: {
        'verif-hash': 'forged-untrusted-hash',
      },
    });

    expect([401, 503]).toContain(response.status());
  });

  test('Protected Routes: unauthenticated requests to canvas APIs are blocked', async ({ request }) => {
    const canvasGetResponse = await request.get('/api/canvas');
    expect([401, 307, 308]).toContain(canvasGetResponse.status());

    const canvasSaveResponse = await request.post('/api/canvas/save', {
      data: {
        canvas_name: 'Hacked Canvas',
        canvas_data: [],
      },
    });
    expect([401, 307, 308]).toContain(canvasSaveResponse.status());
  });

  test('Protected Routes: /api/flutterwave/manage requires authentication', async ({ request }) => {
    const manageResponse = await request.post('/api/flutterwave/manage', {
      data: {
        subscription_id: 'sub_fake_123',
        user_id: '00000000-0000-0000-0000-000000000000',
      },
    });
    // Should be intercepted by middleware (redirect to sign-in) or return 401
    expect([401, 307, 308]).toContain(manageResponse.status());
  });

  test('Public Availability: marketing and auth entrypoints respond correctly', async ({ request }) => {
    const landingResponse = await request.get('/');
    expect(landingResponse.status()).toBe(200);

    const pricingResponse = await request.get('/pricing');
    expect(pricingResponse.status()).toBe(200);
  });

});
