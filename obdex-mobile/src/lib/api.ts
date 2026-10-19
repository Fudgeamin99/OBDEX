import { clean, mockDvla, mockReport } from './mock';
import type { VehicleReport } from './types';

// The OBDEX server (obdex-app) holds the DVSA, DVLA and HPI keys. Point the
// app at it with EXPO_PUBLIC_API_URL, e.g. https://api.obdex.co.uk
const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export class LookupError extends Error {}

export const isValidReg = (reg: string) => /^[A-Z0-9]{2,8}$/.test(clean(reg));

export async function fetchVehicle(regIn: string): Promise<VehicleReport> {
  const reg = clean(regIn);
  if (!isValidReg(reg)) throw new LookupError('Enter a UK registration, like AB12 CDE.');
  if (!API_URL) {
    await new Promise((r) => setTimeout(r, 450)); // feel like a real lookup
    return mockReport(reg);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${API_URL}/api/vehicle/${encodeURIComponent(reg)}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new LookupError(body?.error ?? 'The lookup did not complete. Try again.');
    const report = body as VehicleReport;
    // Until the server has a DVLA key it sends no tax data; fill it so the screen stays complete.
    if (!report.dvla && report.sources.dvla === 'demo') report.dvla = mockDvla(report.mot);
    return report;
  } catch (e) {
    if (e instanceof LookupError) throw e;
    throw new LookupError('Could not reach OBDEX. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

export const usingDemoData = !API_URL;
