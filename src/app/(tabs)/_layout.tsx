import { Tabs } from 'expo-router/js-tabs';

import { CalendarDays, LayoutDashboard, Menu, TrendingUp, Wallet } from '@/components/icons';
import { usePlannerData } from '@/store/plannerStore';
import { useColors } from '@/theme/useColors';

export default function TabsLayout() {
  const colors = useColors();
  const year = usePlannerData().taxTables.year;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand },
        headerTintColor: colors.onBrand,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: `Take-home pay ${year}`,
          tabBarLabel: 'Pay',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: `Monthly budget ${year}`,
          tabBarLabel: 'Budget',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="net-worth"
        options={{
          title: `Net worth ${year}`,
          tabBarLabel: 'Net worth',
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
