'use client';

import { useState } from 'react';

interface Props {
  content: string;
  className?: string;
}

export function Tooltip({ content, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex items-center ${className ?? ''}`}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
        className="w-3.5 h-3.5 rounded-full bg-slate-700/80 hover:bg-slate-600 text-slate-500 hover:text-slate-200 text-[9px] font-bold inline-flex items-center justify-center transition-colors cursor-help flex-shrink-0"
        aria-label="More info"
      >
        i
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 z-[200] w-60 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-3 pointer-events-none">
          <p className="text-[11px] text-slate-300 leading-relaxed">{content}</p>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 overflow-hidden h-1.5">
            <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 origin-top-left ml-0.5 mt-[-4px]" />
          </div>
        </div>
      )}
    </span>
  );
}
