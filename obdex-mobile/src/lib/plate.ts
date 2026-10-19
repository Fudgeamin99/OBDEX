// UK number plate format check. Mirrors obdex-app/public/js/plate.js.
// It rejects plates that cannot exist; whether a vehicle is actually
// registered is confirmed by the DVLA and DVSA lookup on the server.

export type PlateCheck =
  | { valid: true; reg: string; format: 'current' | 'prefix' | 'suffix' | 'dateless'; pretty: string }
  | { valid: false; reg: string; reason: string };

// DVLA memory-tag area letters (X is used for export plates).
const AREA = 'ABCDEFGHKLMNOPRSVWXY';

export const cleanPlate = (reg: string) => String(reg || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Highest age identifiers issued so far: March plates use YY, September plates YY+50.
function latestAgeIds(now: Date) {
  const y = now.getUTCFullYear() % 100;
  const m = now.getUTCMonth() + 1;
  return { march: m >= 3 ? y : y - 1, september: m >= 9 ? y + 50 : y + 49 };
}

const fail = (reg: string, reason: string): PlateCheck => ({ valid: false, reg, reason });

export function checkPlate(input: string, now = new Date()): PlateCheck {
  const reg = cleanPlate(input);
  if (!reg) return fail(reg, 'Enter a registration number.');
  if (reg.length > 7) return fail(reg, 'UK registrations are at most 7 characters.');

  let m = /^([A-Z])([A-Z])(\d{2})([A-Z]{3})$/.exec(reg); // AB12 CDE, 2001 onwards
  if (m) {
    if (!AREA.includes(m[1]) || /[IQZ]/.test(m[2])) return fail(reg, `${m[1]}${m[2]} is not a DVLA area code.`);
    if (/[IQ]/.test(m[4])) return fail(reg, 'The last three letters never use I or Q.');
    const age = parseInt(m[3], 10);
    const latest = latestAgeIds(now);
    if (!((age >= 2 && age <= latest.march) || (age >= 51 && age <= latest.september))) {
      return fail(reg, `"${m[3]}" is not a UK age identifier that has been issued.`);
    }
    return { valid: true, reg, format: 'current', pretty: `${reg.slice(0, 4)} ${reg.slice(4)}` };
  }
  m = /^([A-Z])(\d{1,3})([A-Z]{3})$/.exec(reg); // A123 BCD, 1983 to 2001
  if (m) {
    if (/[IOQUZ]/.test(m[1])) return fail(reg, `${m[1]} was never used as a year letter.`);
    return { valid: true, reg, format: 'prefix', pretty: `${m[1]}${m[2]} ${m[3]}` };
  }
  m = /^([A-Z]{3})(\d{1,3})([A-Z])$/.exec(reg); // ABC 123D, 1963 to 1983
  if (m) {
    if (/[IOQUZ]/.test(m[3])) return fail(reg, `${m[3]} was never used as a year letter.`);
    return { valid: true, reg, format: 'suffix', pretty: `${m[1]} ${m[2]}${m[3]}` };
  }
  m = /^([A-Z]{1,3})(\d{1,4})$/.exec(reg) ?? /^(\d{1,4})([A-Z]{1,3})$/.exec(reg); // dateless and NI
  if (m) {
    if (/^0/.test(m[1]) || /^0/.test(m[2])) return fail(reg, 'Registration numbers never start with 0.');
    return { valid: true, reg, format: 'dateless', pretty: `${m[1]} ${m[2]}` };
  }
  return fail(reg, 'That is not a valid UK registration format. Check it and try again, like AB12 CDE.');
}
