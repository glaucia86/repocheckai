/**
 * Analysis engine for Repo Check AI
 * Coordinates the analysis workflow and produces structured results
 */

import type {
  AnalysisResult,
  CategoryScore,
  Finding,
  RepositoryMeta,
  AnalysisPhase,
  Category,
} from "../../domain/types/schema.js";

// ════════════════════════════════════════════════════════════════════════════
// PRIORITY WEIGHTS
// ════════════════════════════════════════════════════════════════════════════

const PRIORITY_WEIGHTS = {
  P0: 20,
  P1: 10,
  P2: 3,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY SCORING
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calculate overall health score from findings
 */
export function calculateHealthScore(findings: Finding[]): number {
  // Start with 100 and deduct for findings
  let score = 100;
  
  for (const finding of findings) {
    score -= PRIORITY_WEIGHTS[finding.priority];
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate category scores based on findings
 */
export function calculateCategoryScores(
  findings: Finding[],
  categories: Category[]
): CategoryScore[] {
  return categories.map((category) => {
    const categoryFindings = findings.filter((f) => f.category === category);
    
    // Start at 100, deduct for findings
    let score = 100;
    for (const finding of categoryFindings) {
      score -= PRIORITY_WEIGHTS[finding.priority];
    }

    return {
      category,
      score: Math.max(0, Math.min(100, score)),
      findingCount: categoryFindings.length,
    };
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ANALYSIS PHASES
// ════════════════════════════════════════════════════════════════════════════

export const DEFAULT_PHASES: AnalysisPhase[] = [
  { id: "meta", name: "Repository metadata", status: "pending" },
  { id: "tree", name: "File tree indexed", status: "pending" },
  { id: "files", name: "Target files selected", status: "pending" },
  { id: "read", name: "Reading files", status: "pending" },
  { id: "analyze", name: "Analyzing content", status: "pending" },
  { id: "report", name: "Generating report", status: "pending" },
];

// ════════════════════════════════════════════════════════════════════════════
// ANALYSIS RESULT BUILDER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Builder for analysis results
 */
export class AnalysisResultBuilder {
  private repoMeta: RepositoryMeta | null = null;
  private findings: Finding[] = [];
  private phases: AnalysisPhase[] = [...DEFAULT_PHASES];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Set repository metadata
   */
  setRepoMeta(meta: RepositoryMeta): this {
    this.repoMeta = meta;
    return this;
  }

  /**
   * Add a finding
   */
  addFinding(finding: Finding): this {
    this.findings.push(finding);
    return this;
  }

  /**
   * Add multiple findings
   */
  addFindings(findings: Finding[]): this {
    this.findings.push(...findings);
    return this;
  }

  /**
   * Update phase status
   */
  updatePhase(
    phaseId: string,
    status: AnalysisPhase["status"],
    details?: string
  ): this {
    const phase = this.phases.find((p) => p.id === phaseId);
    if (phase) {
      phase.status = status;
      if (details) phase.details = details;
    }
    return this;
  }

  /**
   * Build the final analysis result
   */
  build(): AnalysisResult {
    const categories: Category[] = ["docs", "dx", "ci", "tests", "governance", "security"];
    const categoryScores = calculateCategoryScores(this.findings, categories);
    const overallScore = calculateHealthScore(this.findings);

    // Sort findings by priority
    const sortedFindings = [...this.findings].sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Generate next steps based on findings
    const nextSteps = this.generateNextSteps(sortedFindings);

    return {
      repoMeta: this.repoMeta!,
      overallScore,
      categoryScores,
      findings: sortedFindings,
      nextSteps,
      phases: this.phases,
      durationMs: Date.now() - this.startTime,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate next steps from findings
   */
  private generateNextSteps(findings: Finding[]): string[] {
    const steps: string[] = [];

    // P0 findings first
    const p0Findings = findings.filter((f) => f.priority === "P0");
    if (p0Findings.length > 0) {
      steps.push(
        `Address ${p0Findings.length} critical issue${p0Findings.length > 1 ? "s" : ""} first`
      );
    }

    // P1 findings
    const p1Findings = findings.filter((f) => f.priority === "P1");
    if (p1Findings.length > 0) {
      const topP1 = p1Findings.slice(0, 2);
      for (const finding of topP1) {
        const firstSentence = finding.action.split(".")[0];
        if (firstSentence) {
          steps.push(firstSentence);
        }
      }
    }

    // General suggestion
    if (findings.length === 0) {
      steps.push("Repository is in great shape! Consider the P2 suggestions for polishing.");
    } else {
      steps.push("Consider the P2 suggestions for additional improvements");
    }

    return steps.slice(0, 4); // Max 4 steps
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ANALYSIS CATEGORIES
// ════════════════════════════════════════════════════════════════════════════

export const ANALYSIS_CATEGORIES = {
  docs: {
    name: "Docs & Onboarding",
    icon: "📚",
    files: [
      "README.md",
      "readme.md",
      "README",
      "docs/README.md",
      "CONTRIBUTING.md",
      "contributing.md",
      ".github/CONTRIBUTING.md",
      "docs/CONTRIBUTING.md",
      "CHANGELOG.md",
      "changelog.md",
      "HISTORY.md",
    ],
    checks: [
      { id: "readme-exists", description: "README.md exists" },
      { id: "readme-quality", description: "README has installation/usage" },
      { id: "contributing-exists", description: "CONTRIBUTING.md exists" },
      { id: "changelog-exists", description: "CHANGELOG.md exists" },
    ],
  },
  dx: {
    name: "Developer Experience",
    icon: "⚡",
    files: [
      "package.json",
      ".nvmrc",
      ".node-version",
      ".tool-versions",
      ".editorconfig",
      ".prettierrc",
      ".prettierrc.json",
      ".prettierrc.js",
      "prettier.config.js",
      ".eslintrc",
      ".eslintrc.json",
      ".eslintrc.js",
      "eslint.config.js",
      "turbo.json",
      "nx.json",
      "lerna.json",
      "pnpm-workspace.yaml",
    ],
    checks: [
      { id: "npm-scripts", description: "Has npm scripts" },
      { id: "node-version", description: "Specifies Node version" },
      { id: "linting", description: "Has linting config" },
      { id: "formatting", description: "Has formatting config" },
    ],
  },
  ci: {
    name: "CI/CD",
    icon: "🔄",
    files: [
      ".github/workflows/ci.yml",
      ".github/workflows/ci.yaml",
      ".github/workflows/test.yml",
      ".github/workflows/tests.yml",
      ".github/workflows/build.yml",
      ".github/workflows/main.yml",
      ".github/workflows/push.yml",
      ".circleci/config.yml",
      ".travis.yml",
      "Jenkinsfile",
      "azure-pipelines.yml",
      ".gitlab-ci.yml",
    ],
    checks: [
      { id: "ci-exists", description: "CI workflow exists" },
      { id: "ci-tests", description: "CI runs tests" },
      { id: "ci-lint", description: "CI runs linting" },
      { id: "ci-typecheck", description: "CI runs type checking" },
    ],
  },
  tests: {
    name: "Quality & Tests",
    icon: "🧪",
    files: [
      "jest.config.js",
      "jest.config.ts",
      "jest.config.json",
      "vitest.config.ts",
      "vitest.config.js",
      "mocha.opts",
      ".mocharc.js",
      ".mocharc.json",
      "karma.conf.js",
      "cypress.json",
      "cypress.config.js",
      "cypress.config.ts",
      "playwright.config.ts",
      "playwright.config.js",
      ".nycrc",
      ".nycrc.json",
      "tsconfig.json",
    ],
    checks: [
      { id: "test-framework", description: "Has test framework config" },
      { id: "test-script", description: "Has test npm script" },
      { id: "typescript", description: "Uses TypeScript" },
      { id: "coverage", description: "Has coverage config" },
    ],
  },
  governance: {
    name: "Governance",
    icon: "📋",
    files: [
      "LICENSE",
      "LICENSE.md",
      "LICENSE.txt",
      "license",
      "LICENCE",
      "CODE_OF_CONDUCT.md",
      "code_of_conduct.md",
      ".github/CODE_OF_CONDUCT.md",
      "CODEOWNERS",
      ".github/CODEOWNERS",
      ".github/PULL_REQUEST_TEMPLATE.md",
      ".github/PULL_REQUEST_TEMPLATE/",
      ".github/ISSUE_TEMPLATE.md",
      ".github/ISSUE_TEMPLATE/",
    ],
    checks: [
      { id: "license-exists", description: "LICENSE file exists" },
      { id: "coc-exists", description: "CODE_OF_CONDUCT exists" },
      { id: "codeowners", description: "CODEOWNERS exists" },
      { id: "pr-template", description: "PR template exists" },
      { id: "issue-template", description: "Issue template exists" },
    ],
  },
  security: {
    name: "Security",
    icon: "🔐",
    files: [
      "SECURITY.md",
      "security.md",
      ".github/SECURITY.md",
      ".github/dependabot.yml",
      ".github/dependabot.yaml",
      "renovate.json",
      "renovate.json5",
      ".renovaterc",
      ".renovaterc.json",
    ],
    checks: [
      { id: "security-policy", description: "SECURITY.md exists" },
      { id: "dependabot", description: "Dependabot configured" },
      { id: "renovate", description: "Renovate configured" },
    ],
  },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get list of target files to read for analysis
 */
export function getTargetFiles(): string[] {
  const files = new Set<string>();

  for (const category of Object.values(ANALYSIS_CATEGORIES)) {
    for (const file of category.files) {
      files.add(file);
    }
  }

  return Array.from(files);
}

/**
 * Check if a path matches any of the target files
 */
export function isTargetFile(path: string, targetFiles: string[]): boolean {
  const lowerPath = path.toLowerCase();
  return targetFiles.some((target) => {
    const lowerTarget = target.toLowerCase();
    return lowerPath === lowerTarget || lowerPath.endsWith("/" + lowerTarget);
  });
}

/**
 * Parse priority from string
 */
export function parsePriority(priority: string): "P0" | "P1" | "P2" {
  if (priority.toUpperCase() === "P0") return "P0";
  if (priority.toUpperCase() === "P1") return "P1";
  return "P2";
}


