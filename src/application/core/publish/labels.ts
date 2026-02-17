import type { Category } from "../../../domain/types/schema.js";

const CATEGORY_LABEL_MAP: Record<Category, string> = {
  docs: "docs",
  dx: "dx",
  ci: "ci",
  tests: "tests",
  governance: "governance",
  security: "security",
};

export const LABEL_PREFIX = "repocheckai";

export function buildIssueLabels(categories: Category[] = []): string[] {
  const labels = new Set<string>();
  labels.add(LABEL_PREFIX);

  for (const category of categories) {
    const label = CATEGORY_LABEL_MAP[category];
    if (label) labels.add(`${LABEL_PREFIX}:${label}`);
  }

  return Array.from(labels);
}


