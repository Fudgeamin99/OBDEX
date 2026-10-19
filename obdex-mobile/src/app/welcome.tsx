import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, LogoTile, Screen, T } from '@/components/ui';

// Login/Register choice screen.
export default function Welcome() {
  return (
    <Screen
      footer={
        <View style={{ gap: 14 }}>
          <Button label="Login" onPress={() => router.push('/login')} />
          <Button label="Register" variant="outline" onPress={() => router.push('/register')} />
        </View>
      }>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 80 }}>
        <LogoTile size={88} />
        <T weight="semibold" size={26} style={{ letterSpacing: 0.5 }}>OBDEX</T>
      </View>
    </Screen>
  );
}
