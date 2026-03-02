export type SkillAnalysisMode = "quick" | "deep";

export type SkillCategory =
  | "governance"
  | "security"
  | "ci"
  | "quality"
  | "stack";

export interface AnalysisSkillMeta {
  name: string;
  title: string;
  description: string;
  category: SkillCategory;
  appliesTo: string[];
  modes: SkillAnalysisMode[];
  priority: number;
}

export interface AnalysisSkillDocument {
  meta: AnalysisSkillMeta;
  body: string;
  sourcePath: string;
}

export interface AnalysisSkillMatchContext {
  mode: SkillAnalysisMode;
  detectedStacks?: string[];
  repoType?: string;
  complexity?: string;
}

export interface AnalysisSkillMatch {
  skill: AnalysisSkillDocument;
  score: number;
  matchReason: string;
}

