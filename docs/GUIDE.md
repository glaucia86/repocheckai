# 📖 RepoCheckAI User Guide

Complete guide for using RepoCheckAI CLI.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Interactive Chat Mode](#interactive-chat-mode)
- [Slash Commands](#slash-commands)
- [Analysis Modes](#analysis-modes)
- [Export Options](#export-options)
- [Command Line Options](#command-line-options)
- [Private Repositories](#private-repositories)
- [Priority Levels](#priority-levels)

---

## Quick Start

```bash
# Start interactive mode - will prompt for repository and model
repocheck

# Analyze a specific repository directly
repocheck vercel/next.js

# Analyze with a specific model
repocheck vercel/next.js --model gpt-4o
```

---

## Interactive Chat Mode

When you run `repocheck`, you enter an interactive chat interface:

```
╭─────────────────────────────────────────╮
│  🩺 REPO CHECK AI v2.0                    │
│     GitHub Repository Health Analyzer   │
╰─────────────────────────────────────────╯

  ✨ Welcome to RepoCheckAI!
  
  Enter repository (owner/repo): vercel/next.js
  
  Select AI Model:
  ❯ claude-sonnet-4 (Premium)
    gpt-4o (Free)
    gpt-4.1 (Free)
    ...

  🔍 Analyzing repository...
```

After analysis, you'll see options to copy, export, or analyze another repository.

---

## Slash Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/analyze <repo>` | Quick analysis (metadata + key files) | `/analyze vercel/next.js` |
| `/deep <repo>` | **Deep analysis** with full repo scan via Repomix | `/deep facebook/react` |
| `/summary` | Show condensed summary of last analysis | `/summary` |
| `/last` | Show last analysis result | `/last` |
| `/history` | Show recent analyses | `/history` |
| `/copy` | Copy analysis to clipboard | `/copy` |
| `/export [path] [format]` | Export report to file | `/export ~/Desktop` |
| `/model [name]` | Switch AI model | `/model gpt-4o` |
| `/clear` | Clear the screen | `/clear` |
| `/help` | Show available commands | `/help` |
| `/quit` | Exit RepoCheckAI | `/quit` |

> 💡 **Tip:** Use `/deep` for comprehensive analysis of complex repositories. It reads all source files and provides more detailed evidence.

---

## Analysis Modes

### Comparison

| Feature | `/analyze` (Quick) | `/deep` (Comprehensive) |
|---------|-------------------|------------------------|
| **Speed** | ⚡ Fast (10-30s) | 🐢 Slower (30-60s) |
| **API Quota** | Low usage | Higher usage |
| **Files Read** | Key files only | All source files |
| **Evidence Detail** | Summary level | Full extraction |
| **Best For** | Quick health check | Detailed audit |
| **Requires** | GitHub API only | Repomix (auto-installed) |

### Quick Analysis (`/analyze`)

Standard analysis that reads repository metadata and key files (README, LICENSE, package.json, workflows, etc.) via GitHub API.

```bash
/analyze vercel/next.js
```

### Deep Analysis (`/deep`)

The `/deep` command uses [Repomix](https://github.com/yamadashy/repomix) to perform a comprehensive repository scan:

```bash
# Deep analysis of a repository
/deep vercel/next.js

# What it does:
# 1. Clones and packs the entire repository
# 2. Reads all source files (not just metadata)
# 3. Analyzes code patterns, dependencies, and structure
# 4. Generates detailed evidence extraction
# 5. Produces a comprehensive health report
```

**Deep Analysis provides:**
- 📂 Full file tree analysis
- 📦 Complete dependency review
- 🔍 Source code pattern detection
- 📊 Detailed evidence extraction section
- 🎯 More accurate health scoring

> ⚠️ **Note:** Deep analysis takes longer (30-60 seconds) and uses more API quota. Use `/analyze` for quick checks.

---

## Export Options

The `/export` command supports flexible paths:

```bash
# Save to default location: ~/repocheck/reports/
/export

# Save to Desktop
/export ~/Desktop

# Save with custom filename
/export ./my-report.md

# Save as JSON
/export ~/Documents json

# Save to specific path as JSON
/export ~/Desktop/analysis.json
```

Reports are saved with UTF-8 encoding (with BOM) to preserve emojis correctly.

---

## Command Line Options

```bash
repocheck [repository] [options]

Options:
  --token <TOKEN>     GitHub token for private repos (or set GITHUB_TOKEN env)
  --model <name>      AI model to use (default: claude-sonnet-4)
  --issue             Publish analysis as GitHub issue(s)
  --max-files <N>     Maximum files to analyze (default: 800)
  --max-bytes <N>     Maximum bytes per file (default: 200KB)
  --timeout <ms>      Analysis timeout (default: 120000)
  --export            Export report after analysis
  --help              Show help
```

### Examples

```bash
# Analyze a public repository
repocheck microsoft/typescript

# Analyze with full URL
repocheck https://github.com/facebook/react

# Analyze a private repository
export GITHUB_TOKEN=ghp_xxxxx
repocheck owner/private-repo

# Use a free model
repocheck vercel/next.js --model gpt-4o

# Auto-export after analysis
repocheck vercel/next.js --export
```

---

## Private Repositories

To analyze private repositories, you need to provide a GitHub Personal Access Token (PAT) with `repo` scope.

### Option 1: Environment Variable (Recommended)

```bash
# Set your GitHub token
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Now analyze any private repo
repocheck my-org/private-repo
```

### Option 2: Command Line Argument

```bash
repocheck my-org/private-repo --token ghp_xxxxxxxxxxxxxxxxxxxx
```

### Creating a GitHub Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select the `repo` scope (Full control of private repositories)
4. Copy the generated token and use it as shown above

> ⚠️ **Security Tip:** Never commit your token to version control. Use environment variables or a secrets manager.

---

## Publishing Issues (`--issue`)

Use `--issue` to create GitHub issues with the analysis output. This requires a PAT with issue write access and Copilot SDK auth for model access.

Web UI equivalent: run `npm run dev:local-ui` and enable `Publish to GitHub Issues` in the form.

> **Tip:** If you plan to use `--issue`, the best model for report quality is **Claude Sonnet 4.5**.

```bash
# Copilot SDK auth (recommended)
export GH_TOKEN="$(gh auth token)"

# Create issues during analysis
repocheck analyze owner/repo --issue --token ghp_your_pat_here
```

For a full step-by-step guide and 401 troubleshooting, see [issue-publishing.md](issue-publishing.md).

---

## Priority Levels

RepoCheckAI classifies findings into three priority levels:

| Priority | Meaning | Examples |
|----------|---------|----------|
| **P0** | Critical blocker | No LICENSE, no README, no CI |
| **P1** | High impact | CI without tests, no CONTRIBUTING guide |
| **P2** | Nice to have | Badges, refined templates |

### What Gets Analyzed?

| Category | What's Checked |
|----------|----------------|
| 📚 **Docs & Onboarding** | README quality, setup instructions, contributing guidelines |
| ⚡ **Developer Experience** | npm scripts, Node version, TypeScript, monorepo setup |
| 🔄 **CI/CD** | GitHub Actions, test automation, build pipelines |
| 🧪 **Quality & Tests** | Test framework, linting, formatting, code coverage |
| 📋 **Governance** | LICENSE, CODE_OF_CONDUCT, SECURITY policy, templates |
| 🔐 **Security** | Dependabot/Renovate, security policy, secret management |

## Advanced Usage Examples

### CI/CD Integration

#### GitHub Actions Integration

Create a workflow that automatically analyzes your repository health:

```yaml
# .github/workflows/repo-health.yml
name: Repository Health Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run weekly on Mondays at 9 AM UTC
    - cron: '0 9 * * 1'

jobs:
  health-check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install RepoCheckAI
        run: npm install -g repocheck

      - name: Run health analysis
        run: repocheck analyze ${{ github.repository }} --export health-report.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload report as artifact
        uses: actions/upload-artifact@v4
        with:
          name: health-report
          path: health-report.md

      - name: Comment PR with health score
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('health-report.md', 'utf8');
            
            // Extract health score (assuming it's in the report)
            const scoreMatch = report.match(/Health Score: (\d+)/);
            const score = scoreMatch ? scoreMatch[1] : 'N/A';
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🩺 Repository Health Report\n\n**Health Score:** ${score}/100\n\n[View full report](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})`
            });
```

#### Jenkins Pipeline Integration

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Repository Health Check') {
            steps {
                script {
                    // Install RepoCheckAI if not available globally
                    sh 'npm install -g repocheck'
                    
                    // Run analysis
                    sh "repocheck analyze ${env.GIT_URL.replace('.git', '').split('/').slice(-2).join('/')} --export health-report.md"
                    
                    // Archive report
                    archiveArtifacts artifacts: 'health-report.md', fingerprint: true
                    
                    // Read and parse report for health score
                    def report = readFile 'health-report.md'
                    def score = (report =~ /Health Score: (\d+)/)[0][1]
                    
                    // Set build description
                    currentBuild.description = "Health Score: ${score}/100"
                    
                    // Fail build if health score is too low
                    if (score.toInteger() < 70) {
                        unstable('Repository health score is below threshold')
                    }
                }
            }
        }
    }
    
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: '.',
                reportFiles: 'health-report.md',
                reportName: 'Repository Health Report'
            ])
        }
    }
}
```

#### CircleCI Integration

```yaml
# .circleci/config.yml
version: 2.1

workflows:
  health-check:
    jobs:
      - repo-health

jobs:
  repo-health:
    docker:
      - image: cimg/node:20
    steps:
      - checkout
      - run:
          name: Install RepoCheckAI
          command: npm install -g repocheck
      - run:
          name: Run Health Analysis
          command: |
            repocheck analyze $CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME --export health-report.md
          environment:
            GITHUB_TOKEN: $GITHUB_TOKEN
      - store_artifacts:
          path: health-report.md
          destination: health-report.md
      - run:
          name: Post Health Score to Slack
          command: |
            SCORE=$(grep "Health Score:" health-report.md | grep -o "[0-9]\+")
            curl -X POST -H 'Content-type: application/json' \
              --data "{\"text\":\"Repository Health Score: $SCORE/100\"}" \
              $SLACK_WEBHOOK_URL

orbs:
  slack: circleci/slack@4.12.5
```

### Report Automation

#### Automated Weekly Reports

Create a scheduled script that generates and emails weekly health reports:

```bash
#!/bin/bash
# weekly-health-report.sh

REPO="your-org/your-repo"
OUTPUT_DIR="./health-reports"
DATE=$(date +%Y-%m-%d)

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Run analysis
repocheck analyze "$REPO" --export "$OUTPUT_DIR/health-report-$DATE.md"

# Generate summary
SCORE=$(grep "Health Score:" "$OUTPUT_DIR/health-report-$DATE.md" | grep -o "[0-9]\+")
ISSUES=$(grep -c "🔴\|🟠\|🟡" "$OUTPUT_DIR/health-report-$DATE.md")

# Send email (requires mail command or similar)
echo "Subject: Weekly Health Report - $REPO
Health Score: $SCORE/100
Issues Found: $ISSUES

Full report attached." | mail -s "Weekly Health Report" -a "$OUTPUT_DIR/health-report-$DATE.md" your-email@example.com
```

#### Slack Integration

Post health reports to Slack channels:

```bash
#!/bin/bash
# slack-health-report.sh

REPO="your-org/your-repo"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Run analysis
repocheck analyze "$REPO" --export health-report.md

# Extract key metrics
SCORE=$(grep "Health Score:" health-report.md | grep -o "[0-9]\+")
CRITICAL=$(grep -c "🔴" health-report.md)
HIGH=$(grep -c "🟠" health-report.md)
MEDIUM=$(grep -c "🟡" health-report.md)

# Determine color based on score
if [ "$SCORE" -ge 90 ]; then
    COLOR="good"
elif [ "$SCORE" -ge 70 ]; then
    COLOR="warning"
else
    COLOR="danger"
fi

# Post to Slack
curl -X POST -H 'Content-type: application/json' \
  --data "{
    \"attachments\": [
      {
        \"color\": \"$COLOR\",
        \"title\": \"Repository Health Report - $REPO\",
        \"fields\": [
          {
            \"title\": \"Health Score\",
            \"value\": \"$SCORE/100\",
            \"short\": true
          },
          {
            \"title\": \"Critical Issues\",
            \"value\": \"$CRITICAL\",
            \"short\": true
          },
          {
            \"title\": \"High Priority\",
            \"value\": \"$HIGH\",
            \"short\": true
          },
          {
            \"title\": \"Medium Priority\",
            \"value\": \"$MEDIUM\",
            \"short\": true
          }
        ],
        \"actions\": [
          {
            \"type\": \"button\",
            \"text\": \"View Full Report\",
            \"url\": \"https://github.com/$REPO\"
          }
        ]
      }
    ]
  }" \
  "$SLACK_WEBHOOK_URL"
```

#### GitHub Issues Automation

Automatically create issues for critical findings:

```bash
#!/bin/bash
# auto-issue-creation.sh

REPO="your-org/your-repo"

# Run analysis with issue creation
export GITHUB_TOKEN="your-github-token"
export GH_TOKEN="$(gh auth token)"

# Create issues for all findings
repocheck analyze "$REPO" --issue

# Or create issues only for critical (P0) findings
# (This would require custom scripting to filter the report)
```

### Custom Analysis Scripts

#### Multi-Repository Analysis

Analyze multiple repositories in batch:

```bash
#!/bin/bash
# batch-analysis.sh

REPOS=(
    "your-org/repo1"
    "your-org/repo2"
    "your-org/repo3"
)

OUTPUT_DIR="./batch-reports"
mkdir -p "$OUTPUT_DIR"

for repo in "${REPOS[@]}"; do
    echo "Analyzing $repo..."
    repocheck analyze "$repo" --export "$OUTPUT_DIR/$(basename "$repo").md"
done

# Generate summary report
echo "# Batch Health Report" > "$OUTPUT_DIR/summary.md"
echo "Generated on $(date)" >> "$OUTPUT_DIR/summary.md"
echo "" >> "$OUTPUT_DIR/summary.md"

for repo in "${REPOS[@]}"; do
    repo_name=$(basename "$repo")
    score=$(grep "Health Score:" "$OUTPUT_DIR/$repo_name.md" | grep -o "[0-9]\+")
    echo "- **$repo**: $score/100" >> "$OUTPUT_DIR/summary.md"
done
```

#### Trend Analysis

Track health scores over time:

```bash
#!/bin/bash
# trend-analysis.sh

REPO="your-org/your-repo"
HISTORY_FILE="./health-history.csv"

# Run analysis
repocheck analyze "$REPO" --export temp-report.md

# Extract metrics
DATE=$(date +%Y-%m-%d)
SCORE=$(grep "Health Score:" temp-report.md | grep -o "[0-9]\+")
CRITICAL=$(grep -c "🔴" temp-report.md)
HIGH=$(grep -c "🟠" temp-report.md)
MEDIUM=$(grep -c "🟡" temp-report.md)

# Append to history
echo "$DATE,$SCORE,$CRITICAL,$HIGH,$MEDIUM" >> "$HISTORY_FILE"

# Generate trend chart (requires additional tools)
# This could be extended with Python/matplotlib or similar

rm temp-report.md
```

### Integration with Development Workflows

#### Pre-commit Hook

Add repository health checks to your pre-commit workflow:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run quick health check
repocheck analyze "$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')" --export /tmp/health-check.md

SCORE=$(grep "Health Score:" /tmp/health-check.md | grep -o "[0-9]\+")

if [ "$SCORE" -lt 50 ]; then
    echo "⚠️  Repository health score is low ($SCORE/100). Consider addressing issues before committing."
    echo "Full report: /tmp/health-check.md"
fi

# Don't block commit, just warn
exit 0
```

#### VS Code Extension Integration

Create a VS Code task for easy access:

```json
// .vscode/tasks.json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Run RepoCheckAI",
            "type": "shell",
            "command": "repocheck",
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Analyze Current Repo",
            "type": "shell",
            "command": "repocheck analyze $(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\\1/')",
            "group": "build"
        }
    ]
}
```



