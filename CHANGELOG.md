# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [2.7.1] - 2026-03-04

### Changed

- **Copilot Session Permissions**: Updated session initialization in `src/application/core/agent.ts` to include `onPermissionRequest` using the SDK typed permission handler.
- **Lint Tooling Dependency**: Added `@eslint/js` as a development dependency with ESLint 9-compatible versioning.

### Fixed

- **TypeScript Build Error (TS2345)**: Resolved missing `onPermissionRequest` in `client.createSession(...)` options.
- **CI Lint Failure**: Fixed `ERR_MODULE_NOT_FOUND` for `@eslint/js` in `eslint.config.js`.

---

## [2.7.0] - 2026-03-02

### Added

- **Analysis Skills Runtime**: Added bundled analysis skills in `src/application/core/skills/bundled/*.SKILL.md` for CI quality, governance baselines, Python/Rust/Go stack checks, and security-focused assessments.
- **New Agent Tools**: Added `list_analysis_skills` and `read_analysis_skill` tools to expose stack-aware analysis guidance at runtime.
- **Skills Engine Modules**: Added skill frontmatter parsing, loader, matcher, and typed contracts in `src/application/core/skills/*` and `src/domain/types/analysisSkill.ts`.
- **Path Filtering Rules**: Added shared repository path filtering in `src/domain/config/repoPathFilters.ts` to reduce analysis noise from generated/artifact files.
- **Test Coverage for Skills**: Added unit and tool tests for skill parsing, matching, and tool behavior (`tests/core/skills/*`, `tests/tools/analysisSkillsTools.test.ts`).

### Changed

- **Prompt Enrichment**: Agent now injects skills catalog and preselected skill guidance into system prompts based on detected stacks and analysis mode.
- **Stack-Aware Selection**: Skill preselection now prioritizes security baseline + CI + stack-specific skills with bounded `skillsMax` selection.
- **CLI/API/Web Integration**: Expanded skills-runtime support across CLI and Web UI flows, including `--skills` and `--skills-max` controls.
- **Documentation**: Updated architecture, command, and tooling docs to reflect runtime skill orchestration and new analysis tools.
- **Web Experience**: Refined public site pages and styling with improved responsiveness and animation assets.

### Fixed

- **Skill Tool Error Handling**: `read_analysis_skill` now returns structured validation responses for invalid names and unknown skill slugs.
- **Evidence Quality**: Improved repository file listing relevance by excluding lock/noise paths, reducing false-positive path references in analysis outputs.

---

## [2.6.0] - 2026-02-17

### Added

- **Migration Communication**: Added official announcement at `docs/announcements/repocheckai-migration.md`.

### Changed

- **Project Identity Migration**: Official project identity is now `RepoCheckAI`.
- **CLI Command Policy**: `repocheck` is now the official command, while `repodoctor` remains temporarily available with deprecation warning.
- **Legacy Alias Coverage**: Preserved `repo-doctor` binary alias during transition, aligned with legacy-command warning policy.
- **Transition Window**: Legacy command support is scheduled for two releases (`2.5.0` through `2.6.x`).

### Fixed

- **ESM React Typings (Web Public UI)**: Updated URL-module declarations to support named hook imports (`useEffect`, `useMemo`, `useRef`, `useState`) without `require`-style declarations.
- **Type Declarations**: Removed redundant ambient `declare` modifier in ESM URL declaration file.
- **Report Consistency Rules**: Tightened CI workflow detection heuristic to avoid downgrading genuine "No CI/CD Pipeline" findings when `ci.yml`/`pages.yml` are only mentioned as recommendations.

---

## [2.5.0] - 2026-02-14

### Added

- **Web UI Foundation**: Added local web UI flow and server-side event streaming support for interactive updates
- **Analytics**: Added analytics tracking and shared HTTP request utilities

### Changed

- **CI Workflow**: Enhanced CI workflow sequencing and build artifact verification order
- **Routing Cleanup**: Improved route cleanup behavior in the local web UI integration
- **Project Structure**: Updated codebase import paths after application, presentation, and infrastructure directory restructuring

### Fixed

- **Tests**: Fixed test imports and jobId handling to match the new module layout and avoid integration edge case failures
- **Changelog Docs**: Updated changelog comparison references for prior release links

---

## [2.4.0] - 2026-02-13

### Added

- **Skills System**: Added skills for CI workflow audit, code quality audit, dependency health, documentation audit, findings to GitHub issues, repo health, security hygiene, Copilot SDK, and testing posture
- **Performance Monitoring**: Added basic performance monitoring capabilities
- **Test Coverage**: Expanded test coverage and added security scanning
- **CI Improvements**: Added test coverage reporting to CI workflow
- **Documentation**: Improved README with examples section and added GPT-5.3-Codex model to documentation

