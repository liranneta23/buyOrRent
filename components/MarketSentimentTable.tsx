'use client';

import { formatEuro, formatPercent, cn } from '@/lib/utils';
import type { SensitivityRow } from '@/hooks/useMortgageCalculator';

interface Props {
  sensitivity: SensitivityRow[];
  rentingCost: number;
  activeGrowth: number; // fraction, e.g. 0.02
}

function SentimentBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(Math.abs(value) / max, 1) * 100;
  const positive = value >= 0;
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: positive ? '#10b981' : '#f43f5e',
          }}
        />
      </div>
    </div>
  );
}

export function MarketSentimentTable({ sensitivity, rentingCost, activeGrowth }: Props) {
  const maxAbs = Math.max(
    ...sensitivity.map((r) => Math.max(Math.abs(r.annuityVsRent), Math.abs(r.linearVsRent))),
    1,
  );

  const activeGrowthPct = Math.round(activeGrowth * 1000) / 10; // e.g. 2.0

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Market Sensitivity Analysis</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            How much better off buying is vs renting across all market scenarios
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-violet-800/50 bg-violet-950/30 px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[11px] text-violet-300 font-medium">
            Active: {formatPercent(activeGrowthPct, 1)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                Annual Growth
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-wider text-emerald-700 font-semibold whitespace-nowrap">
                Annuity Profit
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-wider text-blue-700 font-semibold whitespace-nowrap">
                Linear Profit
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-wider text-emerald-700 font-semibold whitespace-nowrap">
                Annuity vs Rent
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-wider text-blue-700 font-semibold whitespace-nowrap">
                Linear vs Rent
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider text-slate-600 font-semibold hidden sm:table-cell">
                Advantage
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {sensitivity.map((row) => {
              const isActive = Math.abs(row.growth - activeGrowthPct) < 0.01;
              const bestVsRent = Math.max(row.annuityVsRent, row.linearVsRent);
              const bestMortgage = row.annuityVsRent >= row.linearVsRent ? 'annuity' : 'linear';

              return (
                <tr
                  key={row.growth}
                  className="transition-colors"
                  style={{
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.04) 100%)'
                      : undefined,
                    borderLeft: isActive ? '2px solid #a78bfa' : '2px solid transparent',
                  }}
                >
                  {/* Growth label */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono font-semibold text-xs"
                        style={{
                          color:
                            row.growth > 0
                              ? '#10b981'
                              : row.growth < 0
                              ? '#f43f5e'
                              : '#64748b',
                        }}
                      >
                        {formatPercent(row.growth, 1)}
                      </span>
                      {isActive && (
                        <span className="rounded-full px-1.5 py-0.5 bg-violet-900/60 text-violet-300 text-[9px] font-bold">
                          ▶
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Annuity profit */}
                  <td
                    className="px-4 py-2.5 text-right font-mono tabular-nums"
                    style={{ color: row.annuityProfit >= 0 ? '#10b981' : '#f43f5e' }}
                  >
                    {formatEuro(row.annuityProfit, true)}
                  </td>

                  {/* Linear profit */}
                  <td
                    className="px-4 py-2.5 text-right font-mono tabular-nums"
                    style={{ color: row.linearProfit >= 0 ? '#3b82f6' : '#f43f5e' }}
                  >
                    {formatEuro(row.linearProfit, true)}
                  </td>

                  {/* Annuity vs Rent */}
                  <td
                    className={cn(
                      'px-4 py-2.5 text-right font-mono tabular-nums font-semibold',
                      bestMortgage === 'annuity' ? 'text-emerald-400' : 'text-slate-400',
                    )}
                    style={{ color: row.annuityVsRent >= 0 ? undefined : '#f43f5e' }}
                  >
                    {row.annuityVsRent >= 0 ? '+' : ''}
                    {formatEuro(row.annuityVsRent, true)}
                  </td>

                  {/* Linear vs Rent */}
                  <td
                    className={cn(
                      'px-4 py-2.5 text-right font-mono tabular-nums font-semibold',
                      bestMortgage === 'linear' ? 'text-blue-400' : 'text-slate-400',
                    )}
                    style={{ color: row.linearVsRent >= 0 ? undefined : '#f43f5e' }}
                  >
                    {row.linearVsRent >= 0 ? '+' : ''}
                    {formatEuro(row.linearVsRent, true)}
                  </td>

                  {/* Bar */}
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <SentimentBar value={bestVsRent} max={maxAbs} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/20">
        <p className="text-[10px] text-slate-600">
          "vs Rent" = buying profit − renting position (−total rent). Positive = buying wins.
          Highlighted row = your active market sentiment setting. Bolded column = better mortgage type per scenario.
        </p>
      </div>
    </div>
  );
}
