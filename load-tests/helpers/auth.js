const config = JSON.parse(open('../config.json'));

export function getBaseUrl() {
  return __ENV.TARGET_URL || config.targetUrl;
}

export function getAuthHeaders() {
  const secret = __ENV.LOAD_TEST_SECRET || config.loadTestSecret;
  const userId = __ENV.TEST_USER_ID || config.testUserId;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (secret) {
    headers['x-load-test-secret'] = secret;
    headers['x-load-test-user-id'] = userId;
  }

  // If a Clerk session token or custom Bearer token is provided via CLI
  if (__ENV.AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${__ENV.AUTH_TOKEN}`;
  }

  return headers;
}
