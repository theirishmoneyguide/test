import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { BookOpen, Eraser, FileText, RotateCcw, Scale, Share2 } from '@/components/icons';
import { Card, Disclaimer, LinkRow, Note, ScreenScroll } from '@/components/ui';
import { usePlannerData, usePlannerStore } from '@/store/plannerStore';
import { confirmAction } from '@/utils/dialogs';

export default function MoreScreen() {
  const router = useRouter();
  const year = usePlannerData().taxTables.year;
  const loadSample = usePlannerStore((s) => s.loadSample);
  const startBlank = usePlannerStore((s) => s.startBlank);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScreenScroll>
      <Card title="Your planner">
        <LinkRow
          first
          icon={FileText}
          title="Summary"
          subtitle="Where the household's money goes, in one page"
          onPress={() => router.push('/summary')}
        />
        <LinkRow
          icon={Scale}
          title={`Tax tables ${year}`}
          subtitle="Every rate in one place. Change a rule and the planner follows."
          onPress={() => router.push('/tax-tables')}
        />
        <LinkRow
          icon={BookOpen}
          title="How it works"
          subtitle="How to use it, and how a couple is actually taxed"
          onPress={() => router.push('/guide')}
        />
      </Card>

      <Card title="Your data">
        <LinkRow
          first
          icon={Share2}
          title="Back up & restore"
          subtitle="Copy your figures out, or paste a backup back in"
          onPress={() => router.push('/backup')}
        />
        <LinkRow
          icon={RotateCcw}
          title="Load the example household"
          subtitle="Two earners on €65,000 and €45,000, with a mortgage"
          onPress={async () => {
            const ok = await confirmAction(
              'Load the example household?',
              'This replaces every figure you have entered with the example. Back up first if you want to keep them.',
              'Load example',
            );
            if (ok) {
              loadSample();
              router.navigate('/');
            }
          }}
        />
        <LinkRow
          destructive
          icon={Eraser}
          title="Start again from blank"
          subtitle="Keeps the categories, clears every figure"
          onPress={async () => {
            const ok = await confirmAction(
              'Clear every figure?',
              'Your pay, budget and net worth figures will be cleared. This cannot be undone.',
              'Clear everything',
            );
            if (ok) {
              startBlank();
              router.navigate('/pay');
            }
          }}
        />
      </Card>

      <Card title="About">
        <Note>
          The Irish Household Budget & Tax Planner as an app: take-home pay for one or two earners,
          a month-by-month budget, a net worth balance sheet and a dashboard that pulls them
          together. Your figures are saved on this device only — nothing is sent anywhere.
        </Note>
        <Note style={{ marginTop: 8 }}>Version {version}</Note>
      </Card>
      <Disclaimer year={year} />
    </ScreenScroll>
  );
}
