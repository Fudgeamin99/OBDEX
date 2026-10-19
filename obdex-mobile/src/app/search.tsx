import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { GarageRow } from '@/components/GarageRow';
import { Button, Header, noOutline, Screen, T } from '@/components/ui';
import { prettyReg, title } from '@/lib/analysis';
import { fetchVehicle, isValidReg, LookupError, usingDemoData } from '@/lib/api';
import { clean, SAMPLE_REGS } from '@/lib/mock';
import { useStore } from '@/lib/store';
import { brand, font, useTheme } from '@/lib/theme';

export default function Search() {
  const p = useTheme();
  const { state, dispatch } = useStore();
  const { next = 'mot' } = useLocalSearchParams<{ next?: 'mot' | 'hpi' | 'garage' }>();
  const [reg, setReg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function go(value = reg) {
    const r = clean(value);
    if (!isValidReg(r)) { setError('Enter a UK registration, like AB12 CDE.'); return; }
    setError('');
    if (next === 'garage') {
      setBusy(true);
      try {
        const v = await fetchVehicle(r);
        dispatch({ type: 'addCar', car: { reg: v.registration, make: title(v.mot.make), model: title(v.mot.model), colour: v.mot.primaryColour, year: new Date(v.mot.firstUsedDate).getUTCFullYear(), addedAt: new Date().toISOString() } });
        router.back();
      } catch (e) {
        setError(e instanceof LookupError ? e.message : 'The lookup did not complete. Try again.');
      } finally { setBusy(false); }
      return;
    }
    router.push(`/${next === 'hpi' ? 'hpi' : 'mot'}/${r}` as Href);
  }

  const suggestions = state.recent.length ? state.recent.slice(0, 4) : usingDemoData ? SAMPLE_REGS : [];
  return (
    <Screen>
      <Header title={next === 'garage' ? 'Add Car' : 'Search'} />
      {next !== 'garage' && <GarageRow />}
      <View style={{ marginTop: 28, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: p.fieldBorder, borderRadius: 30, height: 58, paddingHorizontal: 20, gap: 10 }}>
          <TextInput
            value={reg} onChangeText={(t) => { setReg(t.toUpperCase()); setError(''); }}
            placeholder="Enter Registration" placeholderTextColor={p.textMuted}
            autoCapitalize="characters" autoCorrect={false} autoFocus returnKeyType="go" maxLength={10}
            onSubmitEditing={() => go()}
            style={{ flex: 1, color: p.text, fontFamily: reg ? font.bold : font.regular, fontSize: reg ? 18 : 15, letterSpacing: reg ? 1.5 : 0, height: '100%' , ...noOutline }}
            accessibilityLabel="Vehicle registration"
          />
          <Feather name="search" size={18} color={p.textMuted} />
        </View>
        {error ? <T size={13} style={{ color: p.bad }}>{error}</T> : null}
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Button label="Refresh" icon="refresh-cw" variant="outline" style={{ flex: 1, borderRadius: 30, borderColor: brand.orange }} onPress={() => { setReg(''); setError(''); }} />
          <Button label={next === 'garage' ? 'Add' : 'Search'} icon="search" loading={busy} style={{ flex: 1, borderRadius: 30 }} onPress={() => go()} />
        </View>
        {suggestions.length > 0 && (
          <View style={{ gap: 10, marginTop: 12 }}>
            <T muted size={13}>{state.recent.length ? 'Recent' : 'Try a sample'}</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {suggestions.map((r) => (
                <Pressable key={r} onPress={() => { setReg(prettyReg(r)); go(r); }}
                  style={{ backgroundColor: '#F8D21C', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 12 }}>
                  <T weight="bold" size={14} style={{ color: '#111111', letterSpacing: 1 }}>{prettyReg(r)}</T>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
