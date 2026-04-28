'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'buyOrRent_welcomeDismissed_v1';

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl font-bold text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
            €
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Should you buy or rent in the Netherlands?</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Dutch NL 2026 model — personalized in seconds. Adjust the inputs in the sidebar and read the verdict below.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-slate-600 hover:text-slate-400 transition-colors text-xl leading-none shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { step: '1', title: 'Set property details', desc: 'House price, down payment, transfer tax' },
          { step: '2', title: 'Configure mortgage', desc: 'Interest rate & tax relief rate' },
          { step: '3', title: 'Set rental reference', desc: 'What you\'d pay renting a similar home' },
          { step: '4', title: 'Read the verdict', desc: 'Total profit, breakeven year & sensitivity' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center justify-center mb-2">
              {step}
            </div>
            <div className="text-xs font-semibold text-slate-200 mb-0.5">{title}</div>
            <div className="text-[10px] text-slate-500">{desc}</div>
          </div>
        ))}
      </div>

      <button
        onClick={dismiss}
        className="w-full py-2 rounded-xl bg-emerald-700/60 hover:bg-emerald-600/70 text-xs font-semibold text-white transition-colors"
      >
        Get started →
      </button>
    </div>
  );
}
