# 📊 Analysis Categories

Repo Check AI evaluates repositories across six critical categories. This document details what gets analyzed in each category and how findings are classified.

---

## Table of Contents

- [Overview](#overview)
- [Category Weights](#category-weights)
- [Analysis Skills Overlay](#analysis-skills-overlay)
- [📚 Docs & Onboarding](#-docs--onboarding)
- [⚡ Developer Experience](#-developer-experience)
- [🔄 CI/CD](#-cicd)
- [🧪 Quality & Tests](#-quality--tests)
- [📋 Governance](#-governance)
- [🔐 Security](#-security)
- [Priority Levels](#priority-levels)
- [Scoring Algorithm](#scoring-algorithm)

---

## Overview

Each repository is analyzed across **6 categories** with specific checks for files, configurations, and best practices.

| Category | Focus Area | Weight |
|----------|------------|--------|
| 📚 Docs & Onboarding | Documentation quality | 20% |
| ⚡ Developer Experience | Build & development setup | 20% |
| 🔄 CI/CD | Automation pipelines | 20% |
| 🧪 Quality & Tests | Testing & code quality | 15% |
| 📋 Governance | Project policies | 15% |
| 🔐 Security | Security practices | 10% |

---

## Category Weights

The overall health score is calculated using weighted averages:

```
Health Score = (Docs × 0.20) + (DX × 0.20) + (CI/CD × 0.20) 
             + (Tests × 0.15) + (Governance × 0.15) + (Security × 0.10)
```

Each category starts at 100% and deductions are made for missing elements:
- **P0 finding:** −30 points
- **P1 finding:** −15 points
- **P2 finding:** −5 points

---

## Analysis Skills Overlay

Beyond static checks, Repo Check AI uses bundled runtime skills (`*.SKILL.md`) to adapt analysis depth by stack and mode.

| Runtime Skill Group | Typical Skills | Category Impact |
|---------------------|----------------|-----------------|
| Security baseline | `security-baseline`, `security-supply-chain`, `insecure-defaults` | 🔐 Security, 📋 Governance |
| CI reliability | `ci-quality` | 🔄 CI/CD, 🧪 Quality & Tests |
| Governance controls | `github-expert`, `node-governance`, `polyglot-governance` | 📋 Governance, 📚 Docs & Onboarding |
| Stack-specific quality | `python-quality`, `rust-safety`, `go-reliability` | 🧪 Quality & Tests, ⚡ Developer Experience |
| Security expansion (deep mode) | `variant-analysis`, `sharp-edges`, `semgrep-guidance` | 🔐 Security |

How runtime skills are applied:
- Quick mode prioritizes baseline coverage and high-signal checks.
- Deep mode can add code-path-oriented security and variant analysis skills.
- Stack matching (`node`, `python`, `go`, `rust`, etc.) boosts skill relevance.
- `--skills-max` limits how many skills are preselected before main evidence extraction.

---

## 📚 Docs & Onboarding

**Purpose:** Ensure new contributors can understand and start working with the project quickly.

### What's Checked

| Check | Files Analyzed | Priority if Missing |
|-------|----------------|---------------------|
| README exists | `README.md`, `readme.md` | P0 |
| README has description | README content | P1 |
| Installation instructions | README sections | P1 |
| Usage examples | README sections | P2 |
| API documentation | `/docs`, README | P2 |
| Contributing guide | `CONTRIBUTING.md` | P1 |
| Changelog | `CHANGELOG.md` | P2 |

### Example Findings

**P0 — Missing README**
```
📍 Evidence: No README.md file found in repository root
💥 Impact: Users cannot understand what this project does
✅ Action: Create a README.md with project description, installation, and usage
```

**P1 — No Installation Instructions**
```
📍 Evidence: README.md lacks installation or setup section
💥 Impact: New users may struggle to get started
✅ Action: Add a "Getting Started" or "Installation" section
```

**P2 — Missing Badges**
```
📍 Evidence: README lacks status badges (build, coverage, version)
💥 Impact: Users can't quickly assess project status
✅ Action: Add badges for CI status, npm version, and coverage
```

---

## ⚡ Developer Experience

**Purpose:** Evaluate how easy it is for developers to work on the project.

### What's Checked

| Check | Files Analyzed | Priority if Missing |
|-------|----------------|---------------------|
| Package manager | `package.json`, `Cargo.toml`, `go.mod`, etc. | P0 |
| Build scripts | `npm scripts`, `Makefile` | P1 |
| Language version | `.nvmrc`, `.node-version`, `.python-version` | P2 |
| TypeScript config | `tsconfig.json` | P2 |
| Editor config | `.editorconfig`, `.vscode/` | P2 |
| Development docs | README dev section | P2 |

### Stack Detection

Repo Check AI automatically detects the project stack:

| Stack | Detection Files |
|-------|-----------------|
| Node.js/JavaScript | `package.json` |
| TypeScript | `tsconfig.json` |
| Python | `pyproject.toml`, `setup.py`, `requirements.txt` |
| Go | `go.mod` |
| Rust | `Cargo.toml` |
| Java | `pom.xml`, `build.gradle` |
| .NET | `*.csproj`, `*.sln` |
| Ruby | `Gemfile` |

### Example Findings

**P0 — No Package Manifest**
```
📍 Evidence: No package.json, Cargo.toml, or equivalent found
💥 Impact: Cannot determine project dependencies or build process
✅ Action: Add appropriate package manifest for your language
```

**P1 — Missing Build Scripts**
```
📍 Evidence: package.json lacks "build" script
💥 Impact: Contributors don't know how to build the project
✅ Action: Add npm scripts for build, test, and dev
```

**P2 — No Node Version Specified**
```
📍 Evidence: No .nvmrc or .node-version file found
💥 Impact: Contributors might use incompatible Node.js versions
✅ Action: Create .nvmrc with "18" or your required version
```

---

## 🔄 CI/CD

**Purpose:** Ensure the project has automated testing and deployment pipelines.

### What's Checked

| Check | Files Analyzed | Priority if Missing |
|-------|----------------|---------------------|
| CI workflow exists | `.github/workflows/*.yml` | P0 |
| Tests run in CI | Workflow content | P0 |
| Build verification | Workflow content | P1 |
| Multi-platform testing | Matrix configuration | P2 |
| Automated releases | Release workflow | P2 |
| Branch protection hint | Workflow triggers | P2 |

### CI Platform Detection

| Platform | Files Checked |
|----------|---------------|
| GitHub Actions | `.github/workflows/*.yml` |
| CircleCI | `.circleci/config.yml` |
| Travis CI | `.travis.yml` |
| GitLab CI | `.gitlab-ci.yml` |
| Azure Pipelines | `azure-pipelines.yml` |

### Example Findings

**P0 — No CI Configuration**
```
📍 Evidence: No .github/workflows directory or CI configuration found
💥 Impact: Code changes are not automatically tested
✅ Action: Add GitHub Actions workflow for testing

   # .github/workflows/ci.yml
   name: CI
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npm test
```

**P0 — CI Exists but No Tests**
```
📍 Evidence: CI workflow found but no test step detected
💥 Impact: CI provides false confidence without running tests
✅ Action: Add test step to your CI workflow
```

**P1 — No Build Verification**
```
📍 Evidence: CI workflow doesn't verify the build succeeds
💥 Impact: Broken builds might not be caught
✅ Action: Add "npm run build" step to CI
```

---

## 🧪 Quality & Tests

**Purpose:** Assess test coverage, code quality tools, and quality standards.

### What's Checked

| Check | Files Analyzed | Priority if Missing |
|-------|----------------|---------------------|
| Test framework configured | `jest.config.js`, `vitest.config.ts`, etc. | P0 |
| Tests exist | `__tests__/`, `*.test.ts`, `test/` | P0 |
| Linting configured | `.eslintrc`, `eslint.config.js` | P1 |
| Formatting configured | `.prettierrc`, `prettier.config.js` | P2 |
| Type checking | `tsconfig.json` with strict | P2 |
| Coverage configured | Coverage config in test framework | P2 |
| Pre-commit hooks | `.husky/`, `lint-staged` | P2 |

### Test Framework Detection

| Framework | Detection Files |
|-----------|-----------------|
| Jest | `jest.config.js`, `jest.config.ts` |
| Vitest | `vitest.config.ts` |
| Mocha | `mocha.opts`, `.mocharc` |
| Pytest | `pytest.ini`, `pyproject.toml [tool.pytest]` |
| Go Test | `*_test.go` files |
| RSpec | `.rspec`, `spec/` directory |

### Example Findings

**P0 — No Test Configuration**
```
📍 Evidence: No test framework configuration found
💥 Impact: No automated testing exists for this project
✅ Action: Add Jest, Vitest, or appropriate test framework

   npm install --save-dev vitest
   # Add to package.json: "test": "vitest"
```

**P1 — No Linting**
```
📍 Evidence: No ESLint, Biome, or linter configuration found
💥 Impact: Code style inconsistencies and potential bugs
✅ Action: Add ESLint or Biome for code quality

   npm install --save-dev eslint
   npx eslint --init
```

**P2 — No Code Formatting**
```
📍 Evidence: No Prettier or formatter configuration found
💥 Impact: Inconsistent code formatting across contributors
✅ Action: Add Prettier for consistent formatting
```

---

## 📋 Governance

**Purpose:** Ensure proper project governance and community guidelines.

### What's Checked

| Check | Files Analyzed | Priority if Missing |
|-------|----------------|---------------------|
| LICENSE file | `LICENSE`, `LICENSE.md` | P0 |
| Code of Conduct | `CODE_OF_CONDUCT.md` | P1 |
| Issue templates | `.github/ISSUE_TEMPLATE/` | P2 |
| PR template | `.github/PULL_REQUEST_TEMPLATE.md` | P2 |
| CODEOWNERS | `.github/CODEOWNERS` | P2 |
| Funding | `.github/FUNDING.yml` | P2 |

### Example Findings

**P0 — Missing LICENSE**
```
📍 Evidence: No LICENSE file found in repository
💥 Impact: Project has no legal terms; others cannot use or contribute
✅ Action: Add a LICENSE file. Common choices:
   - MIT: Permissive, simple
   - Apache 2.0: Permissive with patent grant
   - GPL 3.0: Copyleft
```

**P1 — No Code of Conduct**
```
📍 Evidence: No CODE_OF_CONDUCT.md found
💥 Impact: No clear community behavior guidelines
✅ Action: Add CODE_OF_CONDUCT.md based on Contributor Covenant
```

**P2 — No Issue Templates**
```
📍 Evidence: No .github/ISSUE_TEMPLATE directory found
💥 Impact: Bug reports and feature requests may lack structure
✅ Action: Add templates for bug reports and feature requests
```

---

## 🔐 Security

**Purpose:** Evaluate security practices and vulnerability management.

### What's Checked

| Check | Files Analyzed | Priority if Missing |
|-------|----------------|---------------------|
| Security policy | `SECURITY.md` | P1 |
| Dependabot/Renovate | `.github/dependabot.yml`, `renovate.json` | P1 |
| Secret scanning | Repository settings | P2 |
| No secrets in code | Repository content | P0 |
| Dependency audit | Lock files | P2 |

### Example Findings

**P0 — Secrets Detected**
```
📍 Evidence: Potential API key or token found in source code
💥 Impact: Critical security vulnerability; secrets may be compromised
✅ Action: Remove secrets immediately; rotate any exposed credentials
```

**P1 — No Dependency Updates**
```
📍 Evidence: No Dependabot or Renovate configuration found
💥 Impact: Vulnerable dependencies may not be updated
✅ Action: Add Dependabot for automatic security updates

   # .github/dependabot.yml
   version: 2
   updates:
     - package-ecosystem: "npm"
       directory: "/"
       schedule:
         interval: "weekly"
```

**P1 — No Security Policy**
```
📍 Evidence: No SECURITY.md file found
💥 Impact: Users don't know how to report vulnerabilities
✅ Action: Add SECURITY.md with disclosure process
```

---

## Priority Levels

### P0 — Critical Blockers

Issues that prevent the project from being usable or legally compliant.

| Category | P0 Triggers |
|----------|-------------|
| Docs | No README |
| DX | No package manifest |
| CI/CD | No CI or CI without tests |
| Tests | No test configuration |
| Governance | No LICENSE |
| Security | Secrets in code |

### P1 — High Impact

Issues that significantly affect project quality or contributor experience.

| Category | P1 Triggers |
|----------|-------------|
| Docs | No installation docs, no contributing guide |
| DX | No build scripts |
| CI/CD | No build verification |
| Tests | No linting |
| Governance | No Code of Conduct |
| Security | No Dependabot, no SECURITY.md |

### P2 — Suggestions

Nice-to-have improvements for polish and best practices.

| Category | P2 Triggers |
|----------|-------------|
| Docs | Missing badges, no changelog |
| DX | No .nvmrc, no editor config |
| CI/CD | No multi-platform testing |
| Tests | No formatting, no coverage |
| Governance | No templates |
| Security | No audit workflow |

---

## Scoring Algorithm

Each category is scored independently:

```python
category_score = 100

for finding in category_findings:
    if finding.priority == "P0":
        category_score -= 30
    elif finding.priority == "P1":
        category_score -= 15
    elif finding.priority == "P2":
        category_score -= 5

category_score = max(0, category_score)  # Floor at 0%
```

Overall score uses weighted average:

```python
overall_score = (
    docs_score * 0.20 +
    dx_score * 0.20 +
    cicd_score * 0.20 +
    tests_score * 0.15 +
    governance_score * 0.15 +
    security_score * 0.10
)
```

---

<p align="center">
  <a href="index.md">← Back to Documentation</a>
</p>

