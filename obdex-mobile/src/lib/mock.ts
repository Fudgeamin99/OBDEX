// Demo data in the same shape as the real APIs (DVSA MOT History, DVLA
// Vehicle Enquiry, HPI provider). Used until the OBDEX server is connected.
// Kept in step with obdex-app/public/js/mock.js.
import type { Defect, DvlaVehicle, Hpi, MotTest, MotVehicle, VehicleReport } from './types';

const MODELS: [string, string, string, number][] = [
  ['FORD', 'FIESTA', 'PETROL', 998], ['VAUXHALL', 'CORSA', 'PETROL', 1199],
  ['VOLKSWAGEN', 'POLO', 'PETROL', 999], ['BMW', '320D M SPORT', 'DIESEL', 1995],
  ['AUDI', 'A3 SPORTBACK', 'PETROL', 1498], ['TOYOTA', 'YARIS', 'HYBRID ELECTRIC', 1490],
  ['NISSAN', 'QASHQAI', 'PETROL', 1332], ['MERCEDES-BENZ', 'A 180', 'PETROL', 1332],
  ['KIA', 'SPORTAGE', 'DIESEL', 1598], ['MINI', 'COOPER', 'PETROL', 1499],
];
const COLOURS = ['BLACK', 'WHITE', 'GREY', 'SILVER', 'BLUE', 'RED'];
const ADVISORIES = [
  'Nearside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e))',
  'Offside Rear Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))',
  'Front Brake pad(s) wearing thin (1.1.13 (a) (ii))',
  'Oil leak, but not excessive (8.4.1 (a) (i))',
  'Nearside Front Suspension arm pin or bush worn but not resulting in excessive movement (5.3.4 (a) (i))',
  "Windscreen damaged but not adversely affecting driver's view (3.2 (a) (i))",
  'Underside corroded but not seriously weakening structure',
];
const FAILS: [string, Defect['type']][] = [
  ['Offside Headlamp aim too high (4.1.2 (a))', 'MAJOR'],
  ['Nearside Rear Tyre tread depth below requirements of 1.6mm (5.2.3 (e))', 'MAJOR'],
  ['Nearside Front Coil spring fractured or seriously weakened (5.3.1 (b) (i))', 'MAJOR'],
  ['Registration plate lamp inoperative in the case of multiple lamps or light sources (4.7.1 (b) (i))', 'MINOR'],
];

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let s = seed || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setUTCDate(c.getUTCDate() + n); return c; };
const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];

// Current-style plates (AB21 CDE) carry an age identifier: 21 = Mar 2021, 71 = Sep 2021.
function firstRegFromPlate(reg: string, r: () => number) {
  const m = /^[A-Z]{2}(\d{2})[A-Z]{3}$/.exec(reg);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 2 && n <= 26) return new Date(Date.UTC(2000 + n, 2 + Math.floor(r() * 5), 1 + Math.floor(r() * 27)));
    if (n >= 51 && n <= 75) return new Date(Date.UTC(1999 + n - 49, 8 + Math.floor(r() * 4), 1 + Math.floor(r() * 27)));
  }
  return new Date(Date.UTC(2012 + Math.floor(r() * 10), Math.floor(r() * 12), 1 + Math.floor(r() * 27)));
}

type Opts = { failAt?: number[]; rollbackAt?: number; perYear?: number };

function buildTests(first: Date, today: Date, r: () => number, opts: Opts): MotTest[] {
  const tests: MotTest[] = [];
  let miles = 0;
  const perYear = opts.perYear ?? 6000 + Math.floor(r() * 6000);
  let due = new Date(Date.UTC(first.getUTCFullYear() + 3, first.getUTCMonth(), first.getUTCDate()));
  for (let y = 0; due <= today; y++) {
    let date = addDays(due, -Math.floor(r() * 25));
    miles += Math.round(perYear * (0.7 + r() * 0.6));
    const reading = opts.rollbackAt === y ? Math.round(miles * 0.62) : miles;
    let advisories: Defect[] = [];
    const nAdv = Math.floor(r() * 3);
    for (let a = 0; a < nAdv; a++) advisories.push({ text: pick(r, ADVISORIES), type: 'ADVISORY', dangerous: false });
    const fail = opts.failAt ? opts.failAt.includes(y) : r() < 0.18;
    if (fail) {
      const f = pick(r, FAILS);
      tests.push(test(date, 'FAILED', null, reading, [{ text: f[0], type: f[1], dangerous: false }, ...advisories], r));
      date = addDays(date, 1 + Math.floor(r() * 6));
      advisories = advisories.slice(0, 1);
    }
    tests.push(test(date, 'PASSED', addDays(due, 364 + (y === 0 ? 1 : 0)), reading, advisories, r));
    due = new Date(Date.UTC(due.getUTCFullYear() + 1, due.getUTCMonth(), due.getUTCDate()));
  }
  return tests.reverse();
}

function test(date: Date, result: MotTest['testResult'], expiry: Date | null, odo: number, defects: Defect[], r: () => number): MotTest {
  return {
    completedDate: date.toISOString(),
    testResult: result,
    expiryDate: expiry ? iso(expiry) : null,
    odometerValue: String(odo),
    odometerUnit: 'MI',
    odometerResultType: 'READ',
    motTestNumber: String(100000000000 + Math.floor(r() * 899999999999)),
    defects,
  };
}

