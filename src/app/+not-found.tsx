import { Redirect } from 'expo-router';

import { usePlannerStore } from '@/store/plannerStore';

/**
 * Any link the app doesn't recognise — an old deep link, or a page served
 * from a sub-path — lands on the dashboard, or the welcome screen first time.
 */
export default function NotFoundScreen() {
  const onboarded = usePlannerStore((s) => s.onboarded);
  return <Redirect href={onboarded ? '/' : '/welcome'} />;
}
