import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { LogoTile, Screen, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

// Splash Screen: logo, name and a spinner while saved data loads.
export default function Splash() {
  const p = useTheme();
  const { state } = useStore();
  useEffect(() => {
    if (!state.hydrated) return;
    const t = setTimeout(() => {
      router.replace(!state.onboarded ? '/onboarding' : !state.user ? '/welcome' : '/home');
    }, 1100);
    return () => clearTimeout(t);
  }, [state.hydrated]);
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <LogoTile size={88} />
        <T weight="semibold" size={26} style={{ letterSpacing: 0.5 }}>OBDEX</T>
      </View>
      <ActivityIndicator color={p.text} style={{ marginBottom: 24 }} />
    </Screen>
  );
}
