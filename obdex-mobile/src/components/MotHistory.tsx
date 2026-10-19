import { View } from 'react-native';
import { T } from './ui';
import { fmtDate, num, plural, sortedTests, title } from '@/lib/analysis';
import type { Defect, MotTest } from '@/lib/types';
import { useTheme } from '@/lib/theme';

const rank = (d: Defect) => (d.dangerous || d.type === 'DANGEROUS' ? 4 : /MAJOR|FAIL/.test(d.type) ? 3 : d.type === 'MINOR' || d.type === 'PRS' ? 2 : 1);

export function MotHistory({ tests }: { tests: MotTest[] }) {
  const p = useTheme();
  if (!tests.length) return <T muted>No MOT tests on record yet. Cars need their first MOT three years after registration.</T>;
  return (
    <View style={{ gap: 14 }}>
      {sortedTests(tests).map((t) => {
        const pass = t.testResult === 'PASSED';
        const defects = (t.defects ?? []).slice().sort((a, b) => rank(b) - rank(a));
        return (
          <View key={t.motTestNumber ?? t.completedDate} style={{ backgroundColor: p.table, borderRadius: 10, padding: 16, gap: 12, borderWidth: p.table === '#000000' ? 0 : 1, borderColor: p.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ backgroundColor: pass ? p.good : p.bad, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10 }}>
                <T weight="semibold" size={12} style={{ color: '#FFFFFF' }}>{pass ? 'PASS' : 'FAIL'}</T>
              </View>
              <T weight="semibold" size={15} style={{ flex: 1 }}>{fmtDate(t.completedDate)}</T>
              <T muted size={12.5}>{t.odometerResultType === 'READ' ? `${num(Number(t.odometerValue))} ${t.odometerUnit === 'KM' ? 'km' : 'mi'}` : 'Not read'}</T>
            </View>
            {t.expiryDate ? <T muted size={12.5}>Expires {fmtDate(t.expiryDate)}{t.motTestNumber ? `  ·  Test ${t.motTestNumber}` : ''}</T> : null}
            {defects.length ? (
              <View style={{ gap: 8 }}>
                {defects.map((d, i) => {
                  const r = rank(d);
                  const c = r >= 3 ? p.bad : r === 2 ? p.warn : p.textMuted;
                  return (
                    <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                      <T weight="semibold" size={11} style={{ color: c, width: 78, paddingTop: 1 }}>{title(d.dangerous ? 'DANGEROUS' : d.type)}</T>
                      <T size={12.5} style={{ flex: 1, lineHeight: 18 }}>{d.text}</T>
                    </View>
                  );
                })}
              </View>
            ) : <T muted size={12.5}>No defects or advisories.</T>}
          </View>
        );
      })}
      <T muted size={12}>{plural(tests.length, 'test')} on record from the DVSA.</T>
    </View>
  );
}
