'use client';

export async function apiCall(
  endpoint: string, 
  options: RequestInit = {},
  debugPrefix: string = 'API'
) {
  console.log(`${debugPrefix} - Making request to: ${endpoint}`, {
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body
  });

  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include' // This ensures cookies are sent with the request
    });

    console.log(`${debugPrefix} - Response status: ${response.status}`, {
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`${debugPrefix} - Request failed:`, data);
      throw new Error(data.error || `API call failed with status ${response.status}`);
    }

    console.log(`${debugPrefix} - Successful response:`, data);
    return data;
  } catch (error) {
    console.error(`${debugPrefix} - Request error:`, error);
    throw error;
  }
}