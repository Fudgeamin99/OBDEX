import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import { Button, Header, Screen, T } from '@/components/ui';
import { prettyReg } from '@/lib/analysis';
import { useStore, type Car } from '@/lib/store';
import { brand, useTheme } from '@/lib/theme';

const SHADES: Record<string, string> = { BLACK: '#2B2B2B', WHITE: '#E9E9E9', GREY: '#8A8F94', SILVER: '#C4C8CC', BLUE: '#2F5EA8', RED: '#C0262D', GREEN: '#2E6B45' };

function CarCard({ car }: { car: Car }) {
  const p = useTheme();
  const { dispatch } = useStore();
  const shade = SHADES[(car.colour ?? '').toUpperCase()] ?? '#8A8F94';
  const remove = () => Alert.alert('Remove car', `Remove ${prettyReg(car.reg)} from your garage?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'removeCar', reg: car.reg }) },
  ]);
  return (
    <Pressable onPress={() => router.push(`/mot/${car.reg}` as Href)} onLongPress={remove}
      style={({ pressed }) => ({ backgroundColor: p.bgRaised, borderRadius: 12, padding: 10, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ height: 150, borderRadius: 8, backgroundColor: p.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.04)', top: -120, right: -60 }} />
        <MaterialCommunityIcons name="car-side" size={110} color={shade} />
        <View style={{ position: 'absolute', left: 14, bottom: 14, backgroundColor: brand.orange, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 12 }}>
          <T weight="semibold" size={13} style={{ color: '#FFFFFF', letterSpacing: 0.5 }}>{prettyReg(car.reg)}</T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingTop: 14, paddingBottom: 6 }}>
        <T weight="semibold" size={15} style={{ flex: 1 }}>{car.make} {car.model}</T>
        <Pressable onPress={remove} hitSlop={10} accessibilityLabel={`Remove ${car.reg}`}><Feather name="trash-2" size={17} color={p.textMuted} /></Pressable>
      </View>
    </Pressable>
  );
}

export default function Garage() {
  const { state } = useStore();
  return (
    <Screen footer={<Button label="Add Car" icon="plus" onPress={() => router.push('/search?next=garage' as Href)} />}>
      <Header title="My Garage" />
      <View style={{ gap: 18 }}>
        {state.garage.length ? state.garage.map((c) => <CarCard key={c.reg} car={c} />) : (
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 60 }}>
            <MaterialCommunityIcons name="garage-variant" size={64} color={brand.orange} />
            <T weight="semibold" size={17}>Your garage is empty</T>
            <T muted style={{ textAlign: 'center', maxWidth: 260 }}>Add the cars you own or are thinking of buying to check them again in one tap.</T>
          </View>
        )}
      </View>
    </Screen>
  );
}
