/* Demo data generator, shared by the server and the browser.
 * Produces responses in the same shape as the real providers, so the UI
 * works end to end before API keys are configured. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OBDEXMock = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MODELS = [
    ['FORD', 'FIESTA', 'Petrol', 998], ['VAUXHALL', 'CORSA', 'Petrol', 1199],
    ['VOLKSWAGEN', 'GOLF', 'Diesel', 1968], ['BMW', '320D M SPORT', 'Diesel', 1995],
    ['AUDI', 'A3 SPORTBACK', 'Petrol', 1498], ['TOYOTA', 'YARIS', 'Hybrid Electric', 1490],
    ['NISSAN', 'QASHQAI', 'Petrol', 1332], ['MERCEDES-BENZ', 'A 180', 'Petrol', 1332],
    ['KIA', 'SPORTAGE', 'Diesel', 1598], ['MINI', 'COOPER', 'Petrol', 1499]
  ];
  var COLOURS = ['Black', 'White', 'Grey', 'Silver', 'Blue', 'Red'];
  var ADVISORIES = [
    'Nearside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e))',
    'Offside Rear Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))',
    'Front Brake pad(s) wearing thin (1.1.13 (a) (ii))',
    'Oil leak, but not excessive (8.4.1 (a) (i))',
    'Nearside Front Suspension arm pin or bush worn but not resulting in excessive movement (5.3.4 (a) (i))',
    'Windscreen damaged but not adversely affecting driver\'s view (3.2 (a) (i))',
    'Underside corroded but not seriously weakening structure',
    'Exhaust has a minor leak of exhaust gases (8.1.1 (a))'
  ];
  var FAILS = [
    ['Offside Headlamp aim too high (4.1.2 (a))', 'MAJOR'],
    ['Nearside Rear Tyre tread depth below requirements of 1.6mm (5.2.3 (e))', 'MAJOR'],
    ['Nearside Front Coil spring fractured or seriously weakened (5.3.1 (b) (i))', 'MAJOR'],
    ['Registration plate lamp inoperative in the case of multiple lamps or light sources (4.7.1 (b) (i))', 'MINOR'],
    ['Front Brake pad(s) less than 1.5 mm thick (1.1.13 (a) (i))', 'MAJOR']
  ];

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var s = seed || 1;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, n) { var c = new Date(d); c.setUTCDate(c.getUTCDate() + n); return c; }

  // Current-style plates (AB21 CDE) carry an age identifier: 21 = Mar 2021, 71 = Sep 2021.
  function firstRegFromPlate(reg, r) {
    var m = /^[A-Z]{2}(\d{2})[A-Z]{3}$/.exec(reg);
    if (m) {
      var n = parseInt(m[1], 10);
      if (n >= 2 && n <= 26) return new Date(Date.UTC(2000 + n, 2 + Math.floor(r() * 5), 1 + Math.floor(r() * 27)));
      if (n >= 51 && n <= 75) return new Date(Date.UTC(1999 + n - 49, 8 + Math.floor(r() * 4), 1 + Math.floor(r() * 27)));
    }
    return new Date(Date.UTC(2012 + Math.floor(r() * 10), Math.floor(r() * 12), 1 + Math.floor(r() * 27)));
  }

  function buildTests(first, today, r, opts) {
    var tests = [];
    var miles = 0;
    var perYear = opts.perYear || 6000 + Math.floor(r() * 6000);
    var due = new Date(Date.UTC(first.getUTCFullYear() + 3, first.getUTCMonth(), first.getUTCDate()));
    var y = 0;
    while (due <= today) {
      var date = addDays(due, -Math.floor(r() * 25));
      miles += Math.round(perYear * (0.7 + r() * 0.6));
      var reading = miles;
      if (opts.rollbackAt === y) reading = Math.round(miles * 0.62);
      var advisories = [];
      var nAdv = Math.floor(r() * 3);
      for (var a = 0; a < nAdv; a++) advisories.push({ text: ADVISORIES[Math.floor(r() * ADVISORIES.length)], type: 'ADVISORY', dangerous: false });
      var fail = opts.failAt ? opts.failAt.indexOf(y) >= 0 : r() < 0.18;
      if (fail) {
        var f = FAILS[Math.floor(r() * FAILS.length)];
        tests.push(test(date, 'FAILED', null, reading, [{ text: f[0], type: f[1], dangerous: false }].concat(advisories), r));
        date = addDays(date, 1 + Math.floor(r() * 6));
        advisories = advisories.slice(0, 1);
      }
      tests.push(test(date, 'PASSED', addDays(due, 364 + (y === 0 ? 1 : 0)), reading, advisories, r));
      due = new Date(Date.UTC(due.getUTCFullYear() + 1, due.getUTCMonth(), due.getUTCDate()));
      y++;
    }
    return tests.reverse();
  }
  function test(date, result, expiry, odo, defects, r) {
    return {
      completedDate: date.toISOString(),
      testResult: result,
      expiryDate: expiry ? iso(expiry) : null,
      odometerValue: String(odo),
      odometerUnit: 'MI',
      odometerResultType: 'READ',
      motTestNumber: String(100000000000 + Math.floor(r() * 899999999999)),
      dataSource: 'DVSA',
      defects: defects
    };
  }

  function vehicle(reg, today) {
    reg = String(reg || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    today = today || new Date();
    var r = rng(hash(reg));
    var opts = {};
    var model = MODELS[Math.floor(r() * MODELS.length)];
    var colour = COLOURS[Math.floor(r() * COLOURS.length)];
    if (reg === 'OB21DEX') { model = ['FORD', 'FOCUS ST-LINE', 'Petrol', 999]; colour = 'Grey'; opts = { failAt: [1], rollbackAt: 2, perYear: 11000 }; }
    if (reg === 'AB12CDE') { model = ['TOYOTA', 'YARIS', 'Petrol', 1329]; colour = 'Silver'; opts = { failAt: [], perYear: 6200 }; }
    var first = firstRegFromPlate(reg, r);
    var tests = buildTests(first, today, r, opts);
    var mot = {
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
      motTests: tests
    };
    if (!tests.length) mot.motTestDueDate = iso(new Date(Date.UTC(first.getUTCFullYear() + 3, first.getUTCMonth(), first.getUTCDate())));
    return mot;
  }

  function hpi(reg) {
    reg = String(reg || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    var r = rng(hash('hpi:' + reg));
    var finance = r() < 0.15, writeOff = r() < 0.08, stolen = r() < 0.02;
    if (reg === 'OB21DEX') { finance = true; writeOff = false; stolen = false; }
    if (reg === 'AB12CDE') { finance = false; writeOff = false; stolen = false; }
    return {
      provider: 'demo',
      checkedAt: new Date().toISOString(),
      outstandingFinance: finance ? { agreements: 1, lender: 'Northgate Motor Finance', agreementType: 'Personal Contract Purchase', term: 48, startDate: '2024-04-12' } : null,
      stolen: stolen ? { reportedDate: '2026-08-03', policeForce: 'Metropolitan Police' } : null,
      writeOff: writeOff ? { category: 'S', lossDate: '2023-11-20', description: 'Structurally damaged, repaired' } : null,
      scrapped: false,
      imported: false,
      exported: false,
      plateChanges: reg === 'OB21DEX' ? [{ date: '2025-06-02', from: 'FD21 KXR' }] : [],
      colourChanges: [],
      previousKeepers: reg === 'OB21DEX' ? 3 : 1 + Math.floor(r() * 4),
      vinLast4: String(1000 + Math.floor(r() * 8999))
    };
  }

  return { vehicle: vehicle, hpi: hpi, SAMPLES: ['OB21DEX', 'AB12CDE'] };
});
