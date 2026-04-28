'use client';

import { Slider } from './ui/Slider';
import { Tooltip } from './ui/Tooltip';
import { AssumptionsEditor } from './AssumptionsEditor';
import { formatEuro } from '@/lib/utils';
import type { Inputs } from '@/hooks/useMortgageCalculator';

interface Props {
  inputs: Inputs;
  onChange: (inputs: Inputs) => void;
}

function SectionTitle({ children, step }: { children: React.ReactNode; step?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {step !== undefined && (
        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 text-[9px] font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
      )}
      <div className="h-px flex-1 bg-slate-800" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
        {children}
      </span>
      <div className="h-px flex-1 bg-slate-800" />
    </div>
  );
}

export function InputSidebar({ inputs, onChange }: Props) {
  const set = <K extends keyof Inputs>(key: K, val: Inputs[K]) =>
    onChange({ ...inputs, [key]: val });

  const loanAmount = inputs.housePrice - inputs.downPayment;
  const ltv = inputs.housePrice > 0 ? (loanAmount / inputs.housePrice) * 100 : 0;
  const maxDown = Math.round(inputs.housePrice * 0.5 / 1000) * 1000;

  return (
    <div className="p-5 space-y-6">
      {/* Branding */}
      <div className="pb-1">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
            €
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">BuyOrRent.nl</div>
            <div className="text-[10px] text-slate-500">Dutch NL 2026 Model</div>
          </div>
        </div>
      </div>

      {/* Property */}
      <div>
        <SectionTitle step={1}>Property</SectionTitle>
        <div className="space-y-5">
          <Slider
            label="House Price"
            tooltip="The purchase price of the property you're considering."
            value={inputs.housePrice}
            min={150_000}
            max={1_500_000}
            step={5_000}
            displayValue={formatEuro(inputs.housePrice, true)}
            onChange={(v) => {
              const newMax = Math.round(v * 0.5 / 1000) * 1000;
              set('housePrice', v);
              if (inputs.downPayment > newMax) onChange({ ...inputs, housePrice: v, downPayment: newMax });
            }}
          />
          <Slider
            label="Down Payment"
            value={inputs.downPayment}
            min={10_000}
            max={maxDown}
            step={5_000}
            displayValue={formatEuro(inputs.downPayment, true)}
            onChange={(v) => set('downPayment', v)}
          />
          {/* Transfer tax — percentage, auto-linked to house price */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Transfer Tax
                <Tooltip content="Overdrachtsbelasting: a one-time tax paid when buying. Currently 2% for most buyers. First-time buyers under 35 pay 0% up to €510k (2026)." />
              </label>
              <div className="text-right">
                <span className="text-sm font-semibold font-mono text-emerald-400">
                  {inputs.transferTaxRate.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-600 ml-1.5">
                  = {formatEuro(inputs.transferTaxRate / 100 * inputs.housePrice, true)}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={inputs.transferTaxRate}
              onChange={e => set('transferTaxRate', Number(e.target.value))}
              style={{
                width: '100%',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${(inputs.transferTaxRate / 10) * 100}%, #1e293b ${(inputs.transferTaxRate / 10) * 100}%, #1e293b 100%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-slate-700">
              <span>0%</span>
              <span className="text-slate-600 text-[9px]">2% if buyer is above 35</span>
              <span>10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loan summary pill */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5">Loan Amount</div>
          <div className="text-sm font-semibold text-emerald-400 font-mono">
            {formatEuro(Math.max(0, loanAmount), true)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5 flex items-center justify-center gap-1">
            LTV Ratio
            <Tooltip content="Loan-to-Value: your loan as a % of the home's value. Below 80% may unlock a better interest rate and removes NHG surcharge." />
          </div>
          <div
            className="text-sm font-semibold font-mono"
            style={{ color: ltv > 80 ? '#f59e0b' : '#10b981' }}
          >
            {ltv.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Mortgage */}
      <div>
        <SectionTitle step={2}>Mortgage</SectionTitle>
        <div className="space-y-5">
          <Slider
            label="Annual Interest Rate"
            tooltip="The yearly interest rate on your mortgage. In the Netherlands, this is typically fixed for 5, 10, or 20 years. The current market average is ~4%."
            value={Math.round(inputs.annualRate * 10000) / 100}
            min={1}
            max={8}
            step={0.05}
            displayValue={`${(inputs.annualRate * 100).toFixed(2)}%`}
            onChange={(v) => set('annualRate', v / 100)}
            subLabel="The average rate is currently ~4%"
          />
          <Slider
            label="Comparison Period"
            tooltip="How many years you plan to own before potentially selling. Longer horizons generally favor buying since fixed sunk costs (transfer tax, notary) are spread over more years."
            value={inputs.years}
            min={1}
            max={30}
            step={1}
            displayValue={`${inputs.years} yr`}
            onChange={(v) => set('years', v)}
          />
          {/* Tax relief rate — precise value, number input not slider */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Tax Relief Rate
                <Tooltip content="Hypotheekrenteaftrek: you deduct mortgage interest from your taxable income. The 2026 maximum is 37.56%." />
              </label>
              <span className="text-[10px] text-slate-600">hypotheekrenteaftrek</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={55}
                step={0.01}
                value={inputs.taxReliefRate}
                onChange={e => set('taxReliefRate', Math.min(55, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono text-right focus:outline-none focus:border-emerald-700/70 transition-colors"
              />
              <span className="text-sm text-slate-500 font-medium">%</span>
            </div>
            <p className="text-[10px] text-slate-600">
              2026 max is 37.56%
            </p>
          </div>
        </div>
      </div>

      {/* Rental Reference */}
      <div>
        <SectionTitle step={3}>Rental Reference</SectionTitle>
        <div className="space-y-5">
          <Slider
            label="Equivalent Monthly Rent"
            tooltip="The rent you'd pay for a comparable property. This is the baseline for the buy-vs-rent comparison."
            value={inputs.monthlyRent}
            min={500}
            max={5_000}
            step={50}
            displayValue={formatEuro(inputs.monthlyRent) + '/mo'}
            onChange={(v) => set('monthlyRent', v)}
            subLabel="What you'd pay to rent a similar property"
          />
          <Slider
            label="Annual Rent Increase"
            tooltip="How much rent rises each year on average. Dutch rents have increased ~4–6%/yr in recent years, compounding over time."
            value={Math.round(inputs.rentIncrease * 1000) / 10}
            min={0}
            max={10}
            step={0.5}
            displayValue={`+${(inputs.rentIncrease * 100).toFixed(1)}%/yr`}
            onChange={(v) => set('rentIncrease', v / 100)}
            subLabel="Dutch avg rent increase was ~5% in recent years"
          />
        </div>
      </div>

      {/* Market Sentiment */}
      <div>
        <SectionTitle step={4}>Market Sentiment</SectionTitle>
        <div className="rounded-xl border border-violet-900/50 bg-violet-950/20 p-3 space-y-3">
          <Slider
            label="Annual House Price Growth"
            value={Math.round(inputs.marketGrowth * 1000) / 10}
            min={-10}
            max={10}
            step={0.5}
            displayValue={`${inputs.marketGrowth >= 0 ? '+' : ''}${(inputs.marketGrowth * 100).toFixed(1)}%`}
            onChange={(v) => set('marketGrowth', v / 100)}
            subLabel="The growth in the last 10 years was about 8% per year"
            accent="violet"
          />
          <div className="flex justify-between text-[10px]">
            <span className="text-rose-400">Bearish</span>
            <span className="text-slate-600">Neutral</span>
            <span className="text-emerald-400">Bullish</span>
          </div>
        </div>
      </div>

      {/* Cost Assumptions */}
      <div>
        <SectionTitle step={5}>Cost Assumptions</SectionTitle>
        <AssumptionsEditor
          assumptions={inputs.assumptions}
          onChange={(assumptions) => set('assumptions', assumptions)}
        />
      </div>
    </div>
  );
}
