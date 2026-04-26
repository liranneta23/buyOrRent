'use client';

import { formatEuro, formatPercent } from '@/lib/utils';
import type { MortgageResults, Inputs } from '@/hooks/useMortgageCalculator';

interface Props {
  results: MortgageResults;
  inputs: Inputs;
}

function StatPill({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span
        className="text-sm font-bold font-mono"
        style={{ color: positive === undefined ? '#94a3b8' : positive ? '#10b981' : '#f43f5e' }}
      >
        {value}
      </span>
    </div>
  );
}

export function VerdictCard({ results, inputs }: Props) {
  const { annuity, linear, bestMortgage, betterThanRenting, rentingCost } = results;
  const best = bestMortgage === 'annuity' ? annuity : linear;
  const other = bestMortgage === 'annuity' ? linear : annuity;
  const bestLabel = bestMortgage === 'annuity' ? 'Annuity' : 'Linear';
  const winning = betterThanRenting >= 0;

  const sentimentLabel =
    inputs.marketGrowth === 0
      ? 'flat market'
      : `${Math.abs(inputs.marketGrowth * 100).toFixed(1)}% ${inputs.marketGrowth > 0 ? 'growth' : 'decline'}/yr`;

  return (
    <div
      className="relative rounded-2xl border overflow-hidden"
      style={{
        borderColor: winning ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)',
        background: winning
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(2,6,23,0) 60%)'
          : 'linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(2,6,23,0) 60%)',
      }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: winning
            ? 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(244,63,94,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative p-6 sm:p-8">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              Verdict — {inputs.years}yr · {sentimentLabel}
            </div>
            <h1 className="text-lg font-bold text-slate-200">
              {winning ? 'Buying beats renting by' : 'Renting beats buying by'}
            </h1>
          </div>

          {/* Best mortgage badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/50 px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400">
              {bestLabel} Recommended
            </span>
          </div>
        </div>

        {/* Big number */}
        <div className="text-center mb-6">
          <div
            className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono animate-slide-up"
            style={{ color: winning ? '#10b981' : '#f43f5e' }}
          >
            {winning ? '+' : '-'}
            {formatEuro(Math.abs(betterThanRenting))}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            vs. paying {formatEuro(rentingCost / (inputs.years * 12))}/mo rent over {inputs.years} year
            {inputs.years !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Two mortgage cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Best mortgage */}
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                {bestLabel} (Recommended)
              </span>
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Monthly net cost</span>
                <span className="text-slate-200 font-mono">{formatEuro(best.avgMonthlyNet)}/mo</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Equity built</span>
                <span className="text-emerald-400 font-mono">{formatEuro(best.totalEquitySaved, true)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Profit @ {formatPercent(inputs.marketGrowth * 100, 1)}</span>
                <span
                  className="font-mono font-semibold"
                  style={{ color: best.profitCustom >= 0 ? '#10b981' : '#f43f5e' }}
                >
                  {formatEuro(best.profitCustom, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Other mortgage */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {bestMortgage === 'annuity' ? 'Linear' : 'Annuity'}
              </span>
              <span className="text-[10px] text-slate-600">Alternative</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Monthly net cost</span>
                <span className="text-slate-200 font-mono">{formatEuro(other.avgMonthlyNet)}/mo</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Equity built</span>
                <span className="text-slate-300 font-mono">{formatEuro(other.totalEquitySaved, true)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Profit @ {formatPercent(inputs.marketGrowth * 100, 1)}</span>
                <span
                  className="font-mono font-semibold"
                  style={{ color: other.profitCustom >= 0 ? '#10b981' : '#f43f5e' }}
                >
                  {formatEuro(other.profitCustom, true)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stat pills row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatPill
            label="Annuity Monthly"
            value={formatEuro(annuity.avgMonthlyNet) + '/mo'}
          />
          <StatPill
            label="Linear Monthly"
            value={formatEuro(linear.avgMonthlyNet) + '/mo'}
          />
          <StatPill
            label="Rent Monthly"
            value={formatEuro(inputs.monthlyRent) + '/mo'}
          />
          <StatPill
            label="Total Rent Cost"
            value={formatEuro(rentingCost, true)}
            positive={false}
          />
        </div>
      </div>
    </div>
  );
}
