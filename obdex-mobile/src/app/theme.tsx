import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Header, Screen, T } from '@/components/ui';
import { useStore, type ThemePref } from '@/lib/store';
import { brand, useTheme } from '@/lib/theme';

const OPTIONS: [ThemePref, string][] = [['light', 'Light Theme'], ['dark', 'Dark Theme'], ['system', 'Match my phone']];

export default function ThemeScreen() {
  const p = useTheme();
  const { state, dispatch } = useStore();
  const [choice, setChoice] = useState<ThemePref>(state.theme);
  return (
    <Screen footer={<Button label="Update" onPress={() => { dispatch({ type: 'theme', theme: choice }); router.back(); }} />}>
      <Header title="Theme" />
      <View style={{ gap: 6 }}>
        {OPTIONS.map(([id, label]) => {
          const on = choice === id;
          return (
            <Pressable key={id} onPress={() => setChoice(id)} accessibilityRole="radio" accessibilityState={{ checked: on }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12 }}>
              <T size={15} style={{ flex: 1 }}>{label}</T>
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: on ? brand.orange : p.text, alignItems: 'center', justifyContent: 'center' }}>
                {on && <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: brand.orange }} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
