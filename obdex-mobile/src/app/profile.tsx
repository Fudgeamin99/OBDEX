import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button, Header, IconBox, Screen, T, type IconName } from '@/components/ui';
import { useStore } from '@/lib/store';
import { brand, useTheme } from '@/lib/theme';

export default function Profile() {
  const p = useTheme();
  const { state, dispatch } = useStore();
  const plan = state.plan[0].toUpperCase() + state.plan.slice(1);
  const rows: [IconName, string, Href, string?][] = [
    ['star', 'Subscription', '/subscription', plan],
    ['sun', 'Theme', '/theme'],
    ['globe', 'App Language', '/info?page=language', 'English (UK)'],
    ['help-circle', 'Support', '/info?page=support'],
    ['alert-circle', 'Terms & Conditions', '/info?page=terms'],
  ];
  return (
    <Screen footer={<Button label="Logout" icon="log-out" onPress={() => { dispatch({ type: 'signOut' }); router.replace('/welcome'); }} />}>
      <Header title="Profile" />
      <View style={{ alignItems: 'center', gap: 14, marginBottom: 30 }}>
        <Avatar name={state.user?.name} size={104} />
        <T weight="semibold" size={20}>{state.user?.name ?? 'Driver'}</T>
        {state.user?.email ? <T muted size={13}>{state.user.email}</T> : null}
      </View>
      <View>
        {rows.map(([icon, label, href, value]) => (
          <Pressable key={label} onPress={() => router.push(href)} accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: p.line, opacity: pressed ? 0.7 : 1 })}>
            <Feather name={icon} size={18} color={brand.orange} />
            <T size={15} style={{ flex: 1 }}>{label}</T>
            {value ? <T muted size={13}>{value}</T> : null}
            <Feather name="chevron-right" size={18} color={p.text} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
