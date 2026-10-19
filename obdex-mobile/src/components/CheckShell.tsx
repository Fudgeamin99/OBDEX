import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Button, Header, Screen, T } from './ui';
import { VehicleTop } from './VehicleTop';
import { title } from '@/lib/analysis';
import { useStore } from '@/lib/store';
import type { VehicleReport } from '@/lib/types';
import { brand, useTheme } from '@/lib/theme';
import { useVehicle } from '@/lib/useVehicle';

/** Loading, error and shared top section for the MOT and HPI screens. */
export function CheckShell({ reg, heading, children }: { reg: string; heading: string; children: (r: VehicleReport) => ReactNode }) {
  const p = useTheme();
  const { state, dispatch } = useStore();
  const { data, error, loading, reload } = useVehicle(reg);
  const saved = data ? state.garage.some((c) => c.reg === data.registration) : false;
  const toggle = () => {
    if (!data) return;
    if (saved) dispatch({ type: 'removeCar', reg: data.registration });
    else dispatch({ type: 'addCar', car: { reg: data.registration, make: title(data.mot.make), model: title(data.mot.model), colour: data.mot.primaryColour, year: new Date(data.mot.firstUsedDate).getUTCFullYear(), addedAt: new Date().toISOString() } });
  };
  const right = data ? (
    <Pressable onPress={toggle} hitSlop={10} accessibilityLabel={saved ? 'Remove from My Garage' : 'Save to My Garage'}>
      <Feather name={saved ? 'bookmark' : 'bookmark'} size={22} color={saved ? brand.orange : p.textMuted} />
    </Pressable>
  ) : undefined;

  const demo = data && (data.sources.mot === 'demo' || data.sources.hpi === 'demo' || data.sources.dvla === 'demo');
  return (
    <Screen>
      <Header title={heading} right={right} />
      {loading && !data ? (
        <View style={{ alignItems: 'center', paddingVertical: 80, gap: 14 }}>
          <ActivityIndicator color={brand.orange} size="large" />
          <T muted>Checking {reg}…</T>
        </View>
      ) : error && !data ? (
        <View style={{ gap: 16, paddingVertical: 40 }}>
          <T weight="semibold" size={18}>No result for {reg}</T>
          <T muted>{error}</T>
          <Button label="Try again" variant="outline" onPress={reload} />
        </View>
      ) : data ? (
        <View style={{ gap: 26 }}>
          <VehicleTop r={data} />
          <View>{children(data)}</View>
          {demo && (
            <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: p.line, borderRadius: 10, padding: 14 }}>
              <T size={12.5} muted><T size={12.5} weight="semibold">Sample data. </T>These results are generated for demonstration until the OBDEX server is connected to the DVSA, DVLA and HPI services.</T>
            </View>
          )}
        </View>
      ) : null}
    </Screen>
  );
}
