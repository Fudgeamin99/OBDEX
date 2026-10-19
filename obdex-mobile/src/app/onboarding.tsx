import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Screen, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { brand, font, useTheme } from '@/lib/theme';

export default function Onboarding() {
  const p = useTheme();
  const { dispatch } = useStore();
  return (
    <Screen footer={<Button label="Continue" onPress={() => { dispatch({ type: 'onboarded' }); router.replace('/welcome'); }} />}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
        <Image source={require('../../assets/onboarding.png')} style={{ width: '100%', aspectRatio: 750 / 716 }} contentFit="contain" />
        <View style={{ gap: 14, alignItems: 'center' }}>
          <Text style={{ fontFamily: font.semibold, fontSize: 22, lineHeight: 32, color: p.text, textAlign: 'center' }}>
            <Text style={{ color: brand.orange }}>Get</Text> peace of mind before buying your next vehicle.
          </Text>
          <T muted size={14} style={{ textAlign: 'center', lineHeight: 23 }}>
            Instantly access accurate vehicle history checks to make sure the car you're interested in has a clean history, clear finance, and is safe to drive.
          </T>
        </View>
      </View>
    </Screen>
  );
}
