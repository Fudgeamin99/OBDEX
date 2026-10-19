'use strict';
// OBDEX server: serves the web app and a small JSON API.
//   GET /api/vehicle/:reg   MOT history + HPI checks for one registration
//   GET /api/status         which data sources are live
// No dependencies; needs Node 18 or newer.

const http = require('http');
const fs = require('fs');
const path = require('path');

loadEnv(path.join(__dirname, '.env'));

const mot = require('./lib/mot');
const hpi = require('./lib/hpi');
const dvla = require('./lib/dvla');
const plate = require('./public/js/plate.js');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/status') {
      return json(res, 200, { mot: mot.configured() ? 'dvsa' : 'demo', dvla: dvla.configured() ? 'dvla' : 'demo', hpi: hpi.providerName() });
    }
    const m = url.pathname.match(/^\/api\/vehicle\/([^/]+)$/);
    if (m) return json(res, 200, await vehicleReport(decodeURIComponent(m[1])));
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Not found' });
    return serveStatic(url.pathname, res);
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    return json(res, status, { error: status === 500 ? 'Something went wrong. Try again.' : err.message });
  }
});

// Looks a plate up with the DVLA and DVSA. A plate in a valid format that
// neither service knows is rejected, so only registered vehicles get a report.
async function vehicleReport(input) {
  const p = plate.check(input);
  if (!p.valid) throw new mot.HttpError(400, p.reason);
  const reg = p.reg;
  const [motResult, dvlaResult] = await Promise.all([mot.lookup(reg), dvla.lookup(reg)]);
  const live = motResult.source !== 'demo' || dvlaResult.source !== 'demo';
  const found = (motResult.source !== 'demo' && motResult.data) || (dvlaResult.source !== 'demo' && dvlaResult.data);
  if (live && !found) {
    throw new mot.HttpError(404, `${p.pretty} is not registered with the DVLA. Check the number plate and try again.`);
  }
  const motData = motResult.data || fromDvla(reg, dvlaResult.data);
  const hpiResult = await hpi.lookup(reg);
  return {
    registration: reg,
    sources: { mot: motResult.source, dvla: dvlaResult.source, hpi: hpiResult.source },
    mot: motData,
    dvla: dvlaResult.data,
    hpi: hpiResult.data
  };
}

// A vehicle with no MOT yet (under three years old) still gets a report from its DVLA record.
function fromDvla(reg, d) {
  const first = d.monthOfFirstRegistration ? `${d.monthOfFirstRegistration}-01` : null;
  return {
    registration: reg,
    make: d.make || '',
    model: '',
    firstUsedDate: first,
    registrationDate: first,
    fuelType: d.fuelType,
    primaryColour: d.colour,
    engineSize: d.engineCapacity ? String(d.engineCapacity) : undefined,
    motTestDueDate: d.motExpiryDate,
    motTests: []
  };
}

function serveStatic(pathname, res) {
  let file = path.normalize(path.join(PUBLIC, decodeURIComponent(pathname)));
  if (!file.startsWith(PUBLIC)) return json(res, 403, { error: 'Forbidden' });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const kv = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (kv && !(kv[1] in process.env)) process.env[kv[1]] = kv[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

server.listen(PORT, () => {
  console.log(`OBDEX running at http://localhost:${PORT}`);
  console.log(`  MOT data: ${mot.configured() ? 'DVSA MOT History API' : 'demo (add DVSA keys to .env)'}`);
  console.log(`  Tax data: ${dvla.configured() ? 'DVLA Vehicle Enquiry Service' : 'demo (add DVLA_API_KEY to .env)'}`);
  console.log(`  HPI data: ${hpi.providerName()}`);
});
