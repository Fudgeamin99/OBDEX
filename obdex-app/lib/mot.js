'use strict';
// MOT data from the DVSA MOT History API (https://documentation.history.mot.api.gov.uk/).
// Falls back to demo data when credentials are not configured.

const mock = require('../public/js/mock.js');

const API_BASE = 'https://history.mot.api.gov.uk/v1/trade/vehicles/registration/';
const DEFAULT_SCOPE = 'https://tut.mot.api.gov.uk/.default';

let cachedToken = null; // { value, expiresAt }

function configured() {
  const e = process.env;
  return Boolean(e.MOT_CLIENT_ID && e.MOT_CLIENT_SECRET && e.MOT_API_KEY && e.MOT_TOKEN_URL);
}

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.MOT_CLIENT_ID,
    client_secret: process.env.MOT_CLIENT_SECRET,
    scope: process.env.MOT_SCOPE || DEFAULT_SCOPE
  });
  const res = await fetch(process.env.MOT_TOKEN_URL, { method: 'POST', body });
  if (!res.ok) throw new HttpError(502, `DVSA sign-in failed (${res.status})`);
  const json = await res.json();
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

async function lookup(reg) {
  if (!configured()) return { source: 'demo', data: mock.vehicle(reg) };

  const res = await fetch(API_BASE + encodeURIComponent(reg), {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      'X-API-Key': process.env.MOT_API_KEY,
      Accept: 'application/json'
    }
  });
  if (res.status === 404) throw new HttpError(404, 'No vehicle found with that registration.');
  if (res.status === 401 || res.status === 403) { cachedToken = null; throw new HttpError(502, 'DVSA rejected the API credentials.'); }
  if (res.status === 429) throw new HttpError(429, 'Too many lookups. Try again in a minute.');
  if (!res.ok) throw new HttpError(502, `DVSA lookup failed (${res.status})`);
  return { source: 'dvsa', data: await res.json() };
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

module.exports = { lookup, configured, HttpError };
