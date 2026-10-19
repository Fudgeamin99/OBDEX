import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Header, Screen, T } from '@/components/ui';

const PAGES: Record<string, { title: string; body: string[] }> = {
  language: { title: 'App Language', body: ['OBDEX is available in English (UK). More languages are coming.'] },
  support: { title: 'Support', body: ['Need help with a check or your account? Email support@obdex.co.uk and we will reply within one working day.', 'For problems with MOT records, contact the DVSA. For tax records, contact the DVLA.'] },
  terms: { title: 'Terms & Conditions', body: [
    'MOT history comes from the DVSA. Tax and vehicle details come from the DVLA. History checks come from our data partners.',
    'We show the records as we receive them. Always inspect a vehicle and its documents before you buy it.',
    'Your full terms and privacy policy will appear here before launch.',
  ] },
};

export default function Info() {
  const { page = 'support' } = useLocalSearchParams<{ page?: string }>();
  const p = PAGES[page] ?? PAGES.support;
  return (
    <Screen>
      <Header title={p.title} />
      <View style={{ gap: 14 }}>{p.body.map((b) => <T key={b} size={15} style={{ lineHeight: 23 }}>{b}</T>)}</View>
    </Screen>
  );
}
