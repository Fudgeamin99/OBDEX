/* UK number plate format check, shared by the server and the browser.
 * Mirrors obdex-mobile/src/lib/plate.ts. It rejects plates that cannot exist;
 * whether a vehicle is actually registered is confirmed by the DVLA lookup. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OBDEXPlate = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // DVLA memory-tag area letters (X is used for export plates).
  var AREA = 'ABCDEFGHKLMNOPRSVWXY';

  function clean(reg) {
    return String(reg || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  // Highest age identifiers issued so far: March plates use YY, September plates YY+50.
  function latestAgeIds(now) {
    var y = now.getUTCFullYear() % 100;
    var m = now.getUTCMonth() + 1;
    return { march: m >= 3 ? y : y - 1, september: m >= 9 ? y + 50 : y + 49 };
  }

  function check(input, now) {
    var reg = clean(input);
    now = now || new Date();
    if (!reg) return fail(reg, 'Enter a registration number.');
    if (reg.length > 7) return fail(reg, 'UK registrations are at most 7 characters.');

    // Current style, 2001 onwards: AB12 CDE
    var m = /^([A-Z])([A-Z])(\d{2})([A-Z]{3})$/.exec(reg);
    if (m) {
      if (AREA.indexOf(m[1]) < 0 || /[IQZ]/.test(m[2])) return fail(reg, m[1] + m[2] + ' is not a DVLA area code.');
      if (/[IQ]/.test(m[4])) return fail(reg, 'The last three letters never use I or Q.');
      var age = parseInt(m[3], 10);
      var latest = latestAgeIds(now);
      var ok = (age >= 2 && age <= latest.march) || (age >= 51 && age <= latest.september);
      if (!ok) return fail(reg, '"' + m[3] + '" is not a UK age identifier that has been issued.');
      return pass(reg, 'current', reg.slice(0, 4) + ' ' + reg.slice(4));
    }
    // Prefix style, 1983 to 2001: A123 BCD
    m = /^([A-Z])(\d{1,3})([A-Z]{3})$/.exec(reg);
    if (m) {
      if (/[IOQUZ]/.test(m[1])) return fail(reg, m[1] + ' was never used as a year letter.');
      return pass(reg, 'prefix', m[1] + m[2] + ' ' + m[3]);
    }
    // Suffix style, 1963 to 1983: ABC 123D
    m = /^([A-Z]{3})(\d{1,3})([A-Z])$/.exec(reg);
    if (m) {
      if (/[IOQUZ]/.test(m[3])) return fail(reg, m[3] + ' was never used as a year letter.');
      return pass(reg, 'suffix', m[1] + ' ' + m[2] + m[3]);
    }
    // Dateless and Northern Ireland plates: ABC 123, 1234 AB, NIZ 1234
    m = /^([A-Z]{1,3})(\d{1,4})$/.exec(reg) || /^(\d{1,4})([A-Z]{1,3})$/.exec(reg);
    if (m) {
      if (/^0/.test(m[1]) || /^0/.test(m[2])) return fail(reg, 'Registration numbers never start with 0.');
      return pass(reg, 'dateless', m[1] + ' ' + m[2]);
    }
    return fail(reg, 'That is not a valid UK registration format. Check it and try again, like AB12 CDE.');
  }

  function pass(reg, format, pretty) { return { valid: true, reg: reg, format: format, pretty: pretty }; }
  function fail(reg, reason) { return { valid: false, reg: reg, reason: reason }; }

  return { check: check, clean: clean };
});
