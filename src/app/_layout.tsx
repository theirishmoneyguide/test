import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { KeyboardDoneBar } from '@/components/inputs';
import { usePlannerHydrated, usePlannerStore } from '@/store/plannerStore';
import { useColors, useIsDark } from '@/theme/useColors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = usePlannerHydrated();
  const onboarded = usePlannerStore((s) => s.onboarded);
  const colors = useColors();
  const dark = useIsDark();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  // Keep the splash screen up until saved figures have loaded.
  if (!hydrated) return null;

  const base = dark ? DarkTheme : DefaultTheme;
  const theme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.brand,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.brand },
          headerTintColor: colors.onBrand,
          headerTitleStyle: { fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="summary" options={{ title: 'Summary' }} />
          <Stack.Screen name="tax-tables" options={{ title: 'Tax tables' }} />
          <Stack.Screen name="budget-line" options={{ presentation: 'modal', title: 'Budget line' }} />
          <Stack.Screen name="net-worth-item" options={{ presentation: 'modal', title: 'Balance' }} />
          <Stack.Screen name="backup" options={{ presentation: 'modal', title: 'Back up & restore' }} />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="guide" options={{ title: 'How it works' }} />
      </Stack>
      <KeyboardDoneBar />
    </ThemeProvider>
  );
}
