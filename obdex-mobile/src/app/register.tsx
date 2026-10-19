import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AuthLink } from '@/components/AuthLink';
import { Button, Field, IconBox, LogoTile, Screen, T } from '@/components/ui';
import { AuthError, register } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

export default function Register() {
  const p = useTheme();
  const { dispatch } = useStore();
  const [f, setF] = useState({ email: '', name: '', gender: '', password: '', confirm: '' });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  async function submit() {
    setBusy(true); setError('');
    try {
      dispatch({ type: 'signIn', user: await register(f) });
      router.replace('/success');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Registration did not work. Try again.');
    } finally { setBusy(false); }
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 28, marginTop: 24, marginBottom: 28 }}>
        <LogoTile size={84} />
        <T weight="semibold" size={20}>Register Account</T>
      </View>
      <View style={{ gap: 16 }}>
        <Field icon="mail" placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={f.email} onChangeText={set('email')} />
        <Field icon="user" placeholder="Full Name" autoComplete="name" value={f.name} onChangeText={set('name')} />
        <View>
          <Pressable onPress={() => setOpen(!open)} accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: p.fieldBorder, borderRadius: 8, paddingHorizontal: 8, height: 58 }}>
            <IconBox name="users" />
            <T size={15} muted={!f.gender} style={{ flex: 1 }}>{f.gender || 'Gender'}</T>
            <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color={p.text} />
          </Pressable>
          {open && (
            <View style={{ borderWidth: 1, borderColor: p.line, borderRadius: 8, marginTop: 6, backgroundColor: p.bgRaised }}>
              {GENDERS.map((g) => (
                <Pressable key={g} onPress={() => { set('gender')(g); setOpen(false); }} style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
                  <T size={15}>{g}</T>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <Field icon="lock" placeholder="Password" secure autoComplete="new-password" value={f.password} onChangeText={set('password')} />
        <Field icon="lock" placeholder="Confirm Password" secure autoComplete="new-password" value={f.confirm} onChangeText={set('confirm')} />
        {error ? <T size={13} style={{ color: p.bad }}>{error}</T> : null}
        <Button label="Register" onPress={submit} loading={busy} style={{ marginTop: 6 }} />
        <View style={{ marginTop: 8 }}><AuthLink lead="Already have an account?" action="Login" onPress={() => router.replace('/login')} /></View>
      </View>
    </Screen>
  );
}
