import { useRouter } from 'expo-router';
import { CalendarDays, LayoutDashboard, Sparkles, TrendingUp, Wallet, type LucideIcon } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Disclaimer } from '@/components/ui';
import { usePlannerStore } from '@/store/plannerStore';
import { useColors } from '@/theme/useColors';
import { maxContentWidth, radius, space, themedStyles } from '@/theme/styles';

const useStyles = themedStyles((c) => ({
  safe: { flex: 1, backgroundColor: c.background },
  content: { padding: space.xl, gap: space.xl, flexGrow: 1, justifyContent: 'center' },
  column: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', gap: space.xl },
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: c.sectionText,
  },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: c.text, marginTop: 4 },
  lead: { fontSize: 16, lineHeight: 23, color: c.textMuted, marginTop: space.sm },
  features: { gap: space.lg },
  feature: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: c.sectionBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 15.5, fontWeight: '700', color: c.text },
  featureBody: { fontSize: 14, lineHeight: 20, color: c.textMuted, marginTop: 2 },
  buttons: { gap: space.md },
  link: { fontSize: 15, color: c.sectionText, fontWeight: '600', textAlign: 'center', padding: space.sm },
}));

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Wallet,
    title: 'Take-home pay',
    body: 'Income tax, USC, PRSI and pension relief for one earner or a jointly assessed couple.',
  },
  {
    icon: CalendarDays,
    title: 'Monthly budget',
    body: 'Every bill in the month it actually lands, so you see your tight months coming.',
  },
  {
    icon: TrendingUp,
    title: 'Net worth',
    body: 'A month-end balance sheet: savings, investments, pensions, property and debts.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    body: 'Savings rate, emergency fund, pension room and where every €100 goes.',
  },
];

export default function WelcomeScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const loadSample = usePlannerStore((s) => s.loadSample);
  const startBlank = usePlannerStore((s) => s.startBlank);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <View>
            <View style={styles.badge}>
              <Sparkles size={30} color={colors.onBrand} />
            </View>
            <Text style={[styles.eyebrow, { marginTop: space.lg }]}>2026 tax year</Text>
            <Text style={styles.title} accessibilityRole="header">
              Irish Household Budget & Tax Planner
            </Text>
            <Text style={styles.lead}>
              Work out what your household actually takes home, then budget it — month by month.
            </Text>
          </View>

          <View style={styles.features}>
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <View key={title} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Icon size={20} color={colors.sectionText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{title}</Text>
                  <Text style={styles.featureBody}>{body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.buttons}>
            <Button
              title="Explore the example household"
              onPress={loadSample}
              accessibilityHint="Starts with realistic example figures you can overwrite"
            />
            <Button title="Start with a blank planner" variant="secondary" onPress={startBlank} />
            <Text style={styles.link} onPress={() => router.push('/guide')} accessibilityRole="link">
              How it works
            </Text>
          </View>
          <Disclaimer />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
