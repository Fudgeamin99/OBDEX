import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import { Header, Screen, T } from '@/components/ui';
import { useStore, type Plan } from '@/lib/store';
import { brand } from '@/lib/theme';

const PLANS: { id: Plan; name: string; price: string; bg: string; pill: string; features: string[] }[] = [
  { id: 'bronze', name: 'Bronze', price: 'Free', bg: '#263238', pill: '#1C1C1C',
    features: ['Free MOT and tax check', 'Full MOT history and mileage record', 'My Garage and buying checklist'] },
  { id: 'silver', name: 'Silver', price: '£9.99', bg: brand.orange, pill: brand.orange,
    features: ['Everything in Bronze', 'Salvage history', 'Stolen check', 'Imported / exported', 'Scrapped', 'VIN check', 'Plate changes', 'Previous keepers', '50+ more data checks'] },
  { id: 'gold', name: 'Gold', price: '£99.99', bg: brand.orangeSoft, pill: brand.orangeSoft,
    features: ['Everything in Silver', 'Outstanding finance check', 'Logbook loans check', '£30,000 data guarantee', 'Valuation'] },
];

export default function Subscription() {
  const { state, dispatch } = useStore();
  const { next } = useLocalSearchParams<{ next?: string }>();
  function choose(id: Plan) {
    // Payments go through App Store / Google Play billing once set up (for example with RevenueCat).
    dispatch({ type: 'plan', plan: id });
    if (id !== 'bronze' && next) router.replace(next as Href);
    else Alert.alert('Plan updated', `You are now on ${PLANS.find((p) => p.id === id)!.name}. In-app payments are not connected yet, so no charge was made.`);
  }
  return (
    <Screen>
      <Header title="Subscription" />
      <View style={{ gap: 16 }}>
        {PLANS.map((plan) => {
          const current = state.plan === plan.id;
          return (
            <Pressable key={plan.id} onPress={() => choose(plan.id)} accessibilityRole="button"
              style={({ pressed }) => ({ backgroundColor: plan.bg, borderRadius: 26, padding: 22, gap: 10, opacity: pressed ? 0.9 : 1, borderWidth: current ? 3 : 0, borderColor: '#FFFFFF' })}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="crown" size={30} color="#FFFFFF" />
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 34, paddingVertical: 3 }}>
                  <T weight="medium" size={15} style={{ color: plan.pill === '#1C1C1C' ? '#1C1C1C' : plan.pill }}>{plan.name}</T>
                </View>
                <T weight="bold" size={22} style={{ color: '#FFFFFF' }}>{plan.price}<T size={11} style={{ color: '#FFFFFF' }}> /month</T></T>
              </View>
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.35)', marginVertical: 4 }} />
              {plan.features.map((f) => (
                <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Feather name="check" size={14} color="#FFFFFF" />
                  <T size={12.5} style={{ color: '#FFFFFF' }}>{f}</T>
                </View>
              ))}
              <View style={{ marginTop: 6, alignSelf: 'center', backgroundColor: current ? 'rgba(255,255,255,0.2)' : '#FFFFFF', borderRadius: 20, paddingHorizontal: 22, paddingVertical: 8 }}>
                <T weight="semibold" size={13} style={{ color: current ? '#FFFFFF' : '#1C1C1C' }}>{current ? 'Current plan' : `Choose ${plan.name}`}</T>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
