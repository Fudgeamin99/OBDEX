'use strict';
// Tax and vehicle details from the DVLA Vehicle Enquiry Service
// (https://developer-portal.driver-vehicle-licensing.api.gov.uk/). Free API key.
// Returns null when no key is set; the app then uses demo values.

const API_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

function configured() {
  return Boolean(process.env.DVLA_API_KEY);
}

async function lookup(reg) {
  if (!configured()) return { source: 'demo', data: null };
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'x-api-key': process.env.DVLA_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationNumber: reg })
  });
  if (res.status === 404) return { source: 'dvla', data: null };
  if (!res.ok) throw Object.assign(new Error(`DVLA lookup failed (${res.status})`), { status: 502 });
  return { source: 'dvla', data: await res.json() };
}

module.exports = { lookup, configured };
