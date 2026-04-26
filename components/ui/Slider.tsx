'use client';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  onChange: (v: number) => void;
  accent?: 'emerald' | 'violet';
  subLabel?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  displayValue,
  onChange,
  accent = 'emerald',
  subLabel,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackColor = accent === 'violet' ? '#a78bfa' : '#10b981';

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        <span
          className="text-sm font-semibold font-mono tabular-nums"
          style={{ color: trackColor }}
        >
          {displayValue}
        </span>
      </div>
      {subLabel && (
        <p className="text-[10px] text-slate-600 -mt-1">{subLabel}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={accent === 'violet' ? 'sentiment-slider' : ''}
        style={{
          width: '100%',
          background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${pct}%, #1e293b ${pct}%, #1e293b 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-700">
        <span>{min.toLocaleString('nl-NL')}</span>
        <span>{max.toLocaleString('nl-NL')}</span>
      </div>
    </div>
  );
}
