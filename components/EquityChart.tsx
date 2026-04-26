'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { useState } from 'react';
import { formatEuroCompact, formatEuro } from '@/lib/utils';
import type { ChartPoint } from '@/hooks/useMortgageCalculator';

interface Props {
  chartData: ChartPoint[];
  years: number;
  marketGrowth: number;
}

type View = 'net' | 'equity';

const COLORS = {
  annuity: '#10b981',
  linear: '#3b82f6',
  renting: '#f43f5e',
};

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur p-3 shadow-2xl min-w-[200px]">
      <div className="text-xs text-slate-400 mb-2 font-medium">Year {label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name}</span>
          </span>
          <span
            className="font-mono font-semibold"
            style={{ color: p.value >= 0 ? '#10b981' : '#f43f5e' }}
          >
            {formatEuro(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EquityChart({ chartData, years, marketGrowth }: Props) {
  const [view, setView] = useState<View>('net');

  const sentimentLabel = marketGrowth === 0
    ? 'Flat market'
    : `${Math.abs(marketGrowth * 100).toFixed(1)}% ${marketGrowth > 0 ? 'growth' : 'decline'}/yr`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Financial Position Over Time</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Assuming {sentimentLabel} · vertical line = your comparison period
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-800 overflow-hidden text-xs">
          <button
            onClick={() => setView('net')}
            className="px-3 py-1.5 font-medium transition-colors"
            style={{
              background: view === 'net' ? '#1e293b' : 'transparent',
              color: view === 'net' ? '#f1f5f9' : '#64748b',
            }}
          >
            Net Position
          </button>
          <button
            onClick={() => setView('equity')}
            className="px-3 py-1.5 font-medium transition-colors"
            style={{
              background: view === 'equity' ? '#1e293b' : 'transparent',
              color: view === 'equity' ? '#f1f5f9' : '#64748b',
            }}
          >
            Equity Built
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'net' ? (
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAnnuity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.annuity} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLORS.annuity} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLinear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.linear} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={COLORS.linear} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRenting" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.renting} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={COLORS.renting} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `Yr ${v}`}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatEuroCompact(v)}
                width={64}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '12px' }}
                iconType="circle"
                iconSize={8}
              />
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine
                x={years}
                stroke="#a78bfa"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: `${years}yr`, position: 'insideTopRight', fill: '#a78bfa', fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="annuityNet"
                name="Annuity (net)"
                stroke={COLORS.annuity}
                strokeWidth={2}
                fill="url(#gradAnnuity)"
                dot={false}
                activeDot={{ r: 4, fill: COLORS.annuity }}
              />
              <Area
                type="monotone"
                dataKey="linearNet"
                name="Linear (net)"
                stroke={COLORS.linear}
                strokeWidth={2}
                fill="url(#gradLinear)"
                dot={false}
                activeDot={{ r: 4, fill: COLORS.linear }}
              />
              <Area
                type="monotone"
                dataKey="rentingNet"
                name="Renting (sunk)"
                stroke={COLORS.renting}
                strokeWidth={2}
                fill="url(#gradRenting)"
                dot={false}
                activeDot={{ r: 4, fill: COLORS.renting }}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `Yr ${v}`}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatEuroCompact(v)}
                width={64}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '12px' }}
                iconType="circle"
                iconSize={8}
              />
              <ReferenceLine
                x={years}
                stroke="#a78bfa"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: `${years}yr`, position: 'insideTopRight', fill: '#a78bfa', fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="annuityEquity"
                name="Annuity equity"
                stroke={COLORS.annuity}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="linearEquity"
                name="Linear equity"
                stroke={COLORS.linear}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend footnote */}
      <p className="text-[10px] text-slate-600 text-center">
        Net position = equity built + house appreciation (at selected growth) − all sunk costs. Positive = financially ahead.
      </p>
    </div>
  );
}
