'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { InputSidebar } from '@/components/InputSidebar';
import { VerdictCard } from '@/components/VerdictCard';
import { ComparisonTable } from '@/components/ComparisonTable';
import { MarketSentimentTable } from '@/components/MarketSentimentTable';
import { useMortgageCalculator, type Inputs } from '@/hooks/useMortgageCalculator';

// Dynamic import avoids SSR issues with Recharts + ResponsiveContainer
const EquityChart = dynamic(
  () => import('@/components/EquityChart').then((m) => m.EquityChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 h-[420px] flex items-center justify-center">
      <div className="text-sm text-slate-600 animate-pulse">Loading chart…</div>
    </div>
  );
}

const DEFAULT_INPUTS: Inputs = {
  housePrice: 500_000,
  downPayment: 50_000,
  monthlyRent: 2_380,
  annualRate: 0.0371,
  years: 3,
  marketGrowth: 0.02,
};

export default function Home() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const results = useMortgageCalculator(inputs);

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/30">
              €
            </div>
            <div>
              <span className="font-semibold text-slate-100 text-sm">BuyOrRent.nl</span>
              <span className="ml-2 text-[10px] text-slate-600 hidden sm:inline">
                Dutch NL 2026 · Annuity vs. Linear Mortgage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status pills */}
            <div className="hidden sm:flex items-center gap-2 text-[10px]">
              <div className="flex items-center gap-1 rounded-full border border-slate-800 px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-500">NHG Rate: {(inputs.annualRate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-slate-800 px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-slate-500">
                  Market: {inputs.marketGrowth >= 0 ? '+' : ''}{(inputs.marketGrowth * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="lg:hidden flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Inputs
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex">
        {/* ── Sidebar (desktop) ───────────────────────────────────────────── */}
        <aside className="hidden lg:block w-[300px] xl:w-[320px] shrink-0 border-r border-slate-800/60 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <InputSidebar inputs={inputs} onChange={setInputs} />
        </aside>

        {/* ── Mobile Sidebar Overlay ────────────────────────────────────── */}
        {sidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden fixed left-0 top-14 bottom-0 w-[300px] bg-[#0a1628] border-r border-slate-800 z-50 overflow-y-auto animate-slide-up">
              <InputSidebar inputs={inputs} onChange={setInputs} />
            </div>
          </>
        )}

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
          {/* Verdict */}
          <VerdictCard results={results} inputs={inputs} />

          {/* Chart */}
          <EquityChart
            chartData={results.chartData}
            years={inputs.years}
            marketGrowth={inputs.marketGrowth}
          />

          {/* Comparison Table */}
          <ComparisonTable results={results} inputs={inputs} />

          {/* Market Sensitivity */}
          <MarketSentimentTable
            sensitivity={results.sensitivity}
            rentingCost={results.rentingCost}
            activeGrowth={inputs.marketGrowth}
          />

          {/* Footer */}
          <footer className="pt-4 pb-8 text-center">
            <p className="text-[10px] text-slate-700">
              BuyOrRent.nl · Dutch NL 2026 financial model · For informational purposes only.
              Consult a financial advisor before making property decisions.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
