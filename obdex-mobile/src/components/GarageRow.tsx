import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { T } from './ui';
import { brand, isLight, useTheme } from '@/lib/theme';

export function GarageRow() {
  const p = useTheme();
  return (
    <Pressable onPress={() => router.push('/garage')} accessibilityRole="button"
      style={({ pressed }) => ({ backgroundColor: p.row, borderRadius: 10, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: brand.orange, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="home" size={20} color="#FFFFFF" />
      </View>
      <T weight="semibold" size={15} style={{ flex: 1 }}>My Garage</T>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isLight(p) ? '#1C1C1C' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="chevron-right" size={20} color={isLight(p) ? '#FFFFFF' : '#1C1C1C'} />
      </View>
    </Pressable>
  );
}
