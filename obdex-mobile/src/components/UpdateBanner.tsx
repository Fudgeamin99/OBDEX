import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { T } from '@/components/ui';
import { installUpdate, useUpdate } from '@/lib/updates';
import { brand, useTheme } from '@/lib/theme';

export function UpdateBanner() {
  const p = useTheme();
  const update = useUpdate();
  if (update.status !== 'available') return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: p.card, borderRadius: 10, padding: 14, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: brand.orange }}>
      <Feather name="download" size={20} color={brand.orange} />
      <View style={{ flex: 1 }}>
        <T weight="semibold" size={14}>A new version of OBDEX is ready</T>
        <T muted size={12}>Tap Update to download and install it.</T>
      </View>
      <Pressable onPress={() => installUpdate(update.url)} accessibilityRole="button"
        style={({ pressed }) => ({ backgroundColor: brand.orange, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14, opacity: pressed ? 0.85 : 1 })}>
        <T weight="semibold" size={13} style={{ color: '#FFFFFF' }}>Update</T>
      </Pressable>
    </View>
  );
}