### Changed

- **Package Manager**: Updated package manager references from pnpm to npm
- **CI Configuration**: Updated CI configuration to use Node.js 24 and pnpm for dependency management
- **CLI Options**: Updated CLI options handling and validation, consolidated model selection prompts
- **Documentation**: Updated README and GUIDE with advanced usage examples and CI/CD integration details
- **Node.js Matrix**: Updated Node.js version matrix to 20 and adjusted coverage upload condition
- **Testing**: Expanded testing posture and updated Node.js matrix to 24+ for engine compatibility
- **Dependencies**: Updated various dependencies including @typescript-eslint, ora, @inquirer/prompts, @github/copilot-sdk, @types/node
- **Engine Requirement**: Updated Node.js engine requirement to >=24.0.0
- **Workflow Permissions**: Updated CI workflow permissions and fixed action versions
- **Error Handling**: Improved error handling in event handler and command parsing
- **Clipboard Command**: Streamlined clipboard command handling for Linux with fallback support

### Fixed

- **Type Casting**: Added type casting for importOriginal in performance tests
- **Imports**: Added missing vi import in performance tests
- **Mock**: Corrected CopilotClient mock in performance tests
- **Type Assertion**: Added type assertion for imported CopilotClient
- **Documentation**: Removed CLAUDE.md documentation file and balanced AGENTS.md size for Copilot context
- **ESLint**: Updated eslint to version 9.0.0
- **Copilot Ignore**: Added .copilotignore file to exclude specific directories and files

---

## [2.1.2] - 2026-02-13

### Added

