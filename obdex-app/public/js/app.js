/* OBDEX web app: registration lookup, MOT history and HPI report. */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var sourceChip = document.getElementById('source-chip');
  var state = { view: 'home', reg: '', data: null, tab: 'overview', error: '' };
  var DAY = 86400000;

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cleanReg(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function prettyReg(r) {
    r = cleanReg(r);
    if (/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(r)) return r.slice(0, 4) + ' ' + r.slice(4);
    if (/^[A-Z]\d{1,3}[A-Z]{3}$/.test(r)) return r.slice(0, r.length - 3) + ' ' + r.slice(-3);
    return r;
  }
  function title(s) { return String(s || '').toLowerCase().replace(/\b([a-z])/g, function (m) { return m.toUpperCase(); }); }
  function fmtDate(d, opts) {
    if (!d) return 'Unknown';
    return new Date(d).toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  function num(n) { return Math.round(n).toLocaleString('en-GB'); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  var ICON = {
    good: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bad: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    warn: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="8" cy="12.5" r="1.3" fill="currentColor"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="4" r="1.3" fill="currentColor"/><path d="M8 7v5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    chev: '<svg class="chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // ---------- data ----------
  function fetchVehicle(reg) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch('api/vehicle/' + encodeURIComponent(reg), { signal: ctrl && ctrl.signal, headers: { Accept: 'application/json' } })
      .then(function (res) {
        var type = res.headers.get('content-type') || '';
        if (type.indexOf('application/json') < 0) throw { offline: true };
        return res.json().then(function (body) {
          if (!res.ok) throw { message: body.error || 'Lookup failed.' };
          return body;
        });
      })
      .catch(function (err) {
        // No API reachable (static hosting or preview): use demo data in the browser.
        if (err && err.message && !err.offline && err.name !== 'TypeError' && err.name !== 'AbortError') throw err;
        return { registration: reg, sources: { mot: 'demo', hpi: 'demo' }, mot: OBDEXMock.vehicle(reg), hpi: OBDEXMock.hpi(reg) };
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  function analyse(d) {
    var today = Date.now();
    var mot = d.mot || {};
    var tests = (mot.motTests || []).slice().sort(function (a, b) { return new Date(b.completedDate) - new Date(a.completedDate); });

    // MOT status from the latest pass.
    var lastPass = tests.filter(function (t) { return t.testResult === 'PASSED' && t.expiryDate; })[0];
    var status;
    if (lastPass) {
      var exp = new Date(lastPass.expiryDate).getTime() + DAY - 1;
      var days = Math.floor((exp - today) / DAY);
      status = days < 0 ? { level: 'bad', label: 'Expired', detail: 'Expired ' + fmtDate(lastPass.expiryDate) }
        : days <= 30 ? { level: 'warn', label: 'Due soon', detail: 'Expires ' + fmtDate(lastPass.expiryDate) + ', ' + plural(days, 'day') + ' left' }
        : { level: 'good', label: 'Valid', detail: 'Until ' + fmtDate(lastPass.expiryDate) };
      status.expiry = lastPass.expiryDate; status.days = days;
    } else if (mot.motTestDueDate) {
      var due = new Date(mot.motTestDueDate).getTime();
      status = due > today ? { level: 'good', label: 'Not due', detail: 'First MOT due ' + fmtDate(mot.motTestDueDate) }
        : { level: 'bad', label: 'Overdue', detail: 'First MOT was due ' + fmtDate(mot.motTestDueDate) };
    } else {
      status = { level: 'warn', label: 'No record', detail: 'No MOT on record' };
    }

    // Mileage readings in miles, oldest first, one per day.
    var seen = {};
    var miles = tests.slice().reverse().filter(function (t) {
      return t.odometerResultType === 'READ' && t.odometerValue;
    }).map(function (t) {
      var v = Number(t.odometerValue);
      if (t.odometerUnit === 'KM' || t.odometerUnit === 'km') v = v * 0.621371;
      return { date: t.completedDate, t: new Date(t.completedDate).getTime(), miles: v };
    }).filter(function (p) {
      var k = p.date.slice(0, 10); if (seen[k]) return false; seen[k] = 1; return true;
    });
    var drops = [];
    var maxSoFar = 0;
    miles.forEach(function (p) {
      if (p.miles < maxSoFar) { p.drop = true; drops.push({ date: p.date, from: maxSoFar, to: p.miles }); }
      maxSoFar = Math.max(maxSoFar, p.miles);
    });
    var latest = miles[miles.length - 1];
    var start = new Date(mot.firstUsedDate || mot.registrationDate || (miles[0] && miles[0].date)).getTime();
    var perYear = latest && start ? latest.miles / Math.max(0.5, (latest.t - start) / (365.25 * DAY)) : null;

    var fails = tests.filter(function (t) { return t.testResult === 'FAILED'; }).length;
    var checks = hpiChecks(d.hpi || {}, drops, mot);
    var issues = checks.filter(function (c) { return c.level === 'bad' || c.level === 'warn'; });
    if (status.level !== 'good') issues.unshift({ level: status.level, name: 'MOT ' + status.label.toLowerCase() });

    return { mot: mot, tests: tests, status: status, miles: miles, drops: drops, latest: latest, perYear: perYear, fails: fails, checks: checks, issues: issues };
  }

  function hpiChecks(h, drops, mot) {
    var c = [];
    function add(level, name, detail) { c.push({ level: level, name: name, detail: detail }); }
    var f = h.outstandingFinance;
    f ? add('bad', 'Outstanding finance', plural(f.agreements || 1, 'agreement') + (f.lender ? ' with ' + f.lender : '') + (f.agreementType ? ' (' + f.agreementType + ')' : '') + '. The lender may own the car until it is settled.')
      : add('good', 'Outstanding finance', 'No finance recorded against this vehicle.');
    h.stolen ? add('bad', 'Stolen', 'Reported stolen' + (h.stolen.reportedDate ? ' on ' + fmtDate(h.stolen.reportedDate) : '') + (h.stolen.policeForce ? ' to ' + h.stolen.policeForce : '') + '. Do not buy it; contact the police.')
      : add('good', 'Stolen', 'Not recorded as stolen on the Police National Computer.');
    h.writeOff ? add('bad', 'Insurance write-off', 'Category ' + h.writeOff.category + (h.writeOff.description ? ': ' + h.writeOff.description : '') + (h.writeOff.lossDate ? '. Loss date ' + fmtDate(h.writeOff.lossDate) : '') + '.')
      : add('good', 'Insurance write-off', 'No write-off category recorded.');
    drops.length ? add('bad', 'Mileage', 'Reading dropped from ' + num(drops[0].from) + ' to ' + num(drops[0].to) + ' miles at the ' + fmtDate(drops[0].date) + ' MOT. Possible clocking or a recording error.')
      : add('good', 'Mileage', 'MOT mileage readings go up in order.');
    h.scrapped ? add('bad', 'Scrapped', 'Recorded as scrapped by the DVLA.') : add('good', 'Scrapped', 'Not recorded as scrapped.');
    (h.imported || h.exported) ? add('warn', 'Import / export', h.imported ? 'Imported vehicle.' : 'Marked as exported.') : add('good', 'Import / export', 'Not imported or exported.');
    var pc = h.plateChanges || [];
    pc.length ? add('warn', 'Plate changes', plural(pc.length, 'change') + ', most recently from ' + pc[0].from + ' on ' + fmtDate(pc[0].date) + '.')
      : add('good', 'Plate changes', 'No previous registrations.');
    var cc = h.colourChanges || [];
    cc.length ? add('warn', 'Colour changes', plural(cc.length, 'change') + ' on record.') : add('good', 'Colour changes', 'Still ' + (mot.primaryColour || 'its original colour').toLowerCase() + ', as first registered.');
    if (mot.hasOutstandingRecall === 'Yes') add('warn', 'Safety recall', 'There is an outstanding manufacturer recall. Ask the seller for proof it was fixed.');
    if (h.previousKeepers != null) add('info', 'Previous keepers', plural(h.previousKeepers, 'previous keeper') + ' on record.');
    return c;
  }

  // ---------- views ----------
  function render() {
    var demo = state.data && (state.data.sources.mot === 'demo' || state.data.sources.hpi === 'demo');
    sourceChip.hidden = !(state.view === 'report' && demo);
    sourceChip.textContent = 'Demo data';
    if (state.view === 'home') app.innerHTML = homeView();
    else if (state.view === 'loading') app.innerHTML = '<div class="loading"><div class="loader" aria-hidden="true"></div><p>Checking ' + esc(prettyReg(state.reg)) + '…</p></div>';
    else if (state.view === 'error') app.innerHTML = errorView();
    else app.innerHTML = reportView(state.data, analyse(state.data));
    bind();
  }

  function plateInput(value) {
    return '<label class="plate" for="reg-input">' +
      '<span class="plate-band"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">' + stars() + '</svg>UK</span>' +
      '<input id="reg-input" name="reg" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="10" placeholder="ENTER REG" aria-label="Vehicle registration" value="' + esc(value) + '">' +
      '</label>';
  }
  function stars() {
    var s = '';
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      s += '<circle cx="' + (11 + 8 * Math.cos(a)).toFixed(1) + '" cy="' + (11 + 8 * Math.sin(a)).toFixed(1) + '" r="1.2" fill="#f8d21c"/>';
    }
    return s;
  }

  function homeView() {
    var recent = (store('obdex.recent') || []).filter(function (r) { return OBDEXMock.SAMPLES.indexOf(r) < 0; }).slice(0, 6);
    return '<section class="home">' +
      '<div class="hero">' +
        '<p class="eyebrow">UK vehicle check</p>' +
        '<h1 class="display">Know the car <em>before</em> you buy it</h1>' +
        '<p class="lede">Enter a registration to see its full MOT history, mileage record and HPI history check in seconds.</p>' +
        '<form class="search" id="search" novalidate>' + plateInput(state.reg ? prettyReg(state.reg) : '') +
          '<p class="form-error" id="form-error" hidden></p>' +
          '<button class="btn" type="submit">Check vehicle <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M1 1l6 6-6 6M9 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg></button>' +
        '</form>' +
        '<div class="samples"><span>Try a sample:</span>' + OBDEXMock.SAMPLES.map(function (r) {
          return '<button class="chip-plate rear" type="button" data-reg="' + r + '">' + prettyReg(r) + '</button>';
        }).join('') + '</div>' +
      '</div>' +
      (recent.length ? '<div class="recent"><p class="eyebrow">Recent checks</p><div class="recent-list">' + recent.map(function (r) {
        return '<button class="chip-plate rear" type="button" data-reg="' + esc(r) + '">' + esc(prettyReg(r)) + '</button>';
      }).join('') + '</div></div>' : '') +
      '<div class="features">' +
        '<article class="feature"><span class="tag tag-good">Free</span><h2>MOT history</h2><ul>' +
          '<li>Every test result since the first MOT</li><li>Failures, advisories and dangerous defects</li><li>MOT expiry date and days remaining</li><li>Recorded mileage at each test</li></ul></article>' +
        '<article class="feature"><span class="tag tag-accent">Full check</span><h2>HPI history check</h2><ul>' +
          '<li>Outstanding finance</li><li>Stolen and write-off records (Cat A, B, S, N)</li><li>Mileage discrepancies</li><li>Plate changes, colour changes and keepers</li></ul></article>' +
      '</div>' +
    '</section>';
  }

  function errorView() {
    return '<section class="error-view"><p class="eyebrow">' + esc(prettyReg(state.reg)) + '</p><h1>No result</h1><p>' + esc(state.error) + '</p>' +
      '<button class="btn btn-ghost" type="button" data-home>Check another vehicle</button></section>';
  }

  function reportView(d, a) {
    var m = a.mot;
    var name = [m.manufactureDate || m.firstUsedDate ? new Date(m.firstUsedDate || m.manufactureDate).getUTCFullYear() : '', title(m.make), title(m.model)].join(' ').trim();
    var verdict = a.issues.some(function (i) { return i.level === 'bad'; }) ? 'bad' : a.issues.length ? 'warn' : 'good';
    var vText = verdict === 'good' ? 'No problems found' : plural(a.issues.length, 'thing') + ' to check';
    var vSub = verdict === 'good' ? 'Nothing on record suggests a problem with this vehicle.' : a.issues.map(function (i) { return i.name; }).join(' · ');
    var hpiFlags = a.checks.filter(function (c) { return c.level === 'bad' || c.level === 'warn'; }).length;

    return '<section class="report">' +
      '<button class="back" type="button" data-home>← New check</button>' +
      '<div class="report-grid">' +
        '<aside class="rail">' +
          '<div class="vehicle"><span class="plate-static">' + esc(prettyReg(d.registration)) + '</span><h1>' + esc(name || 'Unknown vehicle') + '</h1></div>' +
          '<dl class="specs">' +
            spec('Colour', title(m.primaryColour)) + spec('Fuel', title(m.fuelType)) +
            spec('Engine', m.engineSize ? num(m.engineSize) + ' cc' : '') + spec('First registered', fmtDate(m.firstUsedDate || m.registrationDate)) +
          '</dl>' +
          '<div class="verdict ' + verdict + '"><h2>' + vText + '</h2><p>' + esc(vSub) + '</p></div>' +
          '<div class="tiles">' +
            tile('MOT', a.status.level, a.status.label, a.status.detail) +
            tile('Mileage', a.drops.length ? 'bad' : '', a.latest ? num(a.latest.miles) + ' mi' : 'None', a.perYear ? '~' + num(a.perYear) + ' a year' : 'No readings') +
            tile('History', hpiFlags ? 'bad' : 'good', hpiFlags ? plural(hpiFlags, 'flag') : 'Clear', 'HPI check') +
          '</div>' +
        '</aside>' +
        '<div class="detail">' +
          '<div class="tabs" role="tablist">' +
            tab('overview', 'Overview') + tab('mot', 'MOT history (' + a.tests.length + ')') + tab('hpi', 'HPI check') +
          '</div>' +
          '<div class="panel" role="tabpanel">' + (state.tab === 'mot' ? motPanel(a) : state.tab === 'hpi' ? hpiPanel(d, a) : overviewPanel(d, a)) + '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }
  function spec(k, v) { return '<div><dt>' + k + '</dt><dd>' + esc(v || 'Unknown') + '</dd></div>'; }
  function tile(label, level, big, sub) { return '<div class="tile ' + level + '"><p class="eyebrow">' + label + '</p><span class="big">' + esc(big) + '</span><span class="sub">' + esc(sub) + '</span></div>'; }
  function tab(id, label) { return '<button class="tab" role="tab" type="button" data-tab="' + id + '" aria-selected="' + (state.tab === id) + '">' + esc(label) + '</button>'; }

  function overviewPanel(d, a) {
    var flagged = a.checks.filter(function (c) { return c.level !== 'good'; });
    var lastTest = a.tests[0];
    return '<div class="card"><div class="card-head"><h3>Mileage history</h3><span class="tag ' + (a.drops.length ? 'tag-bad' : 'tag-good') + '">' + (a.drops.length ? 'Discrepancy' : 'Consistent') + '</span></div>' +
        (a.miles.length > 1 ? chart(a.miles) : '<p class="none">Not enough MOT readings to chart yet.</p>') + '</div>' +
      (flagged.length ? '<div class="card"><div class="card-head"><h3>Needs a look</h3></div><ul class="checks">' + flagged.map(checkRow).join('') + '</ul></div>' : '') +
      (lastTest ? '<div class="card"><div class="card-head"><h3>Latest MOT</h3><span class="mono" style="color:var(--muted);font-size:.85rem">' + fmtDate(lastTest.completedDate) + '</span></div>' + testBody(lastTest) + '</div>' : '') +
      sourceNotice(d);
  }

  function motPanel(a) {
    if (!a.tests.length) return '<p class="notice">No MOT tests on record. ' + esc(a.status.detail) + '.</p>';
    return '<ul class="tests">' + a.tests.map(function (t, i) {
      var pass = t.testResult === 'PASSED';
      var odo = t.odometerResultType === 'READ' ? num(t.odometerValue) + ' ' + (t.odometerUnit === 'KM' ? 'km' : 'mi') : 'Not read';
      var counts = countDefects(t.defects || []);
      return '<li><details class="test"' + (i === 0 ? ' open' : '') + '><summary>' +
        '<span class="tag ' + (pass ? 'tag-good' : 'tag-bad') + '">' + (pass ? 'Pass' : 'Fail') + '</span>' +
        '<span><span class="date">' + fmtDate(t.completedDate) + '</span><br><span class="meta mono">' + odo + (counts ? ' · ' + counts : '') + '</span></span>' +
        ICON.chev + '</summary><div class="test-body">' + testBody(t) + '</div></details></li>';
    }).join('') + '</ul>';
  }
  function countDefects(list) {
    var fails = list.filter(function (x) { return /MAJOR|DANGEROUS|FAIL/.test(x.type); }).length;
    var adv = list.filter(function (x) { return x.type === 'ADVISORY'; }).length;
    var parts = [];
    if (fails) parts.push(plural(fails, 'failure'));
    if (adv) parts.push(plural(adv, 'advisory').replace('advisorys', 'advisories'));
    return parts.join(', ');
  }
  function testBody(t) {
    var defects = (t.defects || []).slice().sort(function (x, y) { return rank(y) - rank(x); });
    return '<dl class="kv">' +
      kv('Result', t.testResult === 'PASSED' ? 'Pass' : 'Fail') +
      kv('Mileage', t.odometerResultType === 'READ' ? num(t.odometerValue) + ' ' + (t.odometerUnit === 'KM' ? 'km' : 'mi') : 'Not read') +
      (t.expiryDate ? kv('Expiry', fmtDate(t.expiryDate)) : '') +
      (t.motTestNumber ? kv('Test number', t.motTestNumber) : '') +
      '</dl>' +
      (defects.length ? '<ul class="defects">' + defects.map(function (x) {
        var type = x.dangerous ? 'DANGEROUS' : x.type;
        var cls = /DANGEROUS|MAJOR|FAIL/.test(type) ? 'tag-bad' : type === 'MINOR' || type === 'PRS' ? 'tag-warn' : 'tag-muted';
        return '<li class="defect"><span class="tag ' + cls + '">' + esc(title(type)) + '</span><span>' + esc(x.text) + '</span></li>';
      }).join('') + '</ul>' : '<p class="none">No defects or advisories recorded.</p>');
  }
  function rank(x) { return x.dangerous || x.type === 'DANGEROUS' ? 4 : /MAJOR|FAIL/.test(x.type) ? 3 : x.type === 'MINOR' || x.type === 'PRS' ? 2 : 1; }
  function kv(k, v) { return '<div><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>'; }

  function hpiPanel(d, a) {
    return '<div class="card"><div class="card-head"><h3>History check</h3><span class="mono" style="color:var(--muted);font-size:.85rem">' + plural(a.checks.length, 'check') + '</span></div>' +
      '<ul class="checks">' + a.checks.map(checkRow).join('') + '</ul></div>' + sourceNotice(d);
  }
  function checkRow(c) {
    var label = { good: 'Clear', warn: 'Check', bad: 'Alert', info: 'Info' }[c.level];
    return '<li class="check ' + c.level + '"><span class="ico">' + ICON[c.level] + '</span><div><h4>' + esc(c.name) + '</h4><p>' + esc(c.detail) + '</p></div><span class="status">' + label + '</span></li>';
  }
  function sourceNotice(d) {
    var parts = [];
    if (d.sources.mot === 'demo') parts.push('MOT history');
    if (d.sources.hpi === 'demo') parts.push('HPI check');
    if (!parts.length) return '';
    return '<p class="notice"><strong>Sample data.</strong> The ' + parts.join(' and ') + ' shown here ' + (parts.length > 1 ? 'are' : 'is') + ' generated for demonstration. Connect the DVSA MOT History API and an HPI data provider to show real records.</p>';
  }

  // Mileage chart: x = test date, y = miles, both linear from the data range.
  function chart(pts) {
    var W = Math.round(Math.min(640, Math.max(300, app.clientWidth - 64))), H = W < 480 ? 200 : 220, L = 40, R = 64, T = 14, B = 28;
    var t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    var maxM = Math.max.apply(null, pts.map(function (p) { return p.miles; }));
    var step = niceStep(maxM / 4);
    var top = Math.ceil(maxM / step) * step || step;
    function x(t) { return L + (t1 === t0 ? 0 : (t - t0) / (t1 - t0)) * (W - L - R); }
    function y(v) { return T + (1 - v / top) * (H - T - B); }
    var g = '';
    for (var v = 0; v <= top + 1; v += step) {
      g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text class="axis" x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (v >= 1000 ? Math.round(v / 1000) + 'k' : v) + '</text>';
    }
    var y0 = new Date(t0).getUTCFullYear(), y1 = new Date(t1).getUTCFullYear();
    var every = Math.max(1, Math.ceil((y1 - y0 + 1) / 6));
    for (var yr = y0; yr <= y1; yr += every) {
      var tx = Date.UTC(yr, 0, 1); if (tx < t0) tx = t0;
      g += '<text class="axis" x="' + x(tx) + '" y="' + (H - 8) + '" text-anchor="middle">' + yr + '</text>';
    }
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(p.miles).toFixed(1); }).join(' ');
    var area = line + ' L' + x(t1) + ' ' + y(0) + ' L' + x(t0) + ' ' + y(0) + ' Z';
    var dots = pts.map(function (p, i) {
      var cls = 'pt' + (p.drop ? ' drop' : i === pts.length - 1 ? ' end' : '');
      return '<circle class="' + cls + '" cx="' + x(p.t).toFixed(1) + '" cy="' + y(p.miles).toFixed(1) + '" r="' + (i === pts.length - 1 || p.drop ? 5 : 3.5) + '"><title>' + fmtDate(p.date) + ': ' + num(p.miles) + ' miles</title></circle>';
    }).join('');
    var last = pts[pts.length - 1];
    return '<div class="chart-wrap"><svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Recorded mileage at each MOT">' + g +
      '<path class="area" d="' + area + '"/><path class="line" d="' + line + '"/>' + dots +
      '<text class="endlabel" x="' + (x(last.t) + 10) + '" y="' + (y(last.miles) + 4) + '">' + num(last.miles) + '</text></svg></div>';
  }
  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
    var n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }

  // ---------- actions ----------
  function check(reg) {
    reg = cleanReg(reg);
    if (!/^[A-Z0-9]{2,8}$/.test(reg)) {
      var e = document.getElementById('form-error');
      if (e) { e.textContent = 'Enter a UK registration, like AB12 CDE.'; e.hidden = false; }
      return;
    }
    state.reg = reg; state.view = 'loading'; state.tab = 'overview';
    render();
    fetchVehicle(reg).then(function (data) {
      state.data = data; state.view = 'report';
      var recent = (store('obdex.recent') || []).filter(function (r) { return r !== reg; });
      recent.unshift(reg); store('obdex.recent', recent.slice(0, 8));
      setHash(reg);
      render(); window.scrollTo(0, 0);
    }).catch(function (err) {
      state.error = (err && err.message) || 'The lookup did not complete. Check your connection and try again.';
      state.view = 'error'; render();
    });
  }
  function goHome() { state.view = 'home'; state.data = null; setHash(''); render(); window.scrollTo(0, 0); }
  function setHash(h) { try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) { /* not allowed in some frames */ } }

  function bind() {
    var form = document.getElementById('search');
    if (form) form.addEventListener('submit', function (ev) { ev.preventDefault(); check(document.getElementById('reg-input').value); });
    var input = document.getElementById('reg-input');
    if (input) input.addEventListener('input', function () { var e = document.getElementById('form-error'); if (e) e.hidden = true; });
    app.querySelectorAll('[data-reg]').forEach(function (b) { b.addEventListener('click', function () { check(b.getAttribute('data-reg')); }); });
    app.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { state.tab = b.getAttribute('data-tab'); render(); }); });
    app.querySelectorAll('[data-home]').forEach(function (b) { b.addEventListener('click', goHome); });
  }
  document.querySelectorAll('header [data-home]').forEach(function (b) { b.addEventListener('click', goHome); });

  var initial = cleanReg(location.hash.slice(1));
  if (/^[A-Z0-9]{2,8}$/.test(initial)) check(initial); else render();
})();