export function mockMot(regIn: string, today = new Date()): MotVehicle {
  const reg = clean(regIn);
  const r = rng(hash(reg));
  let opts: Opts = {};
  let model = pick(r, MODELS);
  let colour = pick(r, COLOURS);
  if (reg === 'OB21DEX') { model = ['FORD', 'FOCUS ST-LINE', 'PETROL', 999]; colour = 'GREY'; opts = { failAt: [1], rollbackAt: 2, perYear: 11000 }; }
  if (reg === 'FG52YPA') { model = ['TOYOTA', 'YARIS', 'HYBRID ELECTRIC', 1497]; colour = 'SILVER'; opts = { failAt: [3], perYear: 7200 }; }
  const first = reg === 'FG52YPA' ? new Date(Date.UTC(2006, 4, 12)) : firstRegFromPlate(reg, r);
  const tests = buildTests(first, today, r, opts);
  const mot: MotVehicle = {
    registration: reg,
    make: model[0],
    model: model[1],
    firstUsedDate: iso(first),
    registrationDate: iso(first),
    manufactureDate: iso(addDays(first, -40)),
    fuelType: model[2],
    primaryColour: colour,
    engineSize: String(model[3]),
    hasOutstandingRecall: reg === 'OB21DEX' ? 'Yes' : 'No',
    motTests: tests,
  };
  if (!tests.length) mot.motTestDueDate = iso(new Date(Date.UTC(first.getUTCFullYear() + 3, first.getUTCMonth(), first.getUTCDate())));
  return mot;
}

export function mockDvla(mot: MotVehicle, today = new Date()): DvlaVehicle {
  const r = rng(hash('dvla:' + mot.registration));
  const first = new Date(mot.firstUsedDate);
  const lastPass = mot.motTests.find((t) => t.testResult === 'PASSED' && t.expiryDate);
  const taxDue = new Date(Date.UTC(today.getUTCFullYear() + (r() < 0.5 ? 0 : 1), first.getUTCMonth(), 1));
  if (taxDue < today) taxDue.setUTCFullYear(taxDue.getUTCFullYear() + 1);
  const sorn = r() < 0.06;
  return {
    registrationNumber: mot.registration,
    taxStatus: sorn ? 'SORN' : 'Taxed',
    taxDueDate: sorn ? undefined : iso(taxDue),
    motStatus: lastPass && new Date(lastPass.expiryDate!) >= today ? 'Valid' : mot.motTestDueDate ? 'No details held by DVLA' : 'Not valid',
    motExpiryDate: lastPass?.expiryDate ?? undefined,
    make: mot.make,
    monthOfFirstRegistration: mot.firstUsedDate.slice(0, 7),
    yearOfManufacture: new Date(mot.manufactureDate ?? mot.firstUsedDate).getUTCFullYear(),
    engineCapacity: Number(mot.engineSize),
    co2Emissions: 95 + Math.floor(r() * 70),
    fuelType: mot.fuelType,
    markedForExport: false,
    colour: mot.primaryColour,
    typeApproval: 'M1',
    wheelplan: '2 AXLE RIGID BODY',
    euroStatus: first.getUTCFullYear() >= 2015 ? 'EURO 6' : undefined,
    realDrivingEmissions: first.getUTCFullYear() >= 2019 ? '2' : undefined,
    dateOfLastV5CIssued: iso(addDays(today, -Math.floor(60 + r() * 900))),
  };
}

export function mockHpi(regIn: string): Hpi {
  const reg = clean(regIn);
  const r = rng(hash('hpi:' + reg));
  let finance = r() < 0.15, writeOff = r() < 0.08, stolen = r() < 0.02;
  if (reg === 'OB21DEX') { finance = true; writeOff = false; stolen = false; }
  if (reg === 'FG52YPA') { finance = false; writeOff = false; stolen = false; }
  return {
    provider: 'demo',
    outstandingFinance: finance ? { agreements: 1, lender: 'Northgate Motor Finance', agreementType: 'Personal Contract Purchase' } : null,
    stolen: stolen ? { reportedDate: '2026-08-03', policeForce: 'Metropolitan Police' } : null,
    writeOff: writeOff ? { category: 'S', lossDate: '2023-11-20', description: 'Structurally damaged, repaired' } : null,
    scrapped: false,
    imported: false,
    exported: false,
    plateChanges: reg === 'OB21DEX' ? [{ date: '2025-06-02', from: 'FD21 KXR' }] : [],
    colourChanges: [],
    previousKeepers: reg === 'OB21DEX' ? 3 : 1 + Math.floor(r() * 4),
    vinLast4: String(1000 + Math.floor(r() * 8999)),
  };
}

export function mockReport(reg: string): VehicleReport {
  const mot = mockMot(reg);
  return { registration: mot.registration, sources: { mot: 'demo', dvla: 'demo', hpi: 'demo' }, mot, dvla: mockDvla(mot), hpi: mockHpi(reg) };
}

export const SAMPLE_REGS = ['FG52YPA', 'OB21DEX'];

export function clean(reg: string) {
  return String(reg || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
