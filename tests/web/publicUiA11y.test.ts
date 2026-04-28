import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import axe from "axe-core";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const read = (path: string): string => readFileSync(resolve(process.cwd(), path), "utf8");

const runAxe = async (html: string) => {
  const dom = new JSDOM(html, { runScripts: "outside-only" });
  dom.window.eval(axe.source);
  const results = await (dom.window as unknown as { axe: { run: (node: Document) => Promise<{ violations: unknown[] }> } }).axe.run(
    dom.window.document,
  );
  return results;
};

describe("public web ui accessibility", () => {
  it("keeps an inline model select in the main form", () => {
    const source = read("src/presentation/web/public/app.tsx");
    expect(source).toContain('value={selectedModel?.id || form.model}');
    expect(source).toContain("<optgroup label={t(\"freeModels\", locale)}>");
    expect(source).toContain("<optgroup label={t(\"premiumModels\", locale)}>");
  });

  it("keeps required modal accessibility attributes in ModelPicker", () => {
    const source = read("src/presentation/web/public/components/ModelPicker.tsx");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('aria-labelledby="model-picker-title"');
  });

  it("keeps live region semantics for toast/error/progress feedback", () => {
    const source = read("src/presentation/web/public/app.tsx");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-live="assertive"');
    expect(source).toContain('role="alert"');
  });

  it("passes axe check for representative model dialog markup", async () => {
    const html = `
      <!doctype html>
      <html lang="en">
        <head>
          <title>Model picker test</title>
        </head>
        <body>
          <main>
            <div role="dialog" aria-modal="true" aria-labelledby="model-picker-title">
              <h3 id="model-picker-title">Select model</h3>
              <label for="model-search">Search</label>
              <input id="model-search" />
              <button type="button">Select</button>
              <button type="button">Close</button>
            </div>
          </main>
        </body>
      </html>
    `;
    const results = await runAxe(html);
    expect(results.violations).toHaveLength(0);
  });

  it("passes axe check for representative live-region feedback markup", async () => {
    const html = `
      <!doctype html>
      <html lang="en">
        <head>
          <title>Live regions test</title>
        </head>
        <body>
          <main>
            <div aria-live="polite">Report is ready.</div>
            <div role="alert" aria-live="assertive">Request error.</div>
            <div aria-live="polite">32%</div>
          </main>
        </body>
      </html>
    `;
    const results = await runAxe(html);
    expect(results.violations).toHaveLength(0);
  });

  it("passes axe check for representative inline model selector markup", async () => {
    const html = `
      <!doctype html>
      <html lang="en">
        <head>
          <title>Inline model select test</title>
        </head>
        <body>
          <main>
            <label for="model-select">Model</label>
            <select id="model-select">
              <optgroup label="Free">
                <option>Copilot Auto</option>
                <option>GPT-4o</option>
              </optgroup>
              <optgroup label="Premium">
                <option>Claude Sonnet 4</option>
                <option>GPT-5.5</option>
              </optgroup>
            </select>
            <p>Choose a model directly from the list.</p>
          </main>
        </body>
      </html>
    `;
    const results = await runAxe(html);
    expect(results.violations).toHaveLength(0);
  });
});