- **CLI**: Support for `/model` command in onboarding phase ([#123](https://github.com/glaucia86/repocheckai/pull/123))

### Fixed

- **CLI**: Fixed `/model` command requiring double input in onboarding phase ([#124](https://github.com/glaucia86/repocheckai/pull/124))

---

## 🗺️ Roadmap

### v2.2.0 (Planned)
- 🔍 **Dependency Audit Integration** — `npm audit`, `pip-audit`, `cargo audit`
- 🔑 **Secrets Scanning** — Detect exposed API keys, tokens via regex patterns

### v3.0.0 (Future)
- 🛡️ **Gitleaks Integration** — Advanced secrets detection
- 📦 **SBOM Generation** — Software Bill of Materials with Syft/CycloneDX
- 🔗 **Snyk/Trivy Integration** — Optional vulnerability scanning
- 🔬 **CodeQL Support** — Static analysis integration

### v4.0.0 (Vision)
- 🌐 **Web UI** — Browser-based interface for non-CLI users
- 📊 **Dashboard** — Visual health reports with charts and trends
- 🔄 **Scheduled Scans** — Automated periodic repository health checks
- 📈 **Historical Tracking** — Track repository health over time
- 🏢 **Organization View** — Analyze multiple repositories at once

---

## [2.3.0] - 2026-02-04

### Breaking Changes

- **Infinite Sessions API**: Updated to Copilot SDK v0.1.18. Custom integrations using session management may need to handle new compaction events ([#104](https://github.com/glaucia86/repocheckai/pull/104))
- **Theme System**: Modular theme system introduced. Custom themes may need to be updated to use new module structure ([#105](https://github.com/glaucia86/repocheckai/pull/105))

### Changed

- **Issue Publishing**: Improved priority label handling in `publishReport.ts` (removed unnecessary `.toLowerCase()`) ([#106](https://github.com/glaucia86/repocheckai/pull/106))
- **Documentation**: Enhanced `--issue` feature documentation with setup instructions and 401 troubleshooting ([#107](https://github.com/glaucia86/repocheckai/pull/107))
- **Documentation**: Updated AI model recommendations, highlighting Claude Sonnet 4.5 for best report quality with `--issue` ([#108](https://github.com/glaucia86/repocheckai/pull/108))
- **Documentation**: Improved token handling instructions for security best practices ([#109](https://github.com/glaucia86/repocheckai/pull/109))
- **Documentation**: Updated interactive mode instructions for secure token handling ([#110](https://github.com/glaucia86/repocheckai/pull/110))

### Fixed

- **Priority Labels**: Ensured consistent case handling for issue priority labels ([#111](https://github.com/glaucia86/repocheckai/pull/111))

---

### Added

- **Infinite Sessions Support** (Copilot SDK v0.1.18)
  - Automatic context compaction for long-running analyses
  - Background compaction triggers at 80% buffer usage
  - Buffer exhaustion threshold at 95% for blocking protection
  - New events: `session.compaction_start`, `session.compaction_complete`
  - Verbose mode shows compaction progress and tokens freed

- **Modular Theme System** (`src/ui/themes/`)
  - `colors.ts`: COLORS palette & chalk helpers
  - `icons.ts`: ICON, category/priority mappings
  - `box.ts`: Box drawing utilities
  - `badges.ts`: Progress bars, health scores
  - `logo.ts`: Logo renderers
  - Reduced `src/ui/themes.ts` from monolithic to re-exports

- **Modular Repomix Integration** (`src/core/repoPacker/`)
  - `packer.ts`: Main `packRemoteRepository` function
  - `executor.ts`: Repomix process execution
  - `errors.ts`: Error categorization & sanitization
  - `patterns.ts`: Include/exclude patterns (governance vs deep)
  - `cleaner.ts`: Temp directory cleanup
  - `availability.ts`: npx/repomix availability check
  - `types.ts`: PackOptions, PackResult, PackErrorReason

- **Modular Prompt System** (`src/core/agent/prompts/`)
  - Base modules: securityDirective, expertiseProfile, reconnaissance, languageDetection, strategicReading, analysisCriteria, scoring, evidenceRules, outputFormat, constraints, errorHandling
  - Mode-specific extensions: `modes/quick.ts`, `modes/deep.ts`
  - Prompt composition: `composers/systemPromptComposer.ts`
  - Follows Open/Closed Principle (OCP) for easy extension

- **Integration Tests**: `tests/tools/repoPacker.integration.test.ts`
- **Unit Tests**: `tests/tools/repoPacker.test.ts` (598 lines)

### Changed

- **Copilot SDK**: Upgraded from v0.1.15 to v0.1.18
- **Guardrails**: Increased limits for more reliable agent execution
  - `maxToolCalls`: 30 → 50 (standard), 40 → 80 (deep)
  - `maxConsecutiveRepeats`: 3 → 5
  - `minSequenceLength`: 2 → 3 (reduces false positives)
  - `timeWindowMs`: 60s → 120s
  - Fixed sequence matching to compare tool name AND args hash
- **Architecture**: Major refactoring following SOLID principles
  - `src/ui/themes.ts`: Monolithic → modular re-exports
  - `src/core/repoPacker.ts`: Monolithic → modular re-exports
  - `src/core/agent/prompts/systemPrompt.ts`: Simplified to legacy exports

### Fixed

- **Repomix Integration**: Windows/Node.js v25+ shell compatibility
- **Regex Patterns**: Escaped square brackets in character classes
- **Unused Variables**: Removed stdout collection in repoPacker.ts

---

## [2.1.0] - 2026-01-23

### Breaking Changes

- **Internal Architecture**: Major refactoring following SOLID principles. Contributors extending the codebase may need to update imports and class structures ([#95](https://github.com/glaucia86/repocheckai/pull/95))
- **CLI Module Structure**: Extracted CLI components into separate modules. Custom CLI integrations may require import path updates ([#96](https://github.com/glaucia86/repocheckai/pull/96))

### Added

- **Agent Guardrails**: Loop prevention with `ToolCallTracker` and `AgentGuardrails` ([#97](https://github.com/glaucia86/repocheckai/pull/97))
  - Step limit enforcement (30 standard / 40 deep)
  - Consecutive identical call detection
  - Sequence loop detection (A→B→A→B patterns)
  - Progressive response: warn → inject replan message → abort
- **Testing Infrastructure**: 86 unit tests across 7 test files ([#98](https://github.com/glaucia86/repocheckai/pull/98))
  - `tests/cli/parsers/repoParser.test.ts` (12 tests)
  - `tests/cli/parsers/reportExtractor.test.ts` (9 tests)
  - `tests/cli/state/appState.test.ts` (16 tests)
  - `tests/core/agent/analysisPrompt.test.ts` (8 tests)
  - `tests/core/agent/eventHandler.test.ts` (17 tests)
  - `tests/core/agent/toolCallTracker.test.ts` (13 tests)
  - `tests/core/agent/guardrails.test.ts` (11 tests)
- **Vitest Configuration**: `vitest.config.ts` with proper TypeScript support ([#99](https://github.com/glaucia86/repocheckai/pull/99))
- **Deep Analysis Improvements**: Enhanced PHASE 6 instructions with comprehensive checklist ([#100](https://github.com/glaucia86/repocheckai/pull/100))

### Changed

- **Major Refactoring (SOLID Principles)**: ([#101](https://github.com/glaucia86/repocheckai/pull/101))
  - `src/cli.ts`: 1165 → 186 lines (-84%)
  - Extracted `src/cli/chatLoop.ts` — Interactive REPL
  - Extracted `src/cli/handlers/` — One file per command (SRP)
  - Extracted `src/cli/parsers/` — URL parsing, report extraction
  - Extracted `src/cli/state/appState.ts` — Centralized state management
  - Extracted `src/core/agent/prompts/` — Isolated system and analysis prompts (OCP)
  - Extracted `src/tools/` — Individual tool files (DIP)
  - Extracted `src/ui/display/` — Modular UI components
- **Interfaces**: Added `src/types/interfaces.ts` with shared interfaces (ISP) ([#102](https://github.com/glaucia86/repocheckai/pull/102))

### Fixed

- `/copy` command now captures full report (not just Deep Analysis section) ([#103](https://github.com/glaucia86/repocheckai/pull/103))

---

## [2.0.0] - 2026-01-23

### Breaking Changes

- **CLI Interface**: Removed legacy command-line arguments in favor of interactive chat mode. Use `repocheck analyze <repo>` instead of direct CLI arguments ([#89](https://github.com/glaucia86/repocheckai/pull/89))
- **Configuration**: Environment variable names changed for better consistency (`GITHUB_TOKEN` now preferred over `GH_TOKEN` for API access) ([#90](https://github.com/glaucia86/repocheckai/pull/90))

### Added

- **Deep Analysis Mode**: New `/deep` command with Repomix integration for comprehensive source code analysis ([#85](https://github.com/glaucia86/repocheckai/pull/85))
- **Security**: Content sanitization utilities to prevent prompt injection attacks ([#87](https://github.com/glaucia86/repocheckai/pull/87))
- **Documentation**: Comprehensive Copilot instructions (`.github/copilot-instructions.md`) ([#88](https://github.com/glaucia86/repocheckai/pull/88))
- **Documentation**: AGENTS.md with improved clarity and detail for agent configuration ([#86](https://github.com/glaucia86/repocheckai/pull/86))

### Changed

- Enhanced README with improved structure, clarity, and visual formatting ([#91](https://github.com/glaucia86/repocheckai/pull/91))
- Updated demo image for better visual representation ([#92](https://github.com/glaucia86/repocheckai/pull/92))
- Reorganized README structure for better project description ([#93](https://github.com/glaucia86/repocheckai/pull/93))

### Fixed

- License section header for improved clarity ([#94](https://github.com/glaucia86/repocheckai/pull/94))

## [1.0.0] - 2026-01-22

### Added

- Initial release of RepoCheckAI
- **Core Features**:
  - CLI with interactive chat mode using Commander.js
  - GitHub repository analysis via Octokit REST API
  - Integration with GitHub Copilot SDK
- **Analysis Tools**:
  - `get_repo_meta`: Fetch repository metadata
  - `list_repo_files`: List repository file structure
  - `read_repo_file`: Read individual file contents
- **AI Integration**:
  - Claude Sonnet 4.5 as default AI model
  - Verbose logging for tool events
  - Streaming responses with real-time output
- **UI Components**:
  - Display module with themed output
  - Interactive prompts using Inquirer.js
  - Terminal themes with Chalk styling
  - Loading spinners with Ora
- **Documentation**:
  - AGENTS.md with agent configuration and custom tools documentation
  - Comprehensive README with usage instructions
- **Developer Experience**:
  - EditorConfig for consistent code formatting
  - TypeScript configuration with ES2022 target
  - Zod schemas for type validation

### Technical

- GitHub provider with Octokit factory and token resolution
- Markdown reporter for analysis output
- Type definitions with Zod schemas

---

[2.4.0]: https://github.com/glaucia86/repocheckai/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/glaucia86/repocheckai/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/glaucia86/repocheckai/compare/v2.1.0...v2.2.0
[2.1.2]: https://github.com/glaucia86/repocheckai/compare/v2.1.1...v2.1.2
[2.1.0]: https://github.com/glaucia86/repocheckai/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/glaucia86/repocheckai/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/glaucia86/repocheckai/releases/tag/v1.0.0
[2.5.0]: https://github.com/glaucia86/repocheckai/compare/v2.4.0...v2.5.0
[2.6.0]: https://github.com/glaucia86/repocheckai/compare/v2.5.0...v2.6.0
[2.7.0]: https://github.com/glaucia86/repocheckai/compare/v2.6.0...v2.7.0
[2.7.1]: https://github.com/glaucia86/repocheckai/compare/v2.7.0...v2.7.1
[Unreleased]: https://github.com/glaucia86/repocheckai/compare/v2.7.1...HEAD


