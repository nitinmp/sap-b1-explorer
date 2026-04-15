require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

const SAP_HOST = process.env.SAP_HOST;
const COMPANY_DB = process.env.SAP_COMPANY_DB;
const SAP_USER = process.env.SAP_USER;
const SAP_PASS = process.env.SAP_PASS;

// Allow self-signed certs from SAP B1
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const sapClient = axios.create({ httpsAgent, timeout: 30000 });

let b1SessionCookie = null;
let sessionCompanyDb = COMPANY_DB;
let sessionUser = SAP_USER;
let sessionPass = SAP_PASS;

async function login(companyDb, user, pass) {
  const url = `${SAP_HOST}/b1s/v1/Login`;
  const body = { CompanyDB: companyDb, UserName: user, Password: pass };
  const res = await sapClient.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
  });

  // SAP B1 may return the session in the response body (SessionId) or as Set-Cookie
  const sessionId = res.data?.SessionId;
  if (sessionId) {
    b1SessionCookie = `B1SESSION=${sessionId}`;
    sessionCompanyDb = companyDb;
    sessionUser = user;
    sessionPass = pass;
    console.log('[proxy] Logged in via SessionId body, session acquired');
    return true;
  }

  // Fallback: extract B1SESSION from Set-Cookie header
  const cookies = res.headers['set-cookie'] || [];
  for (const c of cookies) {
    const match = c.match(/B1SESSION=([^;]+)/);
    if (match) {
      b1SessionCookie = `B1SESSION=${match[1]}`;
      sessionCompanyDb = companyDb;
      sessionUser = user;
      sessionPass = pass;
      console.log('[proxy] Logged in via Set-Cookie header, session acquired');
      return true;
    }
  }
  throw new Error('Login succeeded but no session ID found in response');
}

async function ensureSession() {
  if (!b1SessionCookie) {
    await login(sessionCompanyDb, sessionUser, sessionPass);
  }
}

async function forwardRequest(path, params, retried = false) {
  await ensureSession();
  const url = `${SAP_HOST}${path}`;
  try {
    const res = await sapClient.get(url, {
      params,
      headers: { Cookie: b1SessionCookie, 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 401 && !retried) {
      console.log('[proxy] 401 received, re-logging in...');
      b1SessionCookie = null;
      await login(sessionCompanyDb, sessionUser, sessionPass);
      return forwardRequest(path, params, true);
    }
    throw err;
  }
}

// POST /api/b1/login — explicit login from UI (accepts custom credentials)
app.post('/api/b1/login', async (req, res) => {
  const { companyDb, user, pass } = req.body;
  try {
    await login(companyDb || COMPANY_DB, user || SAP_USER, pass || SAP_PASS);
    res.json({ ok: true });
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message?.value || err.message;
    res.status(status).json({ ok: false, error: message });
  }
});

// POST /api/b1/logout
app.post('/api/b1/logout', async (req, res) => {
  try {
    if (b1SessionCookie) {
      await sapClient.post(
        `${SAP_HOST}/b1s/v1/Logout`,
        {},
        { headers: { Cookie: b1SessionCookie } }
      );
    }
  } catch (_) {
    // ignore logout errors
  }
  b1SessionCookie = null;
  res.json({ ok: true });
});

// GET /api/b1?path=/b1s/v1/BusinessPartners&$filter=...&$select=...&$top=100
app.get('/api/b1', async (req, res) => {
  const { path, ...rest } = req.query;
  if (!path) return res.status(400).json({ error: 'path query param required' });
  try {
    const data = await forwardRequest(path, rest);
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message?.value || err.message;
    res.status(status).json({ error: message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, session: !!b1SessionCookie });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[proxy] Listening on http://localhost:${PORT}`);
  // Auto-login on startup
  login(COMPANY_DB, SAP_USER, SAP_PASS).catch((e) =>
    console.warn('[proxy] Initial login failed:', e.message)
  );
});
