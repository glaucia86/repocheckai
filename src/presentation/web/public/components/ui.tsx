import React from "https://esm.sh/react@18.3.1";
import { toneByState } from "../constants.ts";
import { t } from "../i18n/index.ts";
import type { JobState, Locale } from "../types.ts";

export const StatePill = ({ state }: { state: JobState }) => (
  <span
    className={`inline-flex min-w-[7.75rem] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold ${toneByState[state] || toneByState.idle}`}
  >
    {String(state).toUpperCase()}
  </span>
);

export const SelectChevron = () => (
  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 transition group-focus-within:text-cobalt">
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.18l3.71-3.95a.75.75 0 111.1 1.02l-4.25 4.52a.75.75 0 01-1.1 0L5.21 8.25a.75.75 0 01.02-1.04z"
        clipRule="evenodd"
      />
    </svg>
  </span>
);

export const SearchIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M12.9 14.32a8 8 0 111.41-1.41l3.2 3.2a1 1 0 01-1.42 1.42l-3.2-3.2zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
      clipRule="evenodd"
    />
  </svg>
);

export const MetricTile = ({
  label,
  value,
  accent = "from-cobalt to-tide",
}: {
  label: string;
  value: string;
  accent?: string;
}) => (
  <div className="glass rounded-2xl p-4 shadow-glow">
    <p className="mb-1 text-[11px] font-mono uppercase tracking-[0.15em] text-slate-500">{label}</p>
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${accent}`} />
      <p className="text-xl font-bold tracking-tight text-ink">{value}</p>
    </div>
  </div>
);

export const ProgressRing = ({ value, active = false }: { value: number; active?: boolean }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div className={`relative h-24 w-24 transition ${active ? "scale-[1.02] drop-shadow-[0_0_12px_rgba(14,116,144,0.35)]" : ""}`}>
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={radius} stroke="rgba(15,23,42,0.12)" strokeWidth="7" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 450ms ease" }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0E7490" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{safe}%</div>
    </div>
  );
};

export const SeverityLegend = ({ locale }: { locale: Locale }) => (
  <div className="mt-3 flex flex-wrap items-center gap-2">
    <span className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-800">
      {t("severityCritical", locale)}
    </span>
    <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
      {t("severityHigh", locale)}
    </span>
    <span className="rounded-full border border-cyan-200 bg-cyan-100 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
      {t("severitySuggestion", locale)}
    </span>
  </div>
);
