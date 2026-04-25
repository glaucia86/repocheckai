import React from "https://esm.sh/react@18.3.1";
import { SearchIcon } from "./ui.tsx";
import type { ModelOption } from "../types.ts";

interface ModelPickerProps {
  open: boolean;
  modelQuery: string;
  highlightedModelId: string | null;
  selectedModelId: string;
  freeModels: ModelOption[];
  premiumModels: ModelOption[];
  modelNavigationList: ModelOption[];
  modelSearchRef: React.RefObject<HTMLInputElement>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  labels: {
    title: string;
    close: string;
    searchPlaceholder: string;
    free: string;
    premium: string;
    noFree: string;
    noPremium: string;
  };
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onHighlightedModelChange: (value: string) => void;
  onSelect: (modelId: string) => void;
}

export const ModelPicker = ({
  open,
  modelQuery,
  highlightedModelId,
  selectedModelId,
  freeModels,
  premiumModels,
  modelNavigationList,
  modelSearchRef,
  triggerRef,
  labels,
  onClose,
  onQueryChange,
  onHighlightedModelChange,
  onSelect,
}: ModelPickerProps) => {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  React.useEffect(() => {
    if (open) return;
    triggerRef.current?.focus();
  }, [open, triggerRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center bg-slate-900/45 px-4 pt-20" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="model-picker-title"
        className="glass w-full max-w-2xl rounded-3xl p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 id="model-picker-title" className="text-base font-bold">
            {labels.title}
          </h3>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600">{labels.close}</span>
        </div>
        <div className="relative mb-3">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
            <SearchIcon />
          </span>
          <input
            ref={modelSearchRef}
            value={modelQuery}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (modelNavigationList.length === 0) return;
              const currentIndex = modelNavigationList.findIndex((model) => model.id === highlightedModelId);
              if (event.key === "ArrowDown") {
                event.preventDefault();
                const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % modelNavigationList.length;
                onHighlightedModelChange(modelNavigationList[nextIndex].id);
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                const prevIndex = currentIndex <= 0 ? modelNavigationList.length - 1 : currentIndex - 1;
                onHighlightedModelChange(modelNavigationList[prevIndex].id);
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const targetId = highlightedModelId || modelNavigationList[0].id;
                onSelect(targetId);
              }
            }}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-2xl border border-slate-300 bg-white/90 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        <div className="max-h-[50vh] space-y-3 overflow-auto pr-1">
          <div>
            <p className="mb-2 text-xs font-mono uppercase tracking-[0.16em] text-slate-500">{labels.free}</p>
            <div className="space-y-1">
              {freeModels.length === 0 ? (
                <p className="rounded-xl bg-white/70 px-3 py-2 text-xs text-slate-500">{labels.noFree}</p>
              ) : (
                freeModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => onSelect(model.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                      selectedModelId === model.id
                        ? "bg-cyan-100 text-cyan-900"
                        : highlightedModelId === model.id
                          ? "bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200"
                          : "bg-white/80 hover:bg-slate-100"
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
                  >
                    <span className="pr-3">
                      <span className="block font-semibold text-slate-800">
                        {model.name}
                        {model.isAuto ? <span className="ml-2 text-[11px] uppercase tracking-[0.16em] text-cyan-700">Auto</span> : null}
                      </span>
                      <span className="block text-xs text-slate-500">{model.planSummary}</span>
                      {model.note ? <span className="block text-[11px] text-slate-400">{model.note}</span> : null}
                    </span>
                    <span className="text-right">
                      <span className="block font-mono text-[11px] text-slate-500">{model.id}</span>
                      {typeof model.requestMultiplier === "number" ? (
                        <span className="block text-[11px] text-slate-400">{`${model.requestMultiplier}x`}</span>
                      ) : null}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-mono uppercase tracking-[0.16em] text-slate-500">{labels.premium}</p>
            <div className="space-y-1">
              {premiumModels.length === 0 ? (
                <p className="rounded-xl bg-white/70 px-3 py-2 text-xs text-slate-500">{labels.noPremium}</p>
              ) : (
                premiumModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => onSelect(model.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                      selectedModelId === model.id
                        ? "bg-amber-100 text-amber-900"
                        : highlightedModelId === model.id
                          ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                          : "bg-white/80 hover:bg-slate-100"
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
                  >
                    <span className="pr-3">
                      <span className="block font-semibold text-slate-800">
                        {model.name}
                        {model.isAuto ? <span className="ml-2 text-[11px] uppercase tracking-[0.16em] text-cyan-700">Auto</span> : null}
                      </span>
                      <span className="block text-xs text-slate-500">{model.planSummary}</span>
                      {model.note ? <span className="block text-[11px] text-slate-400">{model.note}</span> : null}
                    </span>
                    <span className="text-right">
                      <span className="block font-mono text-[11px] text-slate-500">{model.id}</span>
                      {typeof model.requestMultiplier === "number" ? (
                        <span className="block text-[11px] text-slate-400">{`${model.requestMultiplier}x`}</span>
                      ) : null}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
