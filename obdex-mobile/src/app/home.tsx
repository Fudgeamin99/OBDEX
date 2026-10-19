import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { GarageRow } from '@/components/GarageRow';
import { UpdateBanner } from '@/components/UpdateBanner';
import { LogoTile, Screen, T } from '@/components/ui';
import { prettyReg } from '@/lib/analysis';
import { useStore } from '@/lib/store';
import { brand, useTheme } from '@/lib/theme';

type Tile = { label: string; icon: ComponentProps<typeof MaterialCommunityIcons>['name']; orange: boolean; go: () => void };

export default function Home() {
  const p = useTheme();
  const { state } = useStore();
  const tiles: Tile[] = [
    { label: 'Free MOT & Tax check', icon: 'radioactive', orange: true, go: () => router.push('/search?next=mot' as Href) },
    { label: 'HPI Check', icon: 'check-circle', orange: false, go: () => router.push('/search?next=hpi' as Href) },
    { label: 'Buying new car Checklist', icon: 'clipboard-text', orange: false, go: () => router.push('/checklist') },
    { label: 'Coming Soon', icon: 'bullhorn', orange: true, go: () => Alert.alert('Coming soon', 'Car valuations are on the way. We will let you know when they are ready.') },
  ];
  return (
    <Screen>
      <View pointerEvents="none" style={{ position: 'absolute', top: -120, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: p.decor }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 40 }}>
        <LogoTile size={42} />
        <View style={{ flex: 1 }}>
          <T muted size={13}>Welcome Back,</T>
          <T weight="semibold" size={20} style={{ lineHeight: 26 }}>{state.user?.name ?? 'Driver'}</T>
        </View>
        <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Profile"><Avatar name={state.user?.name} /></Pressable>
      </View>

      <UpdateBanner />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {tiles.map((t) => (
          <Pressable key={t.label} onPress={t.go} accessibilityRole="button"
            style={({ pressed }) => ({ width: '47%', flexGrow: 1, aspectRatio: 1.03, borderRadius: 10, backgroundColor: t.orange ? brand.orange : p.card,
              alignItems: 'center', justifyContent: 'center', gap: 14, padding: 12, opacity: pressed ? 0.85 : 1 })}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={t.icon} size={28} color={t.orange ? brand.orange : '#263238'} />
            </View>
            <T weight="semibold" size={13.5} style={{ color: '#FFFFFF', textAlign: 'center' }}>{t.label}</T>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 20 }}><GarageRow /></View>

      {state.recent.length > 0 && (
        <View style={{ marginTop: 28, gap: 12 }}>
          <T weight="semibold" size={15}>Recent checks</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {state.recent.slice(0, 6).map((r) => (
              <Pressable key={r} onPress={() => router.push(`/mot/${r}` as Href)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8D21C', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 10 }}>
                <T weight="bold" size={14} style={{ color: '#111111', letterSpacing: 1 }}>{prettyReg(r)}</T>
                <Feather name="chevron-right" size={14} color="#111111" />
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}
