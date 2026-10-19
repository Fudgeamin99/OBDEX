'use strict';
// HPI-style history checks (finance, stolen, write-off, keepers, plates).
// These come from paid data providers, so the provider is pluggable:
// set HPI_PROVIDER in .env and add an adapter below that returns the same
// shape as mock.hpi() in public/js/mock.js.

const mock = require('../public/js/mock.js');

const providers = {
  demo: async (reg) => mock.hpi(reg),

  // Generic adapter for a provider that exposes a JSON endpoint keyed by
  // registration. Map the provider's fields onto the OBDEX shape in toObdex().
  http: async (reg) => {
    const url = new URL(process.env.HPI_API_URL);
    url.searchParams.set(process.env.HPI_REG_PARAM || 'vrm', reg);
    const res = await fetch(url, { headers: { [process.env.HPI_KEY_HEADER || 'x-api-key']: process.env.HPI_API_KEY } });
    if (!res.ok) throw Object.assign(new Error(`History check failed (${res.status})`), { status: 502 });
    return toObdex(await res.json());
  }
};

function toObdex(raw) {
  // Replace with the mapping for your chosen provider.
  return {
    provider: process.env.HPI_PROVIDER,
    checkedAt: new Date().toISOString(),
    outstandingFinance: raw.outstandingFinance || null,
    stolen: raw.stolen || null,
    writeOff: raw.writeOff || null,
    scrapped: Boolean(raw.scrapped),
    imported: Boolean(raw.imported),
    exported: Boolean(raw.exported),
    plateChanges: raw.plateChanges || [],
    colourChanges: raw.colourChanges || [],
    previousKeepers: raw.previousKeepers ?? null,
    vinLast4: raw.vinLast4 || null
  };
}

function providerName() {
  const name = process.env.HPI_PROVIDER || 'demo';
  return providers[name] ? name : 'demo';
}

async function lookup(reg) {
  const name = providerName();
  return { source: name, data: await providers[name](reg) };
}

module.exports = { lookup, providerName };
