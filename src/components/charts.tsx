/**
 * The workbook's three dashboard charts, drawn with react-native-svg.
 *
 * Thin marks with rounded data-ends, hairline solid gridlines, text in text
 * colours (never the series colour), a legend whenever there are two series,
 * and tap-to-inspect in place of hover. Every value is also in a table on the
 * Budget or Net worth tab.
 */
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { MONTHS, MONTHS_LONG } from '@/engine';
import { useColors } from '@/theme/useColors';
import { space, themedStyles } from '@/theme/styles';
import { formatCompactEuro, formatEuro, formatSignedEuro } from '@/utils/format';

const useStyles = themedStyles((c) => ({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, marginBottom: space.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 13, color: c.textMuted },
  readout: { fontSize: 13.5, color: c.text, marginBottom: space.sm, fontVariant: ['tabular-nums'] },
  readoutMuted: { color: c.textMuted },
  barRow: { flexDirection: 'row', alignItems: 'center', height: 30 },
  barLabel: { width: 82, fontSize: 13, color: c.text },
  barValue: { fontSize: 13, color: c.text, fontVariant: ['tabular-nums'], marginLeft: 6 },
}));

function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  return [width, (e) => setWidth(Math.round(e.nativeEvent.layout.width))];
}

interface Scale {
  min: number;
  max: number;
  ticks: number[];
}

/** Round axis bounds to clean steps (1, 2, 2.5, 5 × 10ⁿ). */
export function niceScale(lo: number, hi: number, targetTicks = 4): Scale {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1, ticks: [0, 1] };
  if (hi === lo) {
    const pad = hi === 0 ? 1 : Math.abs(hi) * 0.1;
    lo -= pad;
    hi += pad;
  }
  const rough = (hi - lo) / targetTicks;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const n = rough / pow;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let t = min; t <= max + step / 2; t += step) ticks.push(Number(t.toPrecision(12)));
  return { min, max, ticks };
}

/** A column with a 4px rounded data-end and a square foot on the baseline. */
function columnPath(x: number, top: number, width: number, baseline: number): string {
  const h = baseline - top;
  if (h <= 0) return '';
  const r = Math.min(4, width / 2, h);
  return `M${x},${baseline}V${top + r}Q${x},${top} ${x + r},${top}H${x + width - r}Q${x + width},${top} ${x + width},${top + r}V${baseline}Z`;
}

