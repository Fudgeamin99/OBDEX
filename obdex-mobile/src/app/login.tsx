import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { AuthLink } from '@/components/AuthLink';
import { Button, Field, LogoTile, Screen, T } from '@/components/ui';
import { AuthError, signIn } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { brand, font, useTheme } from '@/lib/theme';

export default function Login() {
  const p = useTheme();
  const { dispatch } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError('');
    try {
      dispatch({ type: 'signIn', user: await signIn(username, password) });
      router.replace('/home');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Sign-in did not work. Try again.');
    } finally { setBusy(false); }
  }
  const social = (name: string) => Alert.alert(`${name} sign-in`, `${name} sign-in will work once OBDEX accounts are connected. For now, log in with a username and password.`);

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 28, marginTop: 40, marginBottom: 36 }}>
        <LogoTile size={84} />
        <T weight="semibold" size={20}>Get Back To Account</T>
      </View>
      <View style={{ gap: 18 }}>
        <Field icon="user" placeholder="Username" autoCapitalize="none" autoComplete="username" value={username} onChangeText={setUsername} />
        <Field icon="lock" placeholder="Password" secure autoComplete="password" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
        {error ? <T size={13} style={{ color: p.bad }}>{error}</T> : null}
        <Button label="Login" onPress={submit} loading={busy} style={{ marginTop: 6 }} />
        <Pressable onPress={() => Alert.alert('Forgot password', 'Password reset will be emailed to you once OBDEX accounts are connected.')}>
          <T weight="semibold" size={15} style={{ textAlign: 'center', marginTop: 8 }}>Forgot Password?</T>
        </Pressable>
        <View style={{ marginTop: 12 }}><AuthLink lead="Don't have account?" action="Sign Up" onPress={() => router.replace('/register')} /></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: p.textMuted }} />
          <T size={13}>Or Continue with</T>
          <View style={{ flex: 1, height: 1, backgroundColor: p.textMuted }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
          {([['Google', 'google'], ['Apple', 'apple']] as const).map(([label, icon]) => (
            <Pressable key={label} onPress={() => social(label)} style={{ flex: 1, maxWidth: 150, height: 54, borderRadius: 8, borderWidth: 1, borderColor: p.fieldBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <FontAwesome name={icon} size={22} color={icon === 'google' ? '#4285F4' : p.text} />
              <T weight="medium" size={15} style={{ fontFamily: font.medium }}>{label}</T>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
