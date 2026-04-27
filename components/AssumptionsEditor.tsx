'use client';

import { useState } from 'react';
import type { Assumption } from '@/hooks/useMortgageCalculator';

interface Props {
  assumptions: Assumption[];
  onChange: (assumptions: Assumption[]) => void;
}

const TYPE_META = {
  'monthly':  { label: 'Monthly',  suffix: '/mo', color: 'text-blue-400',   border: 'border-blue-800/50',   bg: 'bg-blue-950/30'   },
  'annual':   { label: 'Annual',   suffix: '/yr', color: 'text-emerald-400', border: 'border-emerald-800/50', bg: 'bg-emerald-950/30' },
  'one-time': { label: 'One-time', suffix: '',    color: 'text-amber-400',   border: 'border-amber-800/50',   bg: 'bg-amber-950/30'  },
} as const;

export function AssumptionsEditor({ assumptions, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<Assumption['type']>('monthly');

  const updateAmount = (id: string, amount: number) =>
    onChange(assumptions.map(a => (a.id === id ? { ...a, amount } : a)));

  const remove = (id: string) =>
    onChange(assumptions.filter(a => a.id !== id));

  const add = () => {
    const amt = parseFloat(newAmount);
    if (!newLabel.trim() || isNaN(amt) || amt <= 0) return;
    onChange([
      ...assumptions,
      { id: `custom-${Date.now()}`, label: newLabel.trim(), amount: amt, type: newType },
    ]);
    setNewLabel('');
    setNewAmount('');
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      {assumptions.map(a => {
        const meta = TYPE_META[a.type];
        return (
          <div
            key={a.id}
            className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 space-y-2"
          >
            {/* Row 1: label + type badge + delete */}
            <div className="flex items-center gap-2">
              <span className="flex-1 text-xs text-slate-300 truncate">{a.label}</span>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${meta.bg} ${meta.border} ${meta.color}`}
              >
                {meta.label}
              </span>
              <button
                onClick={() => remove(a.id)}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors text-base leading-none"
                title="Remove"
              >
                ×
              </button>
            </div>

            {/* Row 2: amount input */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-600">€</span>
              <input
                type="number"
                min={0}
                value={a.amount}
                onChange={e => updateAmount(a.id, parseFloat(e.target.value) || 0)}
                className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded px-2 py-1 text-xs text-slate-200 font-mono text-right focus:outline-none focus:border-emerald-700/70 transition-colors"
              />
              {meta.suffix && (
                <span className="text-[10px] text-slate-600 w-6">{meta.suffix}</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Add form */}
      {adding ? (
        <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-3 space-y-2.5">
          <input
            type="text"
            placeholder="Label (e.g. Parking spot)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            className="w-full bg-slate-800/60 border border-slate-700/40 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-700/70 transition-colors"
          />
          <div className="flex gap-2">
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[10px] text-slate-600">€</span>
              <input
                type="number"
                min={0}
                placeholder="Amount"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-700/70 transition-colors"
              />
            </div>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as Assumption['type'])}
              className="bg-slate-800/60 border border-slate-700/40 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-700/70 cursor-pointer"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={!newLabel.trim() || !newAmount}
              className="flex-1 py-1.5 rounded-lg bg-emerald-700/70 hover:bg-emerald-600/70 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white font-semibold transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewLabel(''); setNewAmount(''); }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="text-sm leading-none">+</span> Add assumption
        </button>
      )}

      {/* System constants (read-only context) */}
      <div className="pt-1 space-y-1">
        <div className="text-[9px] uppercase tracking-widest text-slate-700 mb-1.5">System constants (not editable)</div>
        {[
          ['Eigenwoningforfait', '0.35% WOZ × tax relief% / yr'],
          ['Property Tax (OZB)', '0.10% WOZ / yr'],
          ['Mortgage Term', '30 years'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[10px]">
            <span className="text-slate-700">{k}</span>
            <span className="text-slate-700 font-mono">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
