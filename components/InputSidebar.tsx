'use client';

import { Slider } from './ui/Slider';
import { formatEuro } from '@/lib/utils';
import type { Inputs } from '@/hooks/useMortgageCalculator';

interface Props {
  inputs: Inputs;
  onChange: (inputs: Inputs) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
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
        <SectionTitle>Property</SectionTitle>
        <div className="space-y-5">
          <Slider
            label="House Price"
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
          <div className="text-[10px] text-slate-500 mb-0.5">LTV Ratio</div>
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
        <SectionTitle>Mortgage</SectionTitle>
        <div className="space-y-5">
          <Slider
            label="Annual Interest Rate"
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
            value={inputs.years}
            min={1}
            max={30}
            step={1}
            displayValue={`${inputs.years} yr`}
            onChange={(v) => set('years', v)}
          />
        </div>
      </div>

      {/* Rental Reference */}
      <div>
        <SectionTitle>Rental Reference</SectionTitle>
        <Slider
          label="Equivalent Monthly Rent"
          value={inputs.monthlyRent}
          min={500}
          max={5_000}
          step={50}
          displayValue={formatEuro(inputs.monthlyRent) + '/mo'}
          onChange={(v) => set('monthlyRent', v)}
          subLabel="What you'd pay to rent a similar property"
        />
      </div>

      {/* Market Sentiment */}
      <div>
        <SectionTitle>Market Sentiment</SectionTitle>
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

      {/* Assumptions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">
          Fixed Assumptions
        </div>
        {[
          ['VVE / Service', '€250/mo'],
          ['Life Insurance', '€20/mo'],
          ['OZB Tax', '0.10% WOZ value per year'],
          ['Eigenwoningforfait', '0.35% WOZ value per year'],
          ['Tax Relief Rate', '37.56%'],
          ['Mortgage Term', '30 years'],
          ['Transfer Tax', '2% (if older than 35)'],
          ['Selling Costs', '€8,000'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[10px]">
            <span className="text-slate-600">{k}</span>
            <span className="text-slate-500 font-mono">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
