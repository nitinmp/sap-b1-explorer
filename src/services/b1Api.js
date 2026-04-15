import { PROXY_BASE } from '../config.js';

/**
 * Login to SAP B1 via proxy.
 */
export async function loginB1({ companyDb, user, pass }) {
  const res = await fetch(`${PROXY_BASE}/api/b1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyDb, user, pass }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function logoutB1() {
  await fetch(`${PROXY_BASE}/api/b1/logout`, { method: 'POST' });
}

/**
 * Generic GET for any Service Layer path.
 * params is an object with optional $filter, $select, $top, etc.
 */
export async function fetchB1(path, params = {}) {
  const url = new URL(`${PROXY_BASE}/api/b1`);
  url.searchParams.set('path', path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function checkHealth() {
  try {
    const res = await fetch(`${PROXY_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
