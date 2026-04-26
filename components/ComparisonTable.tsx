'use client';

import { formatEuro } from '@/lib/utils';
import type { MortgageResults, Inputs } from '@/hooks/useMortgageCalculator';

interface Props {
  results: MortgageResults;
  inputs: Inputs;
}

function MoneyCell({ value, dim = false }: { value: number; dim?: boolean }) {
  const color = dim ? '#64748b' : value >= 0 ? '#10b981' : '#f43f5e';
  return (
    <td className="px-4 py-3 text-right font-mono text-sm font-medium tabular-nums" style={{ color }}>
      {formatEuro(value)}
    </td>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider font-semibold text-slate-500 whitespace-nowrap">
      {children}
    </th>
  );
}

function RowLabel({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
      <div>{children}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </td>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <tr className="border-t border-slate-800">
      <td
        colSpan={4}
        className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-600 font-semibold bg-slate-900/40"
      >
        {label}
      </td>
    </tr>
  );
}

export function ComparisonTable({ results, inputs }: Props) {
  const { annuity, linear, rentingCost } = results;
  const { years, marketGrowth } = inputs;
  const avgMonthlyRent = Math.round(rentingCost / (years * 12));
  const rentingProfit = -rentingCost; // renting position is always negative

  const customLabel = `${marketGrowth >= 0 ? '+' : ''}${(marketGrowth * 100).toFixed(1)}% (selected)`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      {/* Title */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Scenario Comparison</h2>
          <p className="text-xs text-slate-500 mt-0.5">{years}-year window · all amounts in EUR</p>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className="rounded-full px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">Annuity</span>
          <span className="rounded-full px-2 py-0.5 bg-blue-950/60 border border-blue-800/40 text-blue-400">Linear</span>
          <span className="rounded-full px-2 py-0.5 bg-rose-950/60 border border-rose-800/40 text-rose-400">Renting</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/60">
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-slate-600">
                Metric
              </th>
              <HeaderCell>Annuity</HeaderCell>
              <HeaderCell>Linear</HeaderCell>
              <HeaderCell>Renting</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {/* Cash Flow */}
            <Divider label="Monthly Cash Flow" />
            <tr className="hover:bg-slate-800/20 transition-colors">
              <RowLabel sub="Average over period">Net Monthly Outflow</RowLabel>
              <MoneyCell value={-annuity.avgMonthlyNet} />
              <MoneyCell value={-linear.avgMonthlyNet} />
              <MoneyCell value={-avgMonthlyRent} />
            </tr>

            {/* Cost Breakdown */}
            <Divider label="Total Costs Over Period" />
            <tr className="hover:bg-slate-800/20 transition-colors">
              <RowLabel sub="Money you never see again">Sunk Costs</RowLabel>
              <MoneyCell value={-annuity.totalSunkCosts} />
              <MoneyCell value={-linear.totalSunkCosts} />
              <MoneyCell value={rentingProfit} />
            </tr>
            <tr className="hover:bg-slate-800/20 transition-colors">
              <RowLabel sub="Principal returned when selling">Equity Saved</RowLabel>
              <td className="px-4 py-3 text-right font-mono text-sm font-medium text-emerald-400 tabular-nums">
                +{formatEuro(annuity.totalEquitySaved)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm font-medium text-blue-400 tabular-nums">
                +{formatEuro(linear.totalEquitySaved)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-slate-600 tabular-nums">—</td>
            </tr>
            <tr className="hover:bg-slate-800/20 transition-colors">
              <RowLabel sub="Remaining loan at end of period">Remaining Loan</RowLabel>
              <MoneyCell value={-annuity.remainingLoanBalance} />
              <MoneyCell value={-linear.remainingLoanBalance} />
              <td className="px-4 py-3 text-right font-mono text-sm text-slate-600 tabular-nums">—</td>
            </tr>

            {/* Profit Scenarios */}
            <Divider label="Net Profit by Market Scenario" />
            {[
              { label: 'Pessimistic', sub: 'House prices @ −4%/yr', ap: annuity.profitPessimistic, lp: linear.profitPessimistic },
              { label: 'Flat Market', sub: 'House prices @ 0%/yr', ap: annuity.profitFlat, lp: linear.profitFlat },
              { label: 'Optimistic', sub: 'House prices @ +4%/yr', ap: annuity.profitOptimistic, lp: linear.profitOptimistic },
              { label: 'Custom (selected)', sub: `House prices @ ${customLabel}`, ap: annuity.profitCustom, lp: linear.profitCustom },
            ].map(({ label, sub, ap, lp }) => (
              <tr
                key={label}
                className="hover:bg-slate-800/20 transition-colors"
                style={
                  label === 'Custom (selected)'
                    ? { background: 'rgba(167,139,250,0.04)', borderTop: '1px solid rgba(167,139,250,0.2)' }
                    : {}
                }
              >
                <RowLabel sub={sub}>{label}</RowLabel>
                <MoneyCell value={ap} />
                <MoneyCell value={lp} />
                <MoneyCell value={rentingProfit} />
              </tr>
            ))}

            {/* vs Renting */}
            <Divider label="Advantage vs Renting" />
            {[
              { label: 'vs Renting @ −4%', ap: annuity.profitPessimistic + rentingCost, lp: linear.profitPessimistic + rentingCost },
              { label: 'vs Renting @ 0%', ap: annuity.profitFlat + rentingCost, lp: linear.profitFlat + rentingCost },
              { label: 'vs Renting @ +4%', ap: annuity.profitOptimistic + rentingCost, lp: linear.profitOptimistic + rentingCost },
              { label: `vs Renting @ ${customLabel.split(' ')[0]}`, ap: annuity.profitCustom + rentingCost, lp: linear.profitCustom + rentingCost },
            ].map(({ label, ap, lp }) => (
              <tr
                key={label}
                className="font-medium hover:bg-slate-800/20 transition-colors"
                style={
                  label.includes('selected') || label.includes(customLabel.split(' ')[0])
                    ? { background: 'rgba(167,139,250,0.04)' }
                    : {}
                }
              >
                <RowLabel>{label}</RowLabel>
                <MoneyCell value={ap} />
                <MoneyCell value={lp} />
                <td className="px-4 py-3 text-right font-mono text-sm text-slate-600 tabular-nums">base</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/20">
        <p className="text-[10px] text-slate-600">
          Profit = appreciation gain + equity built − all sunk costs (interest net of tax, fees, VVE, OZB, EWF, insurance).
          Renting position = −total rent paid. Advantage vs Renting = buying profit − renting position.
        </p>
      </div>
    </div>
  );
}
