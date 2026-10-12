import { Redirect } from 'expo-router';

/** Any link the app doesn't recognise — an old deep link, or a page served from a sub-path — lands on the dashboard. */
export default function NotFoundScreen() {
  return <Redirect href="/" />;
}
