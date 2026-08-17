"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { useLanguage } from "@/components/LanguageProvider";
import { formatMonthLabel } from "@/lib/i18n/dates";
import { fill } from "@/lib/i18n/fill";

/**
 * Dashboard charts.
 *
 * Two rules applied throughout:
 *
 *  • Amounts arrive as strings and are converted to numbers ONLY here, for
 *    pixel positions. A chart coordinate does not need exact decimal
 *    arithmetic; a balance does, which is why the conversion happens at the
 *    very edge and never flows back into anything that gets stored.
 *
 *  • Colours come from the site's existing palette — teal for savings, amber
 *    for withdrawals, red for arrears — so a figure means the same thing here
 *    as it does in a status badge elsewhere.
 */

const TEAL = "#20b2aa";
const TEAL_DARK = "#17948e";
const AMBER = "#d4a94c";
const RED = "#ef4444";
const GRID = "#e5e7eb";
const MUTED = "#6b7280";

/** Chart-only conversion. Never feed the result back into a stored value. */
const toPlot = (value: string): number => Number.parseFloat(value) || 0;

const axisProps = {
  stroke: MUTED,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2.5 shadow-lift">
      <p className="mb-1.5 text-xs font-semibold text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-xs text-ink-muted">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          {entry.name}:{" "}
          <span className="font-semibold tabular-nums text-ink">
            {formatMoney(String(entry.value))}
          </span>
        </p>
      ))}
    </div>
  );
}

export function SavingsGrowthChart({
  data,
}: {
  data: { month: string; balance: string }[];
}) {
  const { d: copy, locale } = useLanguage();

  // The series key doubles as its legend and tooltip label, so it is the
  // translated word rather than a fixed English one.
  const series = copy.views.charts.balance;
  const plotted = data.map((point) => ({
    month: formatMonthLabel(point.month, locale),
    [series]: toPlot(point.balance),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={plotted} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity={0.28} />
            <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatMoneyCompact(String(v)).replace("RWF ", "")} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey={series}
          stroke={TEAL_DARK}
          strokeWidth={2.5}
          fill="url(#savingsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ContributionsChart({
  data,
}: {
  data: { month: string; deposits: string; withdrawals: string }[];
}) {
  const { d: copy, locale } = useLanguage();
  const depositsKey = copy.views.charts.deposits;
  const withdrawalsKey = copy.views.charts.withdrawals;

  const plotted = data.map((point) => ({
    month: formatMonthLabel(point.month, locale),
    [depositsKey]: toPlot(point.deposits),
    [withdrawalsKey]: toPlot(point.withdrawals),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={plotted} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatMoneyCompact(String(v)).replace("RWF ", "")} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(32,178,170,0.06)" }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: MUTED, paddingTop: 8 }}
        />
        <Bar dataKey={depositsKey} fill={TEAL} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar
          dataKey={withdrawalsKey}
          fill={AMBER}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal progress bar for loan repayment. Not a chart library job. */
export function RepaymentProgress({
  paid,
  total,
  percent,
  overdue,
}: {
  paid: string;
  total: string;
  percent: number;
  overdue?: boolean;
}) {
  const { d } = useLanguage();
  const copy = d.views.charts;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-ink-muted">
          <span className="font-heading text-lg font-bold text-ink">
            {formatMoney(paid)}
          </span>{" "}
          {fill(copy.repaidOf, { total: formatMoney(total) })}
        </p>
        <span
          className={`text-sm font-bold tabular-nums ${overdue ? "text-red-600" : "text-primary"}`}
        >
          {percent}%
        </span>
      </div>

      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ink/[0.07]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={copy.progressLabel}
      >
        <div
          className={`h-full rounded-full transition-all ${overdue ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${Math.max(percent, 1.5)}%` }}
        />
      </div>
    </div>
  );
}

/** Generic monthly bar chart used by the admin dashboards. */
export function MonthlyBarChart({
  data,
  series,
  colour = TEAL,
  highlightNegative = false,
}: {
  data: { label: string; value: string }[];
  series: string;
  colour?: string;
  highlightNegative?: boolean;
}) {
  const plotted = data.map((d) => ({ label: d.label, [series]: toPlot(d.value) }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={plotted} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatMoneyCompact(String(v)).replace("RWF ", "")} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(32,178,170,0.06)" }} />
        <Bar dataKey={series} radius={[4, 4, 0, 0]} maxBarSize={32}>
          {plotted.map((entry, index) => (
            <Cell
              key={index}
              fill={
                highlightNegative && (entry[series] as number) < 0 ? RED : colour
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
