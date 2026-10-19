import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CheckShell } from '@/components/CheckShell';
import { MileageChart } from '@/components/MileageChart';
import { MotHistory } from '@/components/MotHistory';
import { InfoTable, T, Tabs } from '@/components/ui';
import { fmtDate, mileage, num, vehicleRows } from '@/lib/analysis';
import { clean } from '@/lib/mock';
import { useTheme } from '@/lib/theme';

type Tab = 'details' | 'mot' | 'mileage';

export default function MotCheck() {
  const p = useTheme();
  const reg = clean(useLocalSearchParams<{ reg: string }>().reg ?? '');
  const [tab, setTab] = useState<Tab>('details');
  return (
    <CheckShell reg={reg} heading="MOT and Tax Check">
      {(r) => {
        const m = mileage(r.mot.motTests);
        return (
          <>
            <Tabs tabs={[['details', 'Vehicle Details'], ['mot', 'MOT History'], ['mileage', 'Mileage']]} value={tab} onChange={setTab} />
            {tab === 'details' && <InfoTable rows={vehicleRows(r)} />}
            {tab === 'mot' && <MotHistory tests={r.mot.motTests} />}
            {tab === 'mileage' && (
              <View style={{ gap: 14 }}>
                {m.points.length > 1 ? <MileageChart points={m.points} /> : <T muted>Not enough MOT readings to chart yet.</T>}
                {m.latest && <T size={14}>Last recorded <T weight="semibold">{num(m.latest.miles)} miles</T> on {fmtDate(m.latest.date)}.</T>}
                {m.drops.length ? (
                  <T size={13.5} style={{ color: p.bad }}>The reading went down from {num(m.drops[0].from)} to {num(m.drops[0].to)} miles at the {fmtDate(m.drops[0].date)} MOT. This can mean the mileage was altered. Run an HPI check before you buy.</T>
                ) : m.points.length > 1 ? <T muted size={13.5}>Readings go up at every MOT, which is what you want to see.</T> : null}
              </View>
            )}
          </>
        );
      }}
    </CheckShell>
  );
}
