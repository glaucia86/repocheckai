# 💻 Commands Reference

Complete reference for all RepoCheckAI CLI commands and options.

> Transition note: `repocheck` is the official command. `repodoctor` is still accepted temporarily with a deprecation warning.

---

## Table of Contents

- [Interactive Commands](#interactive-commands)
- [Command Line Interface](#command-line-interface)
- [Analysis Commands](#analysis-commands)
- [Report Commands](#report-commands)
- [Session Commands](#session-commands)
- [Environment Variables](#environment-variables)

---

## Interactive Commands

When running RepoCheckAI in interactive mode, these slash commands are available:

### Analysis Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/analyze` | `<owner/repo>` | Quick analysis via GitHub API |
| `/deep` | `<owner/repo>` | Deep analysis with full source scan |

**Examples:**

```bash
/analyze vercel/next.js
/analyze https://github.com/facebook/react
/deep microsoft/typescript
```

### Report Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/copy` | — | Copy last report to clipboard |
| `/export` | `[path] [format]` | Export report to file |
| `/summary` | — | Show condensed summary of last analysis |
| `/last` | — | Re-display the last analysis |
| `/history` | — | Show recent analyses |

**Examples:**

```bash
# Copy to clipboard
/copy

# Export to default location
/export

# Export to specific path
/export ~/Desktop/report.md

# Export as JSON
/export ~/Desktop/report.json json

# Export to current directory
/export ./
```

### Session Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/model` | `[name]` | Switch or display current AI model |
| `/clear` | — | Clear the terminal screen |
| `/help` | — | Show available commands |
| `/quit` | — | Exit RepoCheckAI |

**Examples:**

```bash
# Show current model
/model

# Switch to GPT-4o
/model gpt-4o

# Switch to Claude Sonnet
/model claude-sonnet-4
```

---

## Command Line Interface

### Basic Syntax

```bash
repocheck [repository] [options]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `repository` | No | Repository to analyze (owner/repo or URL) |

If no repository is provided, RepoCheckAI starts in interactive mode.

### Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--model` | `-m` | string | `claude-sonnet-4` | AI model to use |
| `--token` | `-t` | string | — | GitHub personal access token |
| `--issue` | — | boolean | `false` | Publish analysis as GitHub issue(s) |
| `--deep` | `-d` | boolean | `false` | Enable deep analysis mode |
| `--export` | `-e` | boolean | `false` | Auto-export report after analysis |
| `--max-files` | — | number | `800` | Maximum files to analyze |
| `--max-bytes` | — | number | `204800` | Maximum bytes per file (200KB) |
| `--timeout` | — | number | `120000` | Analysis timeout in ms |
| `--skills` | — | string | `on` | Skills runtime mode (`on` or `off`) |
| `--skills-max` | — | number | `2` | Max number of skills the agent should apply |
| `--help` | `-h` | — | — | Show help information |
| `--version` | `-v` | — | — | Show version number |

> **Tip:** If you plan to use `--issue`, the best model for report quality is **Claude Sonnet 4.5**.
>
> **Web UI equivalent:** enable `Publish to GitHub Issues` in the local Web UI form.
> For token/auth setup and `401/403` troubleshooting, see [issue-publishing.md](issue-publishing.md).

---

## Analysis Commands

### /analyze

Performs a quick analysis using the GitHub API to read key files.

```bash
/analyze <repository>
```

**What it reads:**
- Repository metadata (description, topics, languages)
- README.md
- LICENSE
- package.json / pyproject.toml / go.mod (depending on stack)
- .github/workflows/*.yml
- .github/dependabot.yml
- CONTRIBUTING.md
- SECURITY.md
- CODE_OF_CONDUCT.md

**Characteristics:**
- ⚡ Fast (10-30 seconds)
- 📊 Reads up to 20 files
- 🌐 Works with any public repository
- 💰 Low API quota usage

**Example:**

```bash
/analyze vercel/next.js

# Output:
# 🔍 Analyzing vercel/next.js...
# ├─ Fetching repository metadata
# ├─ Reading README.md
# ├─ Reading LICENSE
# ├─ Reading package.json
# └─ Reading .github/workflows/ci.yml
#
# 📊 Analysis complete!
```

---

### /deep

Performs comprehensive analysis using [Repomix](https://github.com/yamadashy/repomix) to pack and analyze the entire repository.

```bash
/deep <repository>
```

**What it does:**
1. Clones the repository
2. Packs all source files using Repomix
3. Analyzes code patterns and structure
4. Generates detailed evidence extraction

**Characteristics:**
- 🔬 Comprehensive (30-60 seconds)
- 📂 Reads all source files
- 🎯 More accurate findings
- 💰 Higher API quota usage

**When to use:**
- Complex monorepos
- Detailed code audits
- Architecture analysis
- When quick scan misses issues

**Example:**

```bash
/deep microsoft/typescript

# Output:
# 🔬 Deep analyzing microsoft/typescript...
# ├─ Cloning repository
# ├─ Packing with Repomix
# ├─ Analyzing source code patterns
# └─ Generating comprehensive report
#
# 📊 Deep analysis complete!
```

---

## Report Commands

### /copy

Copies the last analysis report to the system clipboard.

```bash
/copy
```

**Behavior:**
- Copies full markdown report
- Preserves formatting and emojis
- Works on Windows, macOS, and Linux

---

### /export

Exports the report to a file.

```bash
/export [path] [format]
```

**Arguments:**

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `path` | No | `~/repocheck/reports/` | Output path |
| `format` | No | `md` | Output format (`md` or `json`) |

**Examples:**

```bash
# Default location and format
/export
# Saves to: ~/repocheck/reports/vercel-next.js-2024-01-15.md

# Custom path
/export ~/Desktop
# Saves to: ~/Desktop/vercel-next.js-2024-01-15.md

# Specific filename
/export ./my-report.md
# Saves to: ./my-report.md

# JSON format
/export ~/reports json
# Saves to: ~/reports/vercel-next.js-2024-01-15.json
```

**Output formats:**

| Format | Extension | Use Case |
|--------|-----------|----------|
| Markdown | `.md` | Human-readable reports |
| JSON | `.json` | Machine-readable, CI integration |

---

### /summary

Displays a condensed summary of the last analysis.

```bash
/summary
```

**Output includes:**
- Health score
- Category breakdown
- P0/P1 counts only
- Top 3 recommendations

---

### /last

Re-displays the full last analysis report.

```bash
/last
```

Useful when you've scrolled past the report or cleared the screen.

---

### /history

Shows recent analyses from the current session.

```bash
/history
```

**Output:**

```
📜 Recent Analyses:
1. vercel/next.js       - 85% (2 min ago)
2. facebook/react       - 92% (10 min ago)
3. microsoft/typescript - 78% (25 min ago)
```

---

## Session Commands

### /model

Displays or switches the current AI model.

```bash
/model [name]
```

**Without arguments:** Shows current model

```bash
/model
# Current model: claude-sonnet-4 (Premium)
```

**With model name:** Switches to that model

```bash
/model gpt-4o
# Switched to: gpt-4o (Free)
```

**Available models:**

| Model | Type | Description |
|-------|------|-------------|
| `gpt-4o` | Free | Fast, balanced |
| `gpt-4.1` | Free | Latest GPT-4 |
| `gpt-5-mini` | Free | Lightweight |
| `claude-sonnet-4` | Premium | Recommended default |
| `claude-sonnet-4.5` | Premium | Enhanced reasoning |
| `claude-opus-4.5` | Premium | Most capable |
| `o3` | Premium | Deep reasoning |

See [AI Models](AI-MODELS.md) for complete list.

---

### /clear

Clears the terminal screen.

```bash
/clear
```

---

### /help

Shows all available commands.

```bash
/help
```

---

### /quit

Exits RepoCheckAI.

```bash
/quit
```

Also accepts: `/exit`, `/q`, `Ctrl+C`

---

## Environment Variables

Configure RepoCheckAI behavior using environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub personal access token | `ghp_xxxx` |
| `GH_TOKEN` | GitHub CLI OAuth token for Copilot SDK | `gho_xxxx` |
| `REPOCHECKAI_MODEL` | Default AI model | `gpt-4o` |
| `REPOCHECKAI_TIMEOUT` | Analysis timeout (ms) | `180000` |
| `REPOCHECKAI_EXPORT_PATH` | Default export path | `~/reports` |

**Example usage:**

```bash
# Set in .bashrc or .zshrc
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
export GH_TOKEN="$(gh auth token)"
export REPOCHECKAI_MODEL=gpt-4o

# Or inline
GITHUB_TOKEN=ghp_xxxx repocheck owner/repo
```

---

## CLI Examples

### Common Workflows

```bash
# Quick health check
repocheck vercel/next.js

# Deep audit with premium model
repocheck facebook/react --model claude-opus-4.5 --deep

# Analyze and auto-export
repocheck microsoft/typescript --export

# Private repository
GITHUB_TOKEN=ghp_xxxx repocheck my-org/private-repo

# With extended timeout for large repos
repocheck kubernetes/kubernetes --timeout 300000
```

### Batch Analysis

```bash
# Analyze multiple repos (bash script)
for repo in "org/repo1" "org/repo2" "org/repo3"; do
  repocheck "$repo" --export
done
```

---

<p align="center">
  <a href="index.md">← Back to Documentation</a>
</p>