/** A horizontal bar with its rounded data-end on the right. */
function barPath(x: number, y: number, length: number, thickness: number): string {
  if (length <= 0) return '';
  const r = Math.min(4, thickness / 2, length);
  return `M${x},${y}H${x + length - r}Q${x + length},${y} ${x + length},${y + r}V${y + thickness - r}Q${x + length},${y + thickness} ${x + length - r},${y + thickness}H${x}Z`;
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  const styles = useStyles();
  return (
    <View style={styles.legend}>
      {items.map((i) => (
        <View key={i.label} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: i.color }]} />
          <Text style={styles.legendText}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

function Readout({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return (
    <Text style={styles.readout} accessibilityLiveRegion="polite">
      {children}
    </Text>
  );
}

const AXIS_WIDTH = 44;
const PLOT_HEIGHT = 170;
/** Head-room so the top tick label isn't clipped. */
const PLOT_TOP = 10;
const X_AXIS_HEIGHT = 22;
/** SVG text falls back to a serif face on the web; native uses the system font. */
const SVG_FONT = Platform.select({
  web: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  default: undefined,
});

/** Money in vs money out, by month — grouped columns. */
export function MonthlyColumnChart({
  moneyIn,
  moneyOut,
  initialMonth,
}: {
  moneyIn: number[];
  moneyOut: number[];
  initialMonth: number;
}) {
  const colors = useColors();
  const styles = useStyles();
  const [width, onLayout] = useWidth();
  const [selected, setSelected] = useState(initialMonth);

  const scale = niceScale(0, Math.max(1, ...moneyIn, ...moneyOut));
  const plotW = Math.max(0, width - AXIS_WIDTH);
  const slot = plotW / 12;
  const colW = Math.max(3, Math.min(12, (slot - 8) / 2));
  const y = (v: number) =>
    PLOT_TOP + (PLOT_HEIGHT - PLOT_TOP) * (1 - (v - scale.min) / (scale.max - scale.min));
  const short = slot < 28;
  const left = moneyIn[selected] - moneyOut[selected];

  return (
    <View
      accessible
      accessibilityLabel={`Money in versus money out by month. ${MONTHS_LONG[selected]}: in ${formatEuro(
        moneyIn[selected],
      )}, out ${formatEuro(moneyOut[selected])}.`}
    >
      <Legend
        items={[
          { label: 'Money in', color: colors.chart.moneyIn },
          { label: 'Money out', color: colors.chart.moneyOut },
        ]}
      />
      <Readout>
        <Text style={styles.readoutMuted}>{MONTHS_LONG[selected]}: </Text>
        in {formatEuro(moneyIn[selected])} · out {formatEuro(moneyOut[selected])} ·{' '}
        <Text style={{ color: left < 0 ? colors.negative : colors.positive }}>
          {formatSignedEuro(left)}
        </Text>
      </Readout>
      <View onLayout={onLayout} style={{ height: PLOT_HEIGHT + X_AXIS_HEIGHT }}>
        {width > 0 ? (
          <Svg width={width} height={PLOT_HEIGHT + X_AXIS_HEIGHT}>
            {scale.ticks.map((t) => (
              <G key={t}>
                <Line
                  x1={AXIS_WIDTH}
                  x2={width}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={t === 0 ? colors.chart.axis : colors.chart.grid}
                  strokeWidth={1}
                />
                <SvgText fontFamily={SVG_FONT} x={AXIS_WIDTH - 6} y={y(t) + 4} fontSize={10.5} fill={colors.textMuted} textAnchor="end">
                  {formatCompactEuro(t)}
                </SvgText>
              </G>
            ))}
            {MONTHS.map((label, m) => {
              const x0 = AXIS_WIDTH + slot * m;
              const groupX = x0 + (slot - (colW * 2 + 2)) / 2;
              return (
                <G key={label}>
                  {m === selected ? (
                    <Rect x={x0 + 1} y={0} width={slot - 2} height={PLOT_HEIGHT} rx={4} fill={colors.surfaceAlt} />
                  ) : null}
                  <Path d={columnPath(groupX, y(moneyIn[m]), colW, y(0))} fill={colors.chart.moneyIn} />
                  <Path d={columnPath(groupX + colW + 2, y(moneyOut[m]), colW, y(0))} fill={colors.chart.moneyOut} />
                  <SvgText
                    fontFamily={SVG_FONT}
                    x={x0 + slot / 2}
                    y={PLOT_HEIGHT + 15}
                    fontSize={10.5}
                    fill={m === selected ? colors.text : colors.textMuted}
                    fontWeight={m === selected ? '700' : '400'}
                    textAnchor="middle"
                  >
                    {short ? label[0] : label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        ) : null}
        {/* Tap targets as wide as each month's slot and as tall as the plot. */}
        <View style={{ position: 'absolute', left: AXIS_WIDTH, right: 0, top: 0, bottom: 0, flexDirection: 'row' }}>
          {MONTHS.map((label, m) => (
            <Pressable
              key={label}
              style={{ flex: 1 }}
              onPress={() => setSelected(m)}
              accessibilityRole="button"
              accessibilityLabel={`Show ${MONTHS_LONG[m]}`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/** Where the money goes — one bar per category, one colour. */
export function CategoryBarChart({ items }: { items: { label: string; value: number }[] }) {
  const colors = useColors();
  const styles = useStyles();
  const [width, onLayout] = useWidth();
  const max = Math.max(1, ...items.map((i) => i.value));
  const valueRoom = 72;
  const barArea = Math.max(0, width - 82 - valueRoom);
  const thickness = 14;

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityLabel={`Where the money goes: ${items
        .map((i) => `${i.label} ${formatEuro(i.value)}`)
        .join(', ')}`}
    >
      {items.map((item) => {
        const length = (Math.max(0, item.value) / max) * barArea;
        return (
          <View key={item.label} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {item.label}
            </Text>
            {width > 0 ? (
              <Svg width={Math.max(1, length)} height={thickness}>
                <Path d={barPath(0, 0, length, thickness)} fill={colors.chart.single} />
              </Svg>
            ) : null}
            <Text style={styles.barValue}>{formatEuro(item.value)}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Net worth through the year — one line, recorded months only. */
export function NetWorthLineChart({
  values,
  initialMonth,
}: {
  values: (number | null)[];
  initialMonth: number | null;
}) {
  const colors = useColors();
  const styles = useStyles();
  const [width, onLayout] = useWidth();
  const [selected, setSelected] = useState<number | null>(initialMonth);

  const recorded = values.flatMap((v, m) => (v === null ? [] : [{ m, v }]));
  if (recorded.length === 0) return null;

  const scale = niceScale(Math.min(...recorded.map((p) => p.v)), Math.max(...recorded.map((p) => p.v)));
  const plotW = Math.max(0, width - AXIS_WIDTH - 8);
  const slot = plotW / 12;
  const x = (m: number) => AXIS_WIDTH + slot * m + slot / 2;
  const y = (v: number) =>
    PLOT_TOP + (PLOT_HEIGHT - PLOT_TOP) * (1 - (v - scale.min) / (scale.max - scale.min));

  // Break the line wherever a month is missing.
  const segments: string[] = [];
  let current = '';
  values.forEach((v, m) => {
    if (v === null) {
      if (current) segments.push(current);
      current = '';
      return;
    }
    current += `${current ? 'L' : 'M'}${x(m)},${y(v)}`;
  });
  if (current) segments.push(current);

  const last = recorded[recorded.length - 1];
  const shown = selected !== null && values[selected] !== null ? selected : last.m;
  const shownValue = values[shown] ?? 0;
  const prevRecorded = recorded.filter((p) => p.m < shown).pop();

  return (
    <View
      accessible
      accessibilityLabel={`Net worth through the year: ${formatEuro(recorded[0].v)} in ${
        MONTHS_LONG[recorded[0].m]
      }, ${formatEuro(last.v)} in ${MONTHS_LONG[last.m]}.`}
    >
      <Readout>
        <Text style={styles.readoutMuted}>{MONTHS_LONG[shown]}: </Text>
        {formatEuro(shownValue)}
        {prevRecorded ? (
          <Text style={styles.readoutMuted}>
            {' '}
            ({formatSignedEuro(shownValue - prevRecorded.v)} on {MONTHS[prevRecorded.m]})
          </Text>
        ) : null}
      </Readout>
      <View onLayout={onLayout} style={{ height: PLOT_HEIGHT + X_AXIS_HEIGHT }}>
        {width > 0 ? (
          <Svg width={width} height={PLOT_HEIGHT + X_AXIS_HEIGHT}>
            {scale.ticks.map((t) => (
              <G key={t}>
                <Line x1={AXIS_WIDTH} x2={width} y1={y(t)} y2={y(t)} stroke={colors.chart.grid} strokeWidth={1} />
                <SvgText fontFamily={SVG_FONT} x={AXIS_WIDTH - 6} y={y(t) + 4} fontSize={10.5} fill={colors.textMuted} textAnchor="end">
                  {formatCompactEuro(t)}
                </SvgText>
              </G>
            ))}
            <Line
              x1={x(shown)}
              x2={x(shown)}
              y1={0}
              y2={PLOT_HEIGHT}
              stroke={colors.chart.axis}
              strokeWidth={1}
            />
            {segments.map((d, i) => (
              <Path
                key={i}
                d={d}
                stroke={colors.chart.single}
                strokeWidth={2}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {recorded.length === 1 || recorded.some((p, i) => i > 0 && p.m - recorded[i - 1].m > 1)
              ? recorded.map((p) => <Circle key={p.m} cx={x(p.m)} cy={y(p.v)} r={3} fill={colors.chart.single} />)
              : null}
            <Circle
              cx={x(shown)}
              cy={y(shownValue)}
              r={5}
              fill={colors.chart.single}
              stroke={colors.surface}
              strokeWidth={2}
            />
            {MONTHS.map((label, m) => (
              <SvgText
                fontFamily={SVG_FONT}
                key={label}
                x={x(m)}
                y={PLOT_HEIGHT + 15}
                fontSize={10.5}
                fill={m === shown ? colors.text : colors.textMuted}
                fontWeight={m === shown ? '700' : '400'}
                textAnchor="middle"
              >
                {slot < 28 ? label[0] : label}
              </SvgText>
            ))}
          </Svg>
        ) : null}
        <View style={{ position: 'absolute', left: AXIS_WIDTH, right: 8, top: 0, bottom: 0, flexDirection: 'row' }}>
          {MONTHS.map((label, m) => (
            <Pressable
              key={label}
              style={{ flex: 1 }}
              disabled={values[m] === null}
              onPress={() => setSelected(m)}
              accessibilityRole="button"
              accessibilityLabel={`Show ${MONTHS_LONG[m]}`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
