import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { CategoryBarChart, MonthlyColumnChart, NetWorthLineChart } from '@/components/charts';
import { HealthRow, type HealthStatus } from '@/components/HealthRow';
import { StatTile } from '@/components/StatTile';
import { FileText } from '@/components/icons';
import { Button, Card, Disclaimer, Note, ScreenScroll, TableRow } from '@/components/ui';
import { MONTHS, type EmergencyRating } from '@/engine';
import { usePlanner } from '@/store/plannerStore';
import { useColors } from '@/theme/useColors';
import { space } from '@/theme/styles';
import { formatEuro, formatNumber, formatPercent } from '@/utils/format';

const EMERGENCY: Record<EmergencyRating, { word: string; status: HealthStatus }> = {
  strong: { word: 'Strong.', status: 'good' },
  solid: { word: 'Solid.', status: 'good' },
  thin: { word: 'Thin.', status: 'warning' },
  veryThin: { word: 'Very thin.', status: 'critical' },
};

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data, result } = usePlanner();
  const { pay, budget, netWorth, insights } = result;
  const h = pay.household;
  const latest = insights.netWorth.latestMonth;
  const couple = pay.hasPartner;

  const emergency = insights.emergencyFund;
  const emergencyRow =
    emergency.months === null || emergency.rating === null
      ? {
          value: '—',
          text: 'Record your balances on the Net worth tab to see how many months of spending your savings cover.',
          status: 'info' as const,
        }
      : {
          value: formatNumber(emergency.months, 1),
          text: `${EMERGENCY[emergency.rating].word} Months of budgeted spending your liquid assets would cover.`,
          status: EMERGENCY[emergency.rating].status,
        };

  const tightest = insights.tightestMonth;
  const biggest = insights.biggestCost;

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <StatTile label="Net take-home" value={formatEuro(h.netMonthly)} caption="per month, after everything" />
        <StatTile
          label="Effective tax rate"
          value={formatPercent(h.effectiveTaxRate)}
          caption="income tax, USC and PRSI"
        />
        <StatTile
          label="Savings rate"
          value={formatPercent(insights.savingsRate)}
          caption="pensions, savings and surplus"
        />
        <StatTile
          label="Left over"
          value={formatEuro(budget.leftOverAvg)}
          caption="per month, once budgeted"
          valueColor={budget.leftOverAvg < 0 ? colors.negative : undefined}
        />
        <StatTile
          label="Net worth"
          value={latest === null ? '—' : formatEuro(insights.netWorth.latest ?? 0)}
          caption={latest === null ? 'add balances on Net worth' : `latest recorded, ${MONTHS[latest]}`}
        />
      </View>

      <Card title="Health check">
        <HealthRow
          first
          label="Budget"
          value={formatEuro(budget.leftOverAvg)}
          status={budget.leftOverYear >= 0 ? 'good' : 'critical'}
          text={
            budget.leftOverYear >= 0
              ? `In surplus. ${formatEuro(budget.leftOverYear)} a year left over.`
              : `Overspending by ${formatEuro(-budget.leftOverYear)} a year.`
          }
        />
        <HealthRow label="Emergency fund" {...emergencyRow} />
        <HealthRow
          label="Pension relief"
          value={formatEuro(h.roomLeft)}
          status={h.roomLeft <= 0 ? 'good' : 'info'}
          text={
            h.roomLeft <= 0
              ? couple
                ? 'Both allowances fully used this year.'
                : 'Your allowance is fully used this year.'
              : couple
                ? "Relief room still unused. One partner's room cannot be used by the other."
                : 'Relief room still unused this year.'
          }
        />
        <HealthRow
          label="Tightest month"
          value={formatEuro(tightest.leftOver)}
          status={tightest.leftOver < 0 ? 'warning' : 'good'}
          text={
            tightest.leftOver < 0
              ? `Your thinnest month is ${MONTHS[tightest.month]}. Annual bills land there.`
              : `Your thinnest month is ${MONTHS[tightest.month]}, and even it stays in surplus.`
          }
        />
        <HealthRow
          label="Biggest cost"
          value={biggest ? formatEuro(biggest.yearTotal) : '—'}
          status="info"
          text={
            biggest
              ? `${biggest.shortName}, ${formatPercent(biggest.share)} of everything coming in.`
              : 'Nothing budgeted yet. Add your spending on the Budget tab.'
          }
        />
      </Card>

      <Card title="Money in vs money out, by month" subtitle="Tap a month to see its figures">
        <MonthlyColumnChart
          moneyIn={budget.moneyIn}
          moneyOut={budget.moneyOut}
          initialMonth={tightest.month}
        />
      </Card>

      <Card title="Where the money goes" subtitle="Budgeted for the year">
        <CategoryBarChart
          items={insights.categories.map((c) => ({ label: c.shortName, value: c.yearTotal }))}
        />
      </Card>

      <Card title="Net worth through the year" subtitle={latest === null ? undefined : 'Tap a month to see its figures'}>
        {latest === null ? (
          <Note>Nothing recorded yet. Add one month of balances on the Net worth tab and the line starts here.</Note>
        ) : (
          <NetWorthLineChart values={netWorth.netWorth} initialMonth={latest} />
        )}
      </Card>

      <Card title="Spending by category">
        <TableRow header cells={['Category', 'Year total', '% of in']} />
        {insights.categories.map((c, i) => (
          <TableRow
            key={c.id}
            first={i === 0}
            cells={[c.shortName, formatEuro(c.yearTotal), formatPercent(c.share)]}
          />
        ))}
        <TableRow
          variant="subtotal"
          cells={[
            'Total',
            formatEuro(insights.categoriesTotal.yearTotal),
            formatPercent(insights.categoriesTotal.share),
          ]}
        />
      </Card>

      <Button
        title="See the full summary"
        icon={FileText}
        variant="secondary"
        onPress={() => router.push('/summary')}
      />
      <Disclaimer year={data.taxTables.year} />
    </ScreenScroll>
  );
}
