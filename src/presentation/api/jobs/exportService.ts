import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { AnalysisReport } from "../../../domain/shared/contracts.js";

export interface BuiltExportArtifact {
  fileName: string;
  contentType: string;
  content: Buffer;
  filePath: string;
}

export function buildExportArtifact(
  report: AnalysisReport,
  format: "md" | "json"
): BuiltExportArtifact {
  const dir = mkdtempSync(join(tmpdir(), "repocheckai-export-"));
  const extension = format === "md" ? "md" : "json";
  const fileName = `repocheckai-${report.jobId}.${extension}`;
  const filePath = join(dir, fileName);

  const content =
    format === "md"
      ? Buffer.from(report.markdownContent, "utf8")
      : Buffer.from(JSON.stringify(report.jsonContent, null, 2), "utf8");

  writeFileSync(filePath, content);

  return {
    fileName,
    contentType: format === "md" ? "text/markdown; charset=utf-8" : "application/json; charset=utf-8",
    content,
    filePath,
  };
}

