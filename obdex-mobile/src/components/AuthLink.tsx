import { Text } from 'react-native';
import { brand, font, useTheme } from '@/lib/theme';

export function AuthLink({ lead, action, onPress }: { lead: string; action: string; onPress: () => void }) {
  const p = useTheme();
  return (
    <Text style={{ fontFamily: font.medium, fontSize: 15, color: p.text, textAlign: 'center' }}>
      {lead}{' '}
      <Text onPress={onPress} style={{ color: brand.orange, fontFamily: font.semibold }} accessibilityRole="link">{action}</Text>
    </Text>
  );
}
