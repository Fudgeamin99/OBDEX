import { View } from 'react-native';
import { T } from './ui';
import { brand } from '@/lib/theme';

export function Avatar({ name, size = 48 }: { name?: string; size?: number }) {
  const initials = (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#263238', borderWidth: 2, borderColor: brand.orange, alignItems: 'center', justifyContent: 'center' }}>
      <T weight="semibold" size={size * 0.36} style={{ color: '#FFFFFF' }}>{initials || '?'}</T>
    </View>
  );
}
