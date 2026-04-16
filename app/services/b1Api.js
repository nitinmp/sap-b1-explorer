'use client'

export async function loginB1({ companyDb, user, pass }) {
  const res = await fetch('/api/b1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyDb, user, pass }),
  })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'Login failed')
  return data
}

export async function logoutB1() {
  await fetch('/api/b1/logout', { method: 'POST' })
}

export async function fetchB1(path, params = {}) {
  const url = new URL('/api/b1', window.location.origin)
  url.searchParams.set('path', path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })

  const res = await fetch(url.toString())

  if (res.status === 401) {
    // Session expired — signal App to show login screen
    window.dispatchEvent(new CustomEvent('b1:session-expired'))
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function checkHealth() {
  try {
    const res = await fetch('/api/health')
    return res.ok
  } catch {
    return false
  }
}
