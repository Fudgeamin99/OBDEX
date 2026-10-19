import type { Hpi, MotTest, VehicleReport } from './types';

const DAY = 86400000;
export type Level = 'good' | 'warn' | 'bad' | 'info';

export function fmtDate(d?: string | null) {
  if (!d) return 'Not available';
  const date = new Date(d.length === 7 ? d + '-01' : d);
  if (isNaN(date.getTime())) return d;
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}
export function fmtMonth(d?: string | null) {
  if (!d) return 'Not available';
  const date = new Date(d.length === 7 ? d + '-01' : d);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
export const num = (n: number) => Math.round(n).toLocaleString('en-GB');
export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
export const title = (s?: string | null) => String(s ?? '').toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

export function prettyReg(r: string) {
  if (/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(r)) return r.slice(0, 4) + ' ' + r.slice(4);
  if (/^[A-Z]\d{1,3}[A-Z]{3}$/.test(r)) return r.slice(0, r.length - 3) + ' ' + r.slice(-3);
  return r;
}

export type MotStatus = { level: Level; label: string; detail: string; expiry?: string };

export function motStatus(r: VehicleReport): MotStatus {
  const tests = sortedTests(r.mot.motTests);
  const lastPass = tests.find((t) => t.testResult === 'PASSED' && t.expiryDate);
  const expiry = lastPass?.expiryDate ?? r.dvla?.motExpiryDate;
  if (expiry) {
    const days = Math.floor((new Date(expiry).getTime() + DAY - 1 - Date.now()) / DAY);
    if (days < 0) return { level: 'bad', label: 'Expired', detail: `Expired ${fmtDate(expiry)}`, expiry };
    if (days <= 30) return { level: 'warn', label: 'Due soon', detail: `${plural(days, 'day')} left`, expiry };
    return { level: 'good', label: 'Valid', detail: `${plural(days, 'day')} left`, expiry };
  }
  if (r.mot.motTestDueDate) return { level: 'good', label: 'Not due', detail: `First MOT due ${fmtDate(r.mot.motTestDueDate)}`, expiry: r.mot.motTestDueDate };
  return { level: 'warn', label: 'No record', detail: 'No MOT on record' };
}

export function taxStatus(r: VehicleReport): { level: Level; label: string; due?: string } {
  const d = r.dvla;
  if (!d?.taxStatus) return { level: 'info', label: 'Not available' };
  const level: Level = d.taxStatus === 'Taxed' ? 'good' : d.taxStatus === 'SORN' ? 'warn' : 'bad';
  return { level, label: d.taxStatus, due: d.taxDueDate };
}

export function sortedTests(tests: MotTest[]) {
  return tests.slice().sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
}

export type MilePoint = { t: number; date: string; miles: number; drop?: boolean };

export function mileage(tests: MotTest[]) {
  const seen = new Set<string>();
  const pts: MilePoint[] = sortedTests(tests).reverse()
    .filter((t) => t.odometerResultType === 'READ' && t.odometerValue)
    .map((t) => ({ t: new Date(t.completedDate).getTime(), date: t.completedDate, miles: Number(t.odometerValue) * (t.odometerUnit === 'KM' ? 0.621371 : 1) }))
    .filter((p) => (seen.has(p.date.slice(0, 10)) ? false : (seen.add(p.date.slice(0, 10)), true)));
  const drops: { date: string; from: number; to: number }[] = [];
  let max = 0;
  for (const p of pts) {
    if (p.miles < max) { p.drop = true; drops.push({ date: p.date, from: max, to: p.miles }); }
    max = Math.max(max, p.miles);
  }
  return { points: pts, drops, latest: pts[pts.length - 1] };
}

export type Check = { level: Level; name: string; detail: string };

export function historyChecks(h: Hpi, r: VehicleReport): Check[] {
  const c: Check[] = [];
  const add = (level: Level, name: string, detail: string) => c.push({ level, name, detail });
  const { drops } = mileage(r.mot.motTests);
  const f = h.outstandingFinance;
  f ? add('bad', 'Outstanding finance', `${plural(f.agreements ?? 1, 'agreement')}${f.lender ? ' with ' + f.lender : ''}. The lender may own the car until it is settled.`)
    : add('good', 'Outstanding finance', 'No finance recorded against this vehicle.');
  h.stolen ? add('bad', 'Stolen', `Reported stolen${h.stolen.reportedDate ? ' on ' + fmtDate(h.stolen.reportedDate) : ''}. Do not buy it; contact the police.`)
    : add('good', 'Stolen', 'Not recorded as stolen.');
  h.writeOff ? add('bad', 'Salvage / write-off', `Category ${h.writeOff.category}${h.writeOff.description ? ': ' + h.writeOff.description : ''}.`)
    : add('good', 'Salvage / write-off', 'No insurance write-off recorded.');
  drops.length ? add('bad', 'Mileage', `Dropped from ${num(drops[0].from)} to ${num(drops[0].to)} miles at the ${fmtDate(drops[0].date)} MOT. Possible clocking.`)
    : add('good', 'Mileage', 'MOT mileage readings go up in order.');
  h.scrapped ? add('bad', 'Scrapped', 'Recorded as scrapped.') : add('good', 'Scrapped', 'Not recorded as scrapped.');
  h.imported || h.exported || r.dvla?.markedForExport
    ? add('warn', 'Imported / exported', h.imported ? 'Imported vehicle.' : 'Marked for export.')
    : add('good', 'Imported / exported', 'Not imported or exported.');
  h.plateChanges.length ? add('warn', 'Plate changes', `${plural(h.plateChanges.length, 'change')}, most recently from ${h.plateChanges[0].from}.`)
    : add('good', 'Plate changes', 'No previous registrations.');
  h.colourChanges.length ? add('warn', 'Colour changes', `${plural(h.colourChanges.length, 'change')} on record.`)
    : add('good', 'Colour changes', 'Still the colour it was first registered in.');
  if (r.mot.hasOutstandingRecall === 'Yes') add('warn', 'Safety recall', 'Outstanding manufacturer recall. Ask the seller for proof it was fixed.');
  if (h.vinLast4) add('info', 'VIN check', `VIN ends in ${h.vinLast4}. Make sure it matches the car and the V5C logbook.`);
  if (h.previousKeepers != null) add('info', 'Previous keepers', `${plural(h.previousKeepers, 'previous keeper')} on record.`);
  return c;
}

export function vehicleRows(r: VehicleReport): [string, string][] {
  const d = r.dvla;
  const m = r.mot;
  return [
    ['Vehicle Make', title(d?.make ?? m.make)],
    ['Vehicle Model', title(m.model)],
    ['Date of first registration', fmtMonth(d?.monthOfFirstRegistration ?? m.firstUsedDate)],
    ['Year of Manufacture', String(d?.yearOfManufacture ?? (m.manufactureDate ? new Date(m.manufactureDate).getUTCFullYear() : 'Not available'))],
    ['Cylinder Capacity', d?.engineCapacity || m.engineSize ? `${d?.engineCapacity ?? m.engineSize} cc` : 'Not available'],
    ['CO2 emissions', d?.co2Emissions != null ? `${d.co2Emissions} g/km` : 'Not available'],
    ['Fuel Type', title(d?.fuelType ?? m.fuelType)],
    ['Euro Status', d?.euroStatus ?? 'Not available'],
    ['Real Driving Emissions (RDE)', d?.realDrivingEmissions ?? 'Not available'],
    ['Export Marker', d?.markedForExport ? 'Yes' : 'No'],
    ['Vehicle Status', d?.taxStatus ?? 'Not available'],
    ['Vehicle Colour', title(d?.colour ?? m.primaryColour)],
    ['Vehicle type approval', d?.typeApproval ?? 'Not available'],
    ['Wheelplan', d?.wheelplan ?? 'Not available'],
    ['Revenue Weight', d?.revenueWeight ? `${num(d.revenueWeight)} kg` : 'Not available'],
    ['Date of last V5C (logbook)', d?.dateOfLastV5CIssued ? fmtMonth(d.dateOfLastV5CIssued).replace(/^/, new Date(d.dateOfLastV5CIssued).getUTCDate() + ' ') : 'Not available'],
  ];
}
