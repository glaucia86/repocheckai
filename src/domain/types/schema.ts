/**
 * Type definitions for Repo Check AI
 * All shared types and schemas used across the application
 */

import { z } from "zod";

// ════════════════════════════════════════════════════════════════════════════
// PRIORITY ENUM
// ════════════════════════════════════════════════════════════════════════════

export type Priority = "P0" | "P1" | "P2";

export const PrioritySchema = z.enum(["P0", "P1", "P2"]);

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY ENUM
// ════════════════════════════════════════════════════════════════════════════

export type Category = "docs" | "dx" | "ci" | "tests" | "governance" | "security";

export const CategorySchema = z.enum([
  "docs",
  "dx",
  "ci",
  "tests",
  "governance",
  "security",
]);

// ════════════════════════════════════════════════════════════════════════════
// REPOSITORY METADATA
// ════════════════════════════════════════════════════════════════════════════

export interface RepositoryMeta {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  visibility: "public" | "private";
  size: number;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  openIssuesCount: number;
  topics: string[];
  languages: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  hasIssues: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  homepage: string | null;
  license: { key: string; name: string } | null;
}

export const RepositoryMetaSchema = z.object({
  owner: z.string(),
  name: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  defaultBranch: z.string(),
  visibility: z.enum(["public", "private"]),
  size: z.number(),
  archived: z.boolean(),
  disabled: z.boolean(),
  fork: z.boolean(),
  openIssuesCount: z.number(),
  topics: z.array(z.string()),
  languages: z.record(z.string(), z.number()),
  createdAt: z.string(),
  updatedAt: z.string(),
  pushedAt: z.string(),
  hasIssues: z.boolean(),
  hasWiki: z.boolean(),
  hasPages: z.boolean(),
  homepage: z.string().nullable(),
  license: z
    .object({
      key: z.string(),
      name: z.string(),
    })
    .nullable(),
});

// ════════════════════════════════════════════════════════════════════════════
// FILE TREE
// ════════════════════════════════════════════════════════════════════════════

export interface FileEntry {
  path: string;
  size: number | null;
  type: "file" | "directory" | "submodule" | "symlink";
}

export const FileEntrySchema = z.object({
  path: z.string(),
  size: z.number().nullable(),
  type: z.enum(["file", "directory", "submodule", "symlink"]).default("file"),
});

export interface FileTree {
  branch: string;
  totalUnfiltered: number;
  totalFiltered: number;
  returned: number;
  truncated: boolean;
  files: FileEntry[];
}

export const FileTreeSchema = z.object({
  branch: z.string(),
  totalUnfiltered: z.number(),
  totalFiltered: z.number(),
  returned: z.number(),
  truncated: z.boolean(),
  files: z.array(FileEntrySchema),
});

// ════════════════════════════════════════════════════════════════════════════
// FILE CONTENT
// ════════════════════════════════════════════════════════════════════════════

export interface FileContent {
  path: string;
  found: boolean;
  type: "file" | "directory" | "missing" | "error" | "submodule" | "symlink";
  size?: number;
  truncated?: boolean;
  truncatedAt?: number;
  content?: string;
  entries?: Array<{ name: string; path: string; type: string; size?: number }>;
  note?: string;
  error?: string;
}

export const FileContentSchema = z.object({
  path: z.string(),
  found: z.boolean(),
  type: z.enum(["file", "directory", "missing", "error", "submodule", "symlink"]),
  size: z.number().optional(),
  truncated: z.boolean().optional(),
  truncatedAt: z.number().optional(),
  content: z.string().optional(),
  entries: z
    .array(
      z.object({
        name: z.string(),
        path: z.string(),
        type: z.string(),
        size: z.number().optional(),
      })
    )
    .optional(),
  note: z.string().optional(),
  error: z.string().optional(),
});

// ════════════════════════════════════════════════════════════════════════════
// FINDINGS
// ════════════════════════════════════════════════════════════════════════════

export interface Finding {
  id: string;
  category: Category;
  priority: Priority;
  title: string;
  evidence: string;
  impact: string;
  action: string;
}

