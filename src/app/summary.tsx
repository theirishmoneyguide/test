import { Card, ColumnsHeader, ColumnsRow, Disclaimer, Note, Row, ScreenScroll, TableRow } from '@/components/ui';
import { MONTHS_LONG } from '@/engine';
import { usePlanner } from '@/store/plannerStore';
import { formatEuro, formatPercent } from '@/utils/format';

export default function SummaryScreen() {
  const { data, result } = usePlanner();
  const { pay, budget, insights } = result;
  const h = pay.household;
  const couple = pay.hasPartner;
  const nw = insights.netWorth;
  const year = data.taxTables.year;
  const perYearMonth = (v: number) => [formatEuro(v), formatEuro(v / 12)];

  return (
    <ScreenScroll>
      <Card title="The year at a glance">
        <TableRow header cells={['', 'Per year', 'Per month']} />
        <TableRow first cells={['Combined gross pay', ...perYearMonth(h.gross)]} />
        <TableRow cells={[couple ? 'Income tax (jointly assessed)' : 'Income tax', ...perYearMonth(-h.incomeTax)]} />
        <TableRow cells={[couple ? 'USC (both of you)' : 'USC', ...perYearMonth(-h.usc)]} />
        <TableRow cells={[couple ? 'PRSI (both of you)' : 'PRSI', ...perYearMonth(-h.prsi)]} />
        <TableRow cells={['Pension contributions', ...perYearMonth(-h.contribution)]} />
        <TableRow variant="subtotal" cells={['Net take-home pay', ...perYearMonth(h.netAnnual)]} />
      </Card>

      <Card title="Budget outcome">
        <TableRow header cells={['', 'Per year', 'Per month']} />
        <TableRow first cells={['Total budgeted spending', ...perYearMonth(budget.moneyOutYear)]} />
        <TableRow cells={['Left over after spending', ...perYearMonth(budget.leftOverYear)]} />
        <Row
          label="Savings rate (pensions + savings + surplus)"
          value={formatPercent(insights.savingsRate)}
          note={couple ? 'Counts employer pensions too' : "Counts your employer's pension contributions too"}
        />
        <Row label="Effective tax rate" value={formatPercent(h.effectiveTaxRate)} />
      </Card>

      <Card title="Pensions">
        {couple ? (
          <>
            <ColumnsHeader columns={['You', 'Partner']} />
            <ColumnsRow label="You each contribute" values={[formatEuro(pay.you.contribution), formatEuro(pay.partner.contribution)]} />
            <ColumnsRow label="Employers contribute" values={[formatEuro(pay.you.employerContribution), formatEuro(pay.partner.employerContribution)]} />
            <ColumnsRow label="Room left with full relief" values={[formatEuro(pay.you.roomLeft), formatEuro(pay.partner.roomLeft)]} />
            <ColumnsRow
              label="Marginal rate on the next €1,000"
              values={[formatPercent(pay.you.marginalRate), formatPercent(pay.partner.marginalRate)]}
            />
          </>
        ) : (
          <>
            <Row first label="You contribute" value={formatEuro(pay.you.contribution)} />
            <Row label="Your employer contributes" value={formatEuro(pay.you.employerContribution)} />
            <Row label="Room left with full relief" value={formatEuro(pay.you.roomLeft)} />
            <Row label="Marginal rate on the next €1,000" value={formatPercent(pay.you.marginalRate)} />
          </>
        )}
        <Row label="Total into pensions" value={formatEuro(h.totalIntoPension)} variant="subtotal" />
        <Row label="Income tax relief you get back" value={formatEuro(h.pensionTaxRelief)} />
        <Row label="Real cost to you after relief" value={formatEuro(h.pensionRealCost)} />
        <Row label="Each €100 into a pension really costs" value={formatEuro(h.pensionCostPer100, 2)} />
      </Card>

      <Card title="Net worth">
        {nw.latestMonth === null ? (
          <Note>Record your balances on the Net worth tab to see how the year moved your net worth.</Note>
        ) : (
          <>
            <Row first label={`Net worth at the end of ${MONTHS_LONG[nw.latestMonth]}`} value={formatEuro(nw.latest ?? 0)} />
            {nw.change !== null && nw.firstMonth !== null && nw.firstMonth !== nw.latestMonth ? (
              <Row
                label={`Change since ${MONTHS_LONG[nw.firstMonth]}`}
                value={formatEuro(nw.change)}
                variant="subtotal"
              />
            ) : null}
            {nw.saved !== null && nw.marketsAndMortgage !== null ? (
              <>
                <Row
                  variant="indent"
                  label={
                    nw.monthsSpanned >= 12
                      ? 'of which you actually saved'
                      : `of which you saved (${nw.monthsSpanned} months of budget)`
                  }
                  value={formatEuro(nw.saved)}
                />
                <Row
                  variant="indent"
                  label="the rest is markets and mortgage"
                  value={formatEuro(nw.marketsAndMortgage)}
                  note="Growth in investments and property, plus the principal your mortgage payments cleared, less depreciation"
                />
              </>
            ) : (
              <Note>Record at least two months to see what you saved versus what markets did.</Note>
            )}
          </>
        )}
      </Card>

      <Card title="Every €100 of combined gross pay">
        <TableRow header cells={['Destination', '€ per €100']} />
        <TableRow first cells={['Income tax', formatEuro(insights.per100.incomeTax, 2)]} />
        <TableRow cells={['USC', formatEuro(insights.per100.usc, 2)]} />
        <TableRow cells={['PRSI', formatEuro(insights.per100.prsi, 2)]} />
        <TableRow cells={['Into pensions', formatEuro(insights.per100.pensions, 2)]} />
        <TableRow cells={['Spent', formatEuro(insights.per100.spent, 2)]} />
        <TableRow cells={['Left over', formatEuro(insights.per100.leftOver, 2)]} />
      </Card>

      <Disclaimer year={year} />
    </ScreenScroll>
  );
}
