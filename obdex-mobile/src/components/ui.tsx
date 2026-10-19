import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, font, isLight, useTheme } from '@/lib/theme';

export type IconName = ComponentProps<typeof Feather>['name'];

/** Full-screen page with the design's soft corner circles. */
export function Screen({ children, scroll = true, footer, decor = true, padded = true }: {
  children: ReactNode; scroll?: boolean; footer?: ReactNode; decor?: boolean; padded?: boolean;
}) {
  const p = useTheme();
  const insets = useSafeAreaInsets();
  const body = { paddingHorizontal: padded ? 24 : 0, paddingTop: insets.top + 12, paddingBottom: footer ? 16 : insets.bottom + 24 };
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <StatusBar style={isLight(p) ? 'dark' : 'light'} />
      {decor && (
        <>
          <View pointerEvents="none" style={[s.circle, { backgroundColor: p.decor, top: -90, left: -90 }]} />
          <View pointerEvents="none" style={[s.circle, { backgroundColor: p.decor, bottom: 120, right: -110 }]} />
        </>
      )}
      {scroll ? (
        <ScrollView contentContainerStyle={[body, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      ) : (
        <View style={[body, { flex: 1 }]}>{children}</View>
      )}
      {footer && <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>{footer}</View>}
    </View>
  );
}

/** Round white back button with centred title, as on every inner screen. */
export function Header({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const p = useTheme();
  return (
    <View style={s.header}>
      <Pressable
        accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')))}
        style={[s.back, { backgroundColor: isLight(p) ? '#1C1C1C' : '#FFFFFF' }]}>
        <Feather name="chevron-left" size={22} color={isLight(p) ? '#FFFFFF' : '#1C1C1C'} />
      </Pressable>
      <Text style={[s.headerTitle, { color: p.text }]} numberOfLines={1}>{title}</Text>
      <View style={s.headerRight}>{right}</View>
    </View>
  );
}

export function Button({ label, onPress, variant = 'primary', icon, loading, style, disabled }: {
  label: string; onPress?: () => void; variant?: 'primary' | 'outline'; icon?: IconName; loading?: boolean;
  style?: StyleProp<ViewStyle>; disabled?: boolean;
}) {
  const p = useTheme();
  const primary = variant === 'primary';
  const color = primary ? p.onAccent : p.text;
  return (
    <Pressable
      accessibilityRole="button" onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [s.btn, primary ? { backgroundColor: brand.orange } : { borderWidth: 1.5, borderColor: p.fieldBorder },
        { opacity: pressed || disabled ? 0.75 : 1 }, style]}>
      {loading ? <ActivityIndicator color={color} /> : (
        <>
          {icon && <Feather name={icon} size={17} color={color} />}
          <Text style={[s.btnText, { color }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Bordered field with the orange-tinted icon box on the left. */
export function Field({ icon, secure, right, style, ...props }: TextInputProps & { icon: IconName; secure?: boolean; right?: ReactNode }) {
  const p = useTheme();
  const [hidden, setHidden] = useState(true);
  return (
    <View style={[s.field, { borderColor: p.fieldBorder, backgroundColor: p.field }, style as StyleProp<ViewStyle>]}>
      <IconBox name={icon} />
      <TextInput
        placeholderTextColor={p.textMuted}
        secureTextEntry={secure && hidden}
        style={[s.fieldInput, { color: p.text }]}
        {...props}
      />
      {secure && (
        <Pressable onPress={() => setHidden(!hidden)} hitSlop={10} accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
          <Feather name={hidden ? 'eye-off' : 'eye'} size={20} color={p.text} />
        </Pressable>
      )}
      {right}
    </View>
  );
}

export function IconBox({ name, size = 36, filled }: { name: IconName; size?: number; filled?: boolean }) {
  const p = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? '#FFFFFF' : p.iconBox }}>
      <Feather name={name} size={size * 0.5} color={brand.orange} />
    </View>
  );
}

export function LogoTile({ size = 84 }: { size?: number }) {
  return <Image source={require('../../assets/logo-tile.png')} style={{ width: size, height: size, borderRadius: size * 0.19 }} contentFit="cover" accessibilityLabel="OBDEX" />;
}

/** Orange registration bar used at the top of check screens. */
export function PlateBar({ reg, label }: { reg: string; label?: string }) {
  return (
    <View style={s.plateBar}>
      <View style={s.plateIcon}><MaterialCommunityIcons name="car" size={24} color={brand.orange} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.plateText}>{reg}</Text>
        {label ? <Text style={s.plateSub} numberOfLines={1}>{label}</Text> : null}
      </View>
    </View>
  );
}

/** Black key/value table from the MOT and HPI screens. */
export function InfoTable({ rows }: { rows: [string, string][] }) {
  const p = useTheme();
  return (
    <View style={[s.table, { backgroundColor: p.table, borderColor: p.line, borderWidth: isLight(p) ? 1 : 0 }]}>
      {rows.map(([k, v]) => (
        <View key={k} style={s.tableRow}>
          <Text style={[s.tableKey, { color: p.text }]}>{k}</Text>
          <Text style={[s.tableVal, { color: p.text }]}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string][]; value: T; onChange: (t: T) => void }) {
  const p = useTheme();
  return (
    <View style={s.tabs}>
      {tabs.map(([id, label]) => {
        const on = id === value;
        return (
          <Pressable key={id} onPress={() => onChange(id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={s.tab}>
            <Text style={[s.tabText, { color: on ? brand.orange : p.textMuted }]}>{label}</Text>
            <View style={[s.tabLine, { backgroundColor: on ? brand.orange : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function T({ children, style, muted, weight = 'regular', size = 14, numberOfLines }: {
  children: ReactNode; style?: StyleProp<TextStyle>; muted?: boolean; weight?: keyof typeof font; size?: number; numberOfLines?: number;
}) {
  const p = useTheme();
  return <Text numberOfLines={numberOfLines} style={[{ fontFamily: font[weight], fontSize: size, color: muted ? p.textMuted : p.text }, style]}>{children}</Text>;
}

// Browsers draw a focus ring inside our own bordered fields; hide it on web.
export const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as object;

export const s = StyleSheet.create({
  circle: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, minHeight: 44 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: font.medium, fontSize: 18 },
  headerRight: { width: 40, alignItems: 'flex-end' },
  btn: { height: 52, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  btnText: { fontFamily: font.semibold, fontSize: 15 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, height: 58 },
  fieldInput: { flex: 1, minWidth: 0, fontFamily: font.regular, fontSize: 15, paddingVertical: 0, height: '100%', ...noOutline },
  plateBar: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: brand.orange, borderRadius: 8, padding: 8, minHeight: 58 },
  plateIcon: { width: 42, height: 42, borderRadius: 6, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  plateText: { fontFamily: font.semibold, fontSize: 15, color: '#FFFFFF', letterSpacing: 0.5 },
  plateSub: { fontFamily: font.regular, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  table: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, gap: 12 },
  tableKey: { fontFamily: font.regular, fontSize: 12.5, flexShrink: 1 },
  tableVal: { fontFamily: font.medium, fontSize: 13, textAlign: 'right', flexShrink: 1 },
  tabs: { flexDirection: 'row', gap: 22, marginBottom: 14 },
  tab: { paddingTop: 4 },
  tabText: { fontFamily: font.semibold, fontSize: 13.5 },
  tabLine: { height: 3, borderRadius: 2, marginTop: 6 },
});