export const FindingSchema = z.object({
  id: z.string(),
  category: CategorySchema,
  priority: PrioritySchema,
  title: z.string(),
  evidence: z.string(),
  impact: z.string(),
  action: z.string(),
});

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY SCORE
// ════════════════════════════════════════════════════════════════════════════

export interface CategoryScore {
  category: Category;
  score: number;
  findingCount: number;
}

export const CategoryScoreSchema = z.object({
  category: CategorySchema,
  score: z.number().min(0).max(100),
  findingCount: z.number().min(0),
});

// ════════════════════════════════════════════════════════════════════════════
// ANALYSIS PHASE
// ════════════════════════════════════════════════════════════════════════════

export interface AnalysisPhase {
  id: string;
  name: string;
  status: "pending" | "running" | "done" | "error";
  details?: string;
  startedAt?: number;
  completedAt?: number;
}

export const AnalysisPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["pending", "running", "done", "error"]),
  details: z.string().optional(),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
});

// ════════════════════════════════════════════════════════════════════════════
// ANALYSIS RESULT
// ════════════════════════════════════════════════════════════════════════════

export interface AnalysisResult {
  repoMeta: RepositoryMeta;
  overallScore: number;
  categoryScores: CategoryScore[];
  findings: Finding[];
  nextSteps: string[];
  phases: AnalysisPhase[];
  durationMs: number;
  analyzedAt: string;
}

export const AnalysisResultSchema = z.object({
  repoMeta: RepositoryMetaSchema,
  overallScore: z.number().min(0).max(100),
  categoryScores: z.array(CategoryScoreSchema),
  findings: z.array(FindingSchema),
  nextSteps: z.array(z.string()),
  phases: z.array(AnalysisPhaseSchema),
  durationMs: z.number(),
  analyzedAt: z.string(),
});

// ════════════════════════════════════════════════════════════════════════════
// ANALYSIS OPTIONS
// ════════════════════════════════════════════════════════════════════════════

export interface AnalyzeOptions {
  repoUrl: string;
  token?: string;
  maxFiles?: number;
  maxBytes?: number;
  timeout?: number;
  verbosity?: "silent" | "normal" | "verbose";
  format?: "pretty" | "json" | "minimal";
  categories?: Category[];
}

export const AnalyzeOptionsSchema = z.object({
  repoUrl: z.string().min(1),
  token: z.string().optional(),
  maxFiles: z.number().min(10).max(10000).default(800),
  maxBytes: z.number().min(1024).max(1048576).default(204800),
  timeout: z.number().min(5000).max(600000).default(120000),
  verbosity: z.enum(["silent", "normal", "verbose"]).default("normal"),
  format: z.enum(["pretty", "json", "minimal"]).default("pretty"),
  categories: z.array(CategorySchema).optional(),
});

// ════════════════════════════════════════════════════════════════════════════
// PARSED REPOSITORY
// ════════════════════════════════════════════════════════════════════════════

export interface ParsedRepo {
  owner: string;
  repo: string;
  url: string;
}

export const ParsedRepoSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  url: z.string().url(),
});

// ════════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface AnalysisError {
  type: "not_found" | "access_denied" | "rate_limited" | "timeout" | "unknown";
  message: string;
  suggestion?: string;
  details?: unknown;
}

export const AnalysisErrorSchema = z.object({
  type: z.enum(["not_found", "access_denied", "rate_limited", "timeout", "unknown"]),
  message: z.string(),
  suggestion: z.string().optional(),
  details: z.unknown().optional(),
});

// ════════════════════════════════════════════════════════════════════════════
// SESSION STATE
// ════════════════════════════════════════════════════════════════════════════

export interface AnalysisState {
  status: "idle" | "running" | "completed" | "error";
  currentPhase?: string;
  progress: number;
  startedAt?: number;
  completedAt?: number;
  error?: AnalysisError;
}

export const AnalysisStateSchema = z.object({
  status: z.enum(["idle", "running", "completed", "error"]),
  currentPhase: z.string().optional(),
  progress: z.number().min(0).max(100),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
  error: AnalysisErrorSchema.optional(),
});

