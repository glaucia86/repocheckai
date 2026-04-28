/// <reference types="@types/react" />
/// <reference types="@types/react-dom" />
import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import { apiBase, cardClass, DEFAULT_MODEL_OPTIONS, selectClass, selectShellClass } from "./constants.ts";
import { buttonClassByVariant, focusRingClass } from "./design/tokens.ts";
import { createHeaders, requestJson } from "./lib/http.ts";
import { trackUiEvent } from "./lib/analytics.ts";
import { persistLocale, getInitialLocale, t } from "./i18n/index.ts";
import { EmptyState } from "./components/EmptyState.tsx";
import { LoadingState } from "./components/LoadingState.tsx";
import { Footer } from "./components/Footer.tsx";
import { StepProgress } from "./components/StepProgress.tsx";
import { MetricTile, ProgressRing, SelectChevron, SeverityLegend, StatePill } from "./components/ui.tsx";
import type { ExportFormat, FormState, JobStateData, Locale, ModelOption, ProgressEvent, ReportState, ReportTab } from "./types.ts";

const SAMPLE_REPO = "octocat/Hello-World";
const FORM_STORAGE_KEY = "repocheckai_last_form";
const RECENT_REPOS_KEY = "repocheckai_recent_repos";
const RECENT_REPOS_LIMIT = 5;
const DEFAULT_TIMEOUT_SECONDS_BY_MODE: Record<FormState["analysisMode"], string> = {
  quick: "300",
  deep: "600",
};

