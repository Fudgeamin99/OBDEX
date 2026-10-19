import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Screen, T } from '@/components/ui';
import { brand, useTheme } from '@/lib/theme';

// Confetti positions from the design: [x%, y%, kind, colour]
const BITS: [number, number, 'dot' | 'dash', string][] = [
  [48, 4, 'dot', '#FFFFFF'], [12, 22, 'dot', '#FFFFFF'], [26, 18, 'dot', '#F39BD3'], [70, 16, 'dot', '#FFFFFF'],
  [62, 10, 'dash', brand.orange], [8, 40, 'dash', '#8FD3F4'], [88, 38, 'dash', '#8FD3F4'], [22, 48, 'dot', '#FFFFFF'],
  [76, 30, 'dot', '#FFFFFF'], [80, 58, 'dot', '#FFFFFF'], [6, 74, 'dot', '#FFFFFF'], [20, 80, 'dash', brand.orange],
  [68, 84, 'dot', '#F39BD3'], [44, 94, 'dot', '#FFFFFF'],
];

export default function Success() {
  const p = useTheme();
  return (
    <Screen footer={<Button label="Get Started" onPress={() => router.replace('/home')} />}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
          {BITS.map(([x, y, kind, color], i) => (
            <View key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, backgroundColor: color === '#FFFFFF' ? p.textMuted : color,
              ...(kind === 'dot' ? { width: 9, height: 9, borderRadius: 5 } : { width: 18, height: 3, borderRadius: 2, transform: [{ rotate: i % 2 ? '-40deg' : '-35deg' }] }) }} />
          ))}
          <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: brand.orange, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check" size={64} color="#FFFFFF" />
          </View>
        </View>
        <View style={{ gap: 14, alignItems: 'center', paddingHorizontal: 12 }}>
          <T weight="semibold" size={20} style={{ textAlign: 'center', lineHeight: 30 }}>Your account has been created successfully.</T>
          <T muted size={14} style={{ textAlign: 'center', lineHeight: 22 }}>You can now check any UK vehicle's MOT, tax and history, and save cars to your garage.</T>
        </View>
      </View>
    </Screen>
  );
}
