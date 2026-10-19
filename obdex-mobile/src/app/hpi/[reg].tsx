import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CheckShell } from '@/components/CheckShell';
import { Button, InfoTable, T, Tabs } from '@/components/ui';
import { historyChecks, plural, vehicleRows, type Level } from '@/lib/analysis';
import { clean } from '@/lib/mock';
import { useStore } from '@/lib/store';
import { brand, useTheme } from '@/lib/theme';

type Tab = 'checks' | 'details';

export default function HpiCheck() {
  const p = useTheme();
  const { state } = useStore();
  const reg = clean(useLocalSearchParams<{ reg: string }>().reg ?? '');
  const [tab, setTab] = useState<Tab>('checks');
  const locked = state.plan === 'bronze';
  const color = (l: Level) => (l === 'good' ? p.good : l === 'warn' ? p.warn : l === 'bad' ? p.bad : p.textMuted);
  const icon = (l: Level) => (l === 'good' ? 'check' : l === 'bad' ? 'x' : l === 'warn' ? 'alert-triangle' : 'info') as 'check';
  return (
    <CheckShell reg={reg} heading="HPI Check">
      {(r) => {
        const checks = historyChecks(r.hpi, r);
        const flags = checks.filter((c) => c.level === 'bad' || c.level === 'warn');
        return (
          <>
            <Tabs tabs={[['checks', 'History Checks'], ['details', 'Vehicle Details']]} value={tab} onChange={setTab} />
            {tab === 'details' ? <InfoTable rows={vehicleRows(r)} /> : locked ? (
              <View style={{ backgroundColor: p.card, borderRadius: 12, padding: 20, gap: 14, alignItems: 'center' }}>
                <Feather name="lock" size={28} color={brand.orange} />
                <T weight="semibold" size={17} style={{ color: '#FFFFFF', textAlign: 'center' }}>Full history check</T>
                <T size={13.5} style={{ color: '#D7DCDF', textAlign: 'center', lineHeight: 21 }}>
                  See outstanding finance, stolen and write-off records, plate changes, keepers and more with Silver or Gold.
                </T>
                <Button label="See plans" style={{ alignSelf: 'stretch' }} onPress={() => router.push(`/subscription?next=/hpi/${r.registration}` as Href)} />
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <View style={{ backgroundColor: flags.some((f) => f.level === 'bad') ? p.bad : flags.length ? p.warn : p.good, borderRadius: 10, padding: 16 }}>
                  <T weight="semibold" size={16} style={{ color: '#FFFFFF' }}>{flags.length ? `${plural(flags.length, 'thing')} to check` : 'No problems found'}</T>
                  <T size={13} style={{ color: 'rgba(255,255,255,0.9)' }}>{flags.length ? flags.map((f) => f.name).join(' · ') : 'Nothing on record suggests a problem with this vehicle.'}</T>
                </View>
                <View style={{ backgroundColor: p.table, borderRadius: 10, paddingHorizontal: 16, borderWidth: p.table === '#000000' ? 0 : 1, borderColor: p.line }}>
                  {checks.map((c, i) => (
                    <View key={c.name} style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderTopColor: p.line }}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color(c.level) + '26', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name={icon(c.level)} size={15} color={color(c.level)} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <T weight="semibold" size={14}>{c.name}</T>
                        <T muted size={12.5} style={{ lineHeight: 18 }}>{c.detail}</T>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        );
      }}
    </CheckShell>
  );
}