const App = () => {
  const [form, setForm] = useState<FormState>({
    repositoryInput: "",
    analysisMode: "quick",
    model: "claude-sonnet-4",
    maxFiles: "800",
    timeoutSeconds: "300",
    skills: "on",
    skillsMax: "2",
    publishAsIssue: false,
    githubToken: "",
  });
  const [job, setJob] = useState<JobStateData>({ id: "", state: "idle" });
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(DEFAULT_MODEL_OPTIONS);
  const [modelsLoadState, setModelsLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [modelsLoadError, setModelsLoadError] = useState("");
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [report, setReport] = useState<ReportState>({ markdown: "", json: null });
  const [activeTab, setActiveTab] = useState<ReportTab>("markdown");
  const [busy, setBusy] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [locale, setLocale] = useState<Locale>(() => getInitialLocale());
  const [recentRepositories, setRecentRepositories] = useState<string[]>([]);

  const progress = useMemo(() => {
    const withPercent = [...events].reverse().find((event) => typeof event.percent === "number");
    if (!withPercent) return 0;
    return Math.max(0, Math.min(100, Number(withPercent.percent)));
  }, [events]);

  const premiumModels = useMemo(() => modelOptions.filter((model) => model.premium), [modelOptions]);
  const freeModels = useMemo(() => modelOptions.filter((model) => !model.premium), [modelOptions]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!error) return;
    trackUiEvent("error_shown", { state: job.state });
  }, [error, job.state]);

  useEffect(() => {
    try {
      const rawForm = localStorage.getItem(FORM_STORAGE_KEY);
      if (rawForm) {
        const parsed = JSON.parse(rawForm) as Partial<FormState>;
        const savedTimeoutSeconds =
          typeof parsed.timeoutSeconds === "string"
            ? parsed.timeoutSeconds.trim()
            : "";
        // Migrate legacy default timeout (120s) to the per-mode baseline.
        setForm((current: FormState) => {
          const targetAnalysisMode = parsed.analysisMode ?? current.analysisMode;
          const defaultTimeoutSeconds = DEFAULT_TIMEOUT_SECONDS_BY_MODE[targetAnalysisMode];
          const migratedTimeoutSeconds =
            savedTimeoutSeconds && savedTimeoutSeconds !== "120"
              ? savedTimeoutSeconds
              : defaultTimeoutSeconds || current.timeoutSeconds;

          return {
            ...current,
            repositoryInput: parsed.repositoryInput || current.repositoryInput,
            analysisMode: parsed.analysisMode || current.analysisMode,
            model: parsed.model || current.model,
            maxFiles: parsed.maxFiles || current.maxFiles,
            timeoutSeconds: migratedTimeoutSeconds,
            skills: parsed.skills === "off" ? "off" : "on",
            skillsMax: parsed.skillsMax || current.skillsMax,
            publishAsIssue:
              typeof parsed.publishAsIssue === "boolean"
                ? parsed.publishAsIssue
                : current.publishAsIssue,
            githubToken: current.githubToken,
          };
        });
      }

      const rawRecent = localStorage.getItem(RECENT_REPOS_KEY);
      if (rawRecent) {
        const parsed = JSON.parse(rawRecent) as string[];
        if (Array.isArray(parsed)) {
          setRecentRepositories(parsed.filter((item) => typeof item === "string"));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const { githubToken: _githubToken, ...persistedForm } = form;
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(persistedForm));
    } catch {}
  }, [form]);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("repocheckai_effects_enabled");
      if (raw === "0") setEffectsEnabled(false);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("repocheckai_effects_enabled", effectsEnabled ? "1" : "0");
    } catch {}
    document.documentElement.classList.toggle("effects-off", !effectsEnabled);
  }, [effectsEnabled]);

  useEffect(() => {
    if (!effectsEnabled) {
      const root = document.documentElement;
      root.style.setProperty("--mx", "50%");
      root.style.setProperty("--my", "50%");
      root.style.setProperty("--px", "0px");
      root.style.setProperty("--py", "0px");
      return undefined;
    }

    const root = document.documentElement;
    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;

      root.style.setProperty("--mx", `${x}px`);
      root.style.setProperty("--my", `${y}px`);
      root.style.setProperty("--px", `${(((x / w - 0.5) * 2) * 16).toFixed(2)}px`);
      root.style.setProperty("--py", `${(((y / h - 0.5) * 2) * 12).toFixed(2)}px`);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [effectsEnabled]);

  const loadModels = async () => {
    setModelsLoadState("loading");
    setModelsLoadError("");

    try {
      const payload = await requestJson(`${apiBase}/models`);
      const models = Array.isArray(payload.models) ? (payload.models as ModelOption[]) : [];
      if (models.length === 0) {
        throw new Error("No models returned by the API.");
      }

      setModelOptions(models);
      setModelsLoadState("ready");
      setForm((current: FormState) => {
        const exists = models.some((model: ModelOption) => model.id === current.model);
        return exists ? current : { ...current, model: models[0].id };
      });
    } catch (err) {
      setModelsLoadState("error");
      setModelsLoadError((err as Error).message);
      setModelOptions((current: ModelOption[]) => (current.length > 0 ? current : DEFAULT_MODEL_OPTIONS));
      setForm((current: FormState) => {
        const fallbackModels = DEFAULT_MODEL_OPTIONS;
        const exists = fallbackModels.some((model: ModelOption) => model.id === current.model);
        return exists ? current : { ...current, model: fallbackModels[0]?.id || current.model };
      });
    }
  };

  useEffect(() => {
    void loadModels();
  }, []);

  useEffect(() => {
    if (!job.id || (job.state !== "running" && job.state !== "idle")) return undefined;

    const stream = new EventSource(`${apiBase}/jobs/${job.id}/events`);
    stream.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data) as ProgressEvent;
        setEvents((current: ProgressEvent[]) => {
          const already = current.some((item) => item.eventId === parsed.eventId);
          return already ? current : [...current, parsed];
        });

        if (parsed.eventType === "completed") setJob((current: JobStateData) => ({ ...current, state: "completed" }));
        if (parsed.eventType === "error") setJob((current: JobStateData) => ({ ...current, state: "error" }));
      } catch {
        setError("Failed to parse stream event.");
      }
    };
    stream.onerror = () => stream.close();
    return () => stream.close();
  }, [job.id, job.state]);

  useEffect(() => {
    if (!job.id || job.state !== "completed") return;
    setReportLoading(true);
    requestJson(`${apiBase}/jobs/${job.id}/report`)
      .then((payload) => {
        const reportPayload = (payload.report as { markdown?: string; json?: Record<string, unknown> }) || {};
        setReport({ markdown: reportPayload.markdown || "", json: reportPayload.json || null });
        setToast(t("reportReady", locale));
        trackUiEvent("report_ready", { jobId: job.id });
      })
      .catch((err) => setError(err.message))
      .finally(() => setReportLoading(false));
  }, [job.id, job.state, locale]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    setReport({ markdown: "", json: null });
    setEvents([]);
    try {
      const payload = await requestJson(`${apiBase}/jobs`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({
          repositoryInput: form.repositoryInput.trim(),
          analysisMode: form.analysisMode,
          model: form.model || undefined,
          maxFiles: Number(form.maxFiles || 0) || undefined,
          timeoutSeconds: Number(form.timeoutSeconds || 0) || undefined,
          skills: form.skills,
          skillsMax: Number(form.skillsMax || 0) || undefined,
          publishAsIssue: form.publishAsIssue,
          githubToken: form.githubToken.trim() || undefined,
        }),
      });
      const newId = String(payload.jobId ?? "");
      setJob({ id: newId, state: "running" });
      setToast(t("analysisStarted", locale));
      trackUiEvent("analysis_start", {
        repositoryInput: form.repositoryInput.trim(),
        analysisMode: form.analysisMode,
        model: form.model,
      });

      if (form.repositoryInput.trim()) {
        setRecentRepositories((current: string[]) => {
          const next = [form.repositoryInput.trim(), ...current.filter((item) => item !== form.repositoryInput.trim())].slice(
            0,
            RECENT_REPOS_LIMIT,
          );
          try {
            localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancelJob = async () => {
    if (!job.id) return;
    setBusy(true);
    setError("");
    try {
      await requestJson(`${apiBase}/jobs/${job.id}/cancel`, { method: "POST" });
      setJob((current: JobStateData) => ({ ...current, state: "cancelled" }));
      setToast(t("jobCancelled", locale));
      trackUiEvent("analysis_cancel", { jobId: job.id });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyCurrent = async () => {
    const content = activeTab === "json" ? JSON.stringify(report.json || {}, null, 2) : report.markdown || "";
    if (!content) return;
    await navigator.clipboard.writeText(content);
    if (activeTab === "json") {
      setToast(t("copiedJson", locale));
      trackUiEvent("copy_json");
      return;
    }

    setToast(t("copiedMarkdown", locale));
    trackUiEvent("copy_markdown");
  };

  const exportCurrent = async (format: ExportFormat) => {
    if (!job.id) return;
    try {
      const response = await fetch(`${apiBase}/jobs/${job.id}/export?format=${format}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { message?: string }).message || "Export failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const extension = format === "md" ? "md" : "json";
      anchor.href = url;
      anchor.download = `repocheck-report.${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      if (format === "md") {
        setToast(t("exportedMd", locale));
        trackUiEvent("export_md", { jobId: job.id });
      } else {
        setToast(t("exportedJson", locale));
        trackUiEvent("export_json", { jobId: job.id });
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const useSampleRepository = () => {
    setForm((current: FormState) => ({ ...current, repositoryInput: SAMPLE_REPO }));
    trackUiEvent("empty_state_cta", { target: "timeline" });
  };

  const clearRecentRepositories = () => {
    setRecentRepositories([]);
    try {
      localStorage.removeItem(RECENT_REPOS_KEY);
    } catch {}
  };

  const selectedModel = modelOptions.find((item) => item.id === form.model) || modelOptions[0] || null;
  const selectedModelName = selectedModel?.name || form.model;
  const selectedModelSummary = selectedModel ? [selectedModel.planSummary, selectedModel.note].filter(Boolean).join(" - ") : "";
  const selectedModelStatus = selectedModel?.isAuto
    ? "Auto"
    : selectedModel?.premium
      ? t("premiumModels", locale)
      : t("freeModels", locale);

  const canExport = Boolean(job.id) && job.state === "completed";

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <header className={`${cardClass} fade-in-up mb-5 overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl flex-1 min-w-[18rem]">
            <p className="mb-2 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cobalt">
              {t("tagline", locale)}
            </p>
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cobalt to-tide text-white shadow-sm">
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M6 5v9m0-5h8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="6" cy="5" r="1.8" fill="currentColor" />
                  <circle cx="6" cy="14" r="1.8" fill="currentColor" />
                  <circle cx="14" cy="9" r="1.8" fill="currentColor" />
                </svg>
                <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ember text-white ring-2 ring-white">
                  <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" aria-hidden="true">
                    <path d="m5.8 10 2.2 2.3 4.3-4.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t("title", locale)}</h1>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">{t("subtitle", locale)}</p>
            <SeverityLegend locale={locale} />
          </div>
          <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
            <StatePill state={job.state} />
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
              <label className="sr-only" htmlFor="locale-picker">
                {t("language", locale)}
              </label>
              <div className={`${selectShellClass} min-w-[8rem]`}>
                <select
                  id="locale-picker"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                  className={`${selectClass} ${focusRingClass}`}
                >
                  <option value="pt-BR">PT-BR</option>
                  <option value="en-US">EN-US</option>
                </select>
                <SelectChevron />
              </div>
              <button
                type="button"
                onClick={() => setEffectsEnabled((v) => !v)}
                className={`w-[8.25rem] justify-center rounded-full px-3 py-1 text-center text-xs font-mono transition ${focusRingClass} ${
                  effectsEnabled ? "bg-cyan-100 text-cyan-900 hover:bg-cyan-200" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {effectsEnabled ? t("effectsOn", locale) : t("effectsOff", locale)}
              </button>
              <span className="max-w-[13.5rem] truncate rounded-full bg-white/90 px-3 py-1 text-xs font-mono text-slate-600">API {apiBase}</span>
            </div>
          </div>
        </div>
      </header>

      <StepProgress state={job.state} locale={locale} />

      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile label={t("metricsProgress", locale)} value={`${progress}%`} />
        <MetricTile label={t("metricsEvents", locale)} value={String(events.length)} accent="from-emerald-500 to-cyan-600" />
        <MetricTile label={t("metricsModel", locale)} value={selectedModelName} accent="from-orange-500 to-amber-500" />
        <MetricTile
          label={t("metricsJobId", locale)}
          value={job.id ? `${job.id.slice(0, 8)}...` : t("jobNone", locale)}
          accent="from-slate-500 to-slate-700"
        />
      </section>

      <main className="grid gap-4 lg:grid-cols-12">
        <section className={`${cardClass} fade-in-up lg:col-span-4`} style={{ animationDelay: "80ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("launchpad", locale)}</h2>
            <ProgressRing value={progress} active={job.state === "running"} />
          </div>
          <form className="space-y-3" onSubmit={submit}>
            <label className="block">
              <span className="mb-1 block text-xs font-mono uppercase tracking-[0.16em] text-slate-500">{t("repository", locale)}</span>
              <input
                value={form.repositoryInput}
                onChange={(e) => setForm((current: FormState) => ({ ...current, repositoryInput: e.target.value }))}
                placeholder={t("repositoryPlaceholder", locale)}
                className={`w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 ${focusRingClass}`}
                required
              />
              <span className="mt-1 block text-xs text-slate-500">{t("repositoryHelp", locale)}</span>
            </label>

            {recentRepositories.length > 0 ? (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{t("recentRepositories", locale)}</span>
                  <button
                    type="button"
                    onClick={clearRecentRepositories}
                    className={`text-xs font-semibold text-slate-500 hover:text-slate-800 ${focusRingClass}`}
                  >
                    {t("clearRecent", locale)}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentRepositories.map((repo) => (
                    <button
                      key={repo}
                      type="button"
                      onClick={() => setForm((current: FormState) => ({ ...current, repositoryInput: repo }))}
                      className={`rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 ${focusRingClass}`}
                    >
                      {repo}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-mono uppercase tracking-[0.16em] text-slate-500">{t("mode", locale)}</span>
                <div className={selectShellClass}>
                  <select
                    value={form.analysisMode}
                    onChange={(e) =>
                      setForm((current: FormState) => {
                        const nextMode = e.target.value as FormState["analysisMode"];
                        const currentDefault = DEFAULT_TIMEOUT_SECONDS_BY_MODE[current.analysisMode];
                        const nextDefault = DEFAULT_TIMEOUT_SECONDS_BY_MODE[nextMode];
                        return {
                          ...current,
                          analysisMode: nextMode,
                          timeoutSeconds:
                            current.timeoutSeconds === currentDefault
                              ? nextDefault
                              : current.timeoutSeconds,
                        };
                      })
                    }
                    className={`${selectClass} ${focusRingClass}`}
                  >
                    <option value="quick">Quick</option>
                    <option value="deep">Deep</option>
                  </select>
                  <SelectChevron />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-mono uppercase tracking-[0.16em] text-slate-500">{t("model", locale)}</span>
                <div className={selectShellClass}>
                  <select
                    value={selectedModel?.id || form.model}
                    onChange={(e) => setForm((current: FormState) => ({ ...current, model: e.target.value }))}
                    className={`${selectClass} ${focusRingClass}`}
                  >
                    {freeModels.length > 0 ? (
                      <optgroup label={t("freeModels", locale)}>
                        {freeModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.isAuto ? `${model.name} (Auto)` : model.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                    {premiumModels.length > 0 ? (
                      <optgroup label={t("premiumModels", locale)}>
                        {premiumModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                  </select>
                  <SelectChevron />
                </div>
                <span className="mt-1 block text-xs text-slate-500">{t("modelHelp", locale)}</span>
                {selectedModel ? (
                  <span className="mt-1 block text-xs text-slate-600">
                    <span className="font-semibold">{selectedModelStatus}</span>
                    {selectedModelSummary ? ` - ${selectedModelSummary}` : ""}
                    {typeof selectedModel.requestMultiplier === "number"
                      ? ` - ${selectedModel.requestMultiplier}x`
                      : ""}
                  </span>
                ) : null}
                {modelsLoadState === "loading" ? (
                  <span className="mt-1 block text-xs text-slate-500">{t("modelLoading", locale)}</span>
                ) : null}
                {modelsLoadState === "error" ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-amber-700">
                    <span>{`${t("modelLoadError", locale)} ${t("modelFallbackNotice", locale)}`}</span>
                    {modelsLoadError ? <span className="text-slate-500">{modelsLoadError}</span> : null}
                    <button
                      type="button"
                      onClick={() => void loadModels()}
                      className={`rounded-full border border-amber-300 bg-amber-50 px-2 py-1 font-semibold text-amber-800 hover:bg-amber-100 ${focusRingClass}`}
                    >
                      {t("retryModels", locale)}
                    </button>
                  </div>
                ) : null}
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-mono uppercase tracking-[0.16em] text-slate-500">{t("maxFiles", locale)}</span>
                <input
                  type="number"
                  min="1"
                  value={form.maxFiles}
                  onChange={(e) => setForm((current: FormState) => ({ ...current, maxFiles: e.target.value }))}
                  className={`w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 ${focusRingClass}`}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-mono uppercase tracking-[0.16em] text-slate-500">{t("timeout", locale)}</span>
                <input
                  type="number"
                  min="1"
                  value={form.timeoutSeconds}
                  onChange={(e) => setForm((current: FormState) => ({ ...current, timeoutSeconds: e.target.value }))}
                  className={`w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 ${focusRingClass}`}
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-mono uppercase tracking-[0.16em] text-slate-500">Skills</span>
                <div className={selectShellClass}>
                  <select
                    value={form.skills}
                    onChange={(e) =>
                      setForm((current: FormState) => ({
                        ...current,
                        skills: e.target.value === "off" ? "off" : "on",
                      }))
                    }
                    className={`${selectClass} ${focusRingClass}`}
                  >
                    <option value="on">On</option>
                    <option value="off">Off</option>
                  </select>
                  <SelectChevron />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-mono uppercase tracking-[0.16em] text-slate-500">Skills Max</span>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={form.skillsMax}
                  onChange={(e) => setForm((current: FormState) => ({ ...current, skillsMax: e.target.value }))}
                  className={`w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 ${focusRingClass}`}
                />
              </label>
            </div>

            <label className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.publishAsIssue}
                onChange={(e) => setForm((current: FormState) => ({ ...current, publishAsIssue: e.target.checked }))}
                className={`mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40 ${focusRingClass}`}
              />
              <span>
                <span className="block font-semibold">{t("publishIssue", locale)}</span>
                <span className="block text-xs text-slate-500">{t("publishHelp", locale)}</span>
              </span>
            </label>

            {form.publishAsIssue ? (
              <label className="block">
                <span className="mb-1 block text-xs font-mono uppercase tracking-[0.16em] text-slate-500">{t("githubToken", locale)}</span>
                <input
                  type="password"
                  autoComplete="off"
                  value={form.githubToken}
                  onChange={(e) => setForm((current: FormState) => ({ ...current, githubToken: e.target.value }))}
                  placeholder={t("githubTokenPlaceholder", locale)}
                  className={`w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 ${focusRingClass}`}
                />
              </label>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p>{t("trustLocal", locale)}</p>
              <p className="mt-1">{t("trustNoStorage", locale)}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="submit" disabled={busy} className={`${buttonClassByVariant.primary} ${focusRingClass}`}>
                {busy ? t("running", locale) : t("runAnalysis", locale)}
              </button>
              <button
                type="button"
                onClick={cancelJob}
                disabled={!job.id || job.state !== "running"}
                className={`${buttonClassByVariant.warning} ${focusRingClass}`}
              >
                {t("cancel", locale)}
              </button>
            </div>
          </form>
        </section>

        <section className={`${cardClass} fade-in-up lg:col-span-3`} style={{ animationDelay: "150ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("timeline", locale)}</h2>
            <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-emerald-800">{t("statusStream", locale)}</span>
          </div>
          <div className="max-h-[30rem] space-y-2 overflow-auto pr-1">
            {events.length === 0 ? (
              <EmptyState
                title={t("timelineEmptyTitle", locale)}
                body={t("timelineEmptyBody", locale)}
                actionLabel={t("timelineEmptyAction", locale)}
                onAction={useSampleRepository}
              />
            ) : (
              events
                .slice()
                .sort((a, b) => a.sequence - b.sequence)
                .map((event, index) => (
                  <div
                    key={event.eventId || event.sequence}
                    className="relative rounded-2xl bg-white/90 p-3 shadow-sm transition hover:shadow-md"
                    style={{ animation: `fadeInUp 320ms ease ${Math.min(index, 8) * 40}ms both` }}
                  >
                    <div className="absolute left-3 top-4 h-2 w-2 rounded-full bg-gradient-to-r from-cobalt to-ember" />
                    <div className="ml-5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="font-mono text-[11px] text-slate-500">#{event.sequence}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{event.eventType}</span>
                      </div>
                      <p className="text-sm text-slate-700">{event.message || t("eventReceived", locale)}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

        <section className={`${cardClass} fade-in-up lg:col-span-5`} style={{ animationDelay: "220ms" }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{t("reportStudio", locale)}</h2>
              <p className="text-xs text-slate-500">{t("reportHint", locale)}</p>
            </div>
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Report format tabs">
              {(["markdown", "json"] as ReportTab[]).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${focusRingClass} ${
                    activeTab === tab ? "bg-white text-ink shadow-sm" : "text-slate-600 hover:text-ink"
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 h-[25rem] overflow-auto rounded-2xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-200" role="region" aria-live="polite">
            {reportLoading ? (
              <LoadingState label={t("loadingReport", locale)} />
            ) : activeTab === "json" ? (
              JSON.stringify(report.json || {}, null, 2) || t("reportEmptyJson", locale)
            ) : (
              report.markdown || t("reportEmptyMarkdown", locale)
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyCurrent}
              disabled={!report.markdown && !report.json}
              className={`${buttonClassByVariant.secondary} ${focusRingClass}`}
            >
              {t("copyCurrentTab", locale)}
            </button>
            <button onClick={() => exportCurrent("md")} disabled={!canExport} className={`${buttonClassByVariant.accent} ${focusRingClass}`}>
              {t("exportMd", locale)}
            </button>
            <button onClick={() => exportCurrent("json")} disabled={!canExport} className={`${buttonClassByVariant.primary} ${focusRingClass}`}>
              {t("exportJson", locale)}
            </button>
          </div>
        </section>
      </main>

      <Footer locale={locale} />

      {toast ? (
        <div className="fixed bottom-4 right-4 z-20 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-2xl" aria-live="polite">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="fixed bottom-4 left-4 z-20 max-w-md rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-xl" role="alert" aria-live="assertive">
          <p className="font-semibold">{t("requestError", locale)}</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}
      <div className="sr-only" aria-live="polite">{`${progress}%`}</div>
    </div>
  );
};

const root = createRoot(document.getElementById("app") as HTMLElement);
root.render(<App />);
