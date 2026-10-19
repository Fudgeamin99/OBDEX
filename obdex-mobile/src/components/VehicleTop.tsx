import { Feather } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';
import { IconBox, noOutline, PlateBar, T } from './ui';
import { fmtDate, motStatus, prettyReg, taxStatus, title, type Level } from '@/lib/analysis';
import { useStore } from '@/lib/store';
import type { VehicleReport } from '@/lib/types';
import { font, useTheme } from '@/lib/theme';

/** Plate bar, Last Service field and the Tax Due / MOT Expire pair. */
export function VehicleTop({ r }: { r: VehicleReport }) {
  const p = useTheme();
  const { state, dispatch } = useStore();
  const tax = taxStatus(r);
  const mot = motStatus(r);
  const color = (l: Level) => (l === 'good' ? p.good : l === 'warn' ? p.warn : l === 'bad' ? p.bad : p.textMuted);
  return (
    <View style={{ gap: 22 }}>
      <PlateBar reg={prettyReg(r.registration)} label={`${title(r.mot.make)} ${title(r.mot.model)}`} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: p.fieldBorder, borderRadius: 8, paddingHorizontal: 8, height: 54, width: '86%' }}>
        <IconBox name="tool" />
        <TextInput
          value={state.lastService[r.registration] ?? ''}
          onChangeText={(v) => dispatch({ type: 'lastService', reg: r.registration, value: v })}
          placeholder="Last Service" placeholderTextColor={p.textMuted}
          style={{ flex: 1, color: p.text, fontFamily: font.regular, fontSize: 15, height: '100%' , ...noOutline }}
          accessibilityLabel="Last service date"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {[
          { label: 'Tax Due', date: tax.due, status: tax.label, level: tax.level },
          { label: 'MOT Expire', date: mot.expiry, status: mot.label, level: mot.level },
        ].map((d) => (
          <View key={d.label} style={{ flex: 1, gap: 10 }}>
            <T weight="semibold" size={14}>{d.label}</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <IconBox name="calendar" size={30} />
              <T size={14}>{d.date ? fmtDate(d.date) : '—'}</T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name={d.level === 'good' ? 'check-circle' : d.level === 'info' ? 'info' : 'alert-circle'} size={13} color={color(d.level)} />
              <T size={12} style={{ color: color(d.level) }}>{d.status}</T>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
