import type { AnalysisMode } from "../../../domain/shared/contracts.js";

export interface HomeFormValues {
  repositoryInput: string;
  analysisMode: AnalysisMode;
  model?: string;
  maxFiles?: number;
  timeoutSeconds?: number;
}

export function renderHomePage(): string {
  return `
    <section id="home-page">
      <h1>Repo Check AI Local UI</h1>
      <form id="start-analysis-form">
        <label>Repository</label>
        <input name="repositoryInput" placeholder="owner/repo" required />

        <label>Analysis mode</label>
        <select name="analysisMode">
          <option value="quick">Quick</option>
          <option value="deep">Deep</option>
        </select>

        <label>Max files</label>
        <input name="maxFiles" type="number" min="1" />

        <label>Model</label>
        <input name="model" placeholder="claude-sonnet-4" />

        <label>Timeout (seconds)</label>
        <input name="timeoutSeconds" type="number" min="1" />

        <button type="submit">Start analysis</button>
      </form>
    </section>
  `;
}

export function parseHomeFormSubmission(formData: Record<string, string>): HomeFormValues {
  return {
    repositoryInput: formData.repositoryInput?.trim() ?? "",
    analysisMode: formData.analysisMode === "deep" ? "deep" : "quick",
    model: formData.model?.trim() || undefined,
    maxFiles: formData.maxFiles ? Number(formData.maxFiles) : undefined,
    timeoutSeconds: formData.timeoutSeconds ? Number(formData.timeoutSeconds) : undefined,
  };
}

