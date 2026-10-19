import { useCallback, useEffect, useState } from 'react';
import { fetchVehicle, LookupError } from './api';
import { useStore } from './store';
import type { VehicleReport } from './types';

const cache = new Map<string, VehicleReport>();

export function useVehicle(reg: string) {
  const { dispatch } = useStore();
  const [data, setData] = useState<VehicleReport | null>(cache.get(reg) ?? null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!cache.has(reg));

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetchVehicle(reg);
      cache.set(reg, r); setData(r);
      dispatch({ type: 'recent', reg: r.registration });
    } catch (e) {
      setError(e instanceof LookupError ? e.message : 'The lookup did not complete. Try again.');
    } finally { setLoading(false); }
  }, [reg]);

  useEffect(() => { if (!cache.has(reg)) load(); }, [reg]);
  return { data, error, loading, reload: load };
}
