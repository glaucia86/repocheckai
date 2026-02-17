# ❓ Frequently Asked Questions

Common questions about using RepoCheckAI.

---

## Table of Contents

- [General Questions](#general-questions)
- [Installation & Setup](#installation--setup)
- [Analysis & Reports](#analysis--reports)
- [AI Models](#ai-models)
- [Private Repositories](#private-repositories)
- [Pricing & Limits](#pricing--limits)

---

## General Questions

### What is RepoCheckAI?

RepoCheckAI is an AI-powered CLI tool that analyzes GitHub repositories for health issues. It checks documentation, developer experience, CI/CD, testing, governance, and security practices, then provides a detailed report with prioritized findings and actionable recommendations.

### How is it different from other code analysis tools?

Unlike traditional linters or static analysis tools that focus on code syntax:

| Aspect | Traditional Tools | RepoCheckAI |
|--------|------------------|-------------|
| Focus | Code syntax/style | Project health & best practices |
| Scope | Single language | Any language/framework |
| Output | Error lists | Prioritized findings with context |
| Intelligence | Rules-based | AI-powered contextual analysis |
| Recommendations | Fix specific issues | Strategic improvements |

### What languages/frameworks does it support?

RepoCheckAI supports **all languages and frameworks**. It automatically detects your stack and adapts its analysis:

- **JavaScript/TypeScript** (Node.js, React, Vue, etc.)
- **Python** (Django, Flask, FastAPI, etc.)
- **Go**
- **Rust**
- **Java/Kotlin** (Maven, Gradle)
- **C#/.NET**
- **Ruby** (Rails)
- And more...

### Is my code sent to external servers?

Your code is processed through the GitHub Copilot API, which has enterprise-grade security:

- No code is stored or used for training
- GitHub Copilot is SOC 2 certified
- Analysis happens in real-time and is not persisted

---

## Installation & Setup

### What are the system requirements?

| Requirement | Minimum |
|-------------|---------|
| Node.js | v18.0.0 |
| Operating System | Windows, macOS, Linux |
| GitHub Copilot | Active subscription |
| Internet | Required (API calls) |

### Why do I need GitHub Copilot?

RepoCheckAI uses the [GitHub Copilot SDK](https://github.com/github/copilot-sdk) for AI capabilities. This SDK requires an active GitHub Copilot subscription.

**Subscription options:**
- GitHub Copilot Individual ($10/month)
- GitHub Copilot Business ($19/user/month)
- GitHub Copilot Enterprise ($39/user/month)

### Can I use it without GitHub Copilot?

Currently, no. The AI analysis is powered by the Copilot SDK. There are no plans for a non-AI version as the core value is in AI-powered analysis.

### The installation failed, what should I do?

Common solutions:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Try with sudo (if permission issues on macOS/Linux)
sudo npm link

# Check Node.js version
node --version  # Should be 18+
```

See [Troubleshooting](troubleshooting.md) for more solutions.

---

## Analysis & Reports

### What's the difference between /analyze and /deep?

| Feature | `/analyze` | `/deep` |
|---------|-----------|---------|
| Speed | 10-30 seconds | 30-60 seconds |
| Files read | ~20 key files | All source files |
| Method | GitHub API | Repomix + GitHub API |
| Detail level | Summary | Comprehensive |
| API usage | Low | Higher |

**Use `/analyze`** for quick health checks and governance reviews.  
**Use `/deep`** for detailed audits and code quality analysis.

### What files does RepoCheckAI read?

**Quick analysis (`/analyze`) reads:**
- `README.md`
- `LICENSE`
- `package.json` (or equivalent manifest)
- `.github/workflows/*.yml`
- `.github/dependabot.yml`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- Test configuration files
- Linter configuration files

**Deep analysis (`/deep`) reads:**
- All of the above, plus
- All source code files
- Test files
- Documentation files

### How is the health score calculated?

The score is a weighted average across 6 categories:

```
Score = (Docs × 20%) + (DX × 20%) + (CI/CD × 20%) 
      + (Tests × 15%) + (Governance × 15%) + (Security × 10%)
```

Each category starts at 100% with deductions:
- P0 finding: −30 points
- P1 finding: −15 points
- P2 finding: −5 points

### Can I customize what gets analyzed?

Currently, the analysis criteria are fixed based on industry best practices. Future versions may support custom rules.

**Workaround:** You can ask follow-up questions in chat mode to focus on specific areas.

### How accurate is the analysis?

The AI model provides contextual analysis that's generally accurate, but:

- **True positives:** Usually 90%+ accuracy for file existence checks
- **Context understanding:** Very good at understanding project structure
- **False positives:** Occasionally may flag optional items
- **Best practice advice:** Based on widely accepted standards

Always review findings with your project's specific context in mind.

---

## AI Models

### Which model should I use?

| Situation | Recommended Model |
|-----------|-------------------|
| Quick daily checks | `gpt-4o` (Free) |
| Detailed audits | `claude-sonnet-4` (Premium) |
| Complex monorepos | `claude-opus-4.5` (Premium) |
| Code-focused analysis | `gpt-5.1-codex` (Premium) |
| Budget-conscious | `gpt-4o` or `gpt-4.1` (Free) |

### What's the difference between free and premium models?

| Aspect | Free Models | Premium Models |
|--------|-------------|----------------|
| Access | All Copilot subscribers | Pro/Business/Enterprise only |
| Speed | Fast | Varies |
| Quality | Good | Excellent |
| Rate limits | Standard | Standard (Opus 3x cost) |

### Can I use different models for different analyses?

Yes! Switch models anytime:

```bash
# Via command line
repocheck owner/repo --model gpt-4o

# In interactive mode
/model claude-sonnet-4
```

### Why does model X give different results than model Y?

Different models have different strengths:

- **GPT models:** Good at structured output, faster
- **Claude models:** Better reasoning, more detailed explanations
- **Opus/O3:** Deeper analysis, may catch subtle issues

The same repository may receive slightly different scores due to model interpretation.

---

## Private Repositories

### Can I analyze private repositories?

Yes! You need to provide a GitHub token with `repo` scope:

```bash
# Option 1: Environment variable
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
repocheck my-org/private-repo

# Option 2: Command line
repocheck my-org/private-repo --token ghp_xxxxxxxxxxxx

# Option 3: GitHub CLI (if authenticated)
gh auth login  # Then RepoCheckAI auto-detects
```

### What token scopes are required?

| Scope | Required For |
|-------|--------------|
| `repo` | Private repositories |
| `read:org` | Organization repositories (optional) |

For public repositories, no token is required (but rate limits apply).

### How do I create a GitHub token?

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the `repo` scope
4. Copy the generated token
5. Use it as shown above

> ⚠️ Never commit tokens to version control!

### Is my private code safe?

Yes. The analysis uses:
- GitHub's official API (encrypted)
- GitHub Copilot SDK (enterprise security)
- No code storage on third-party servers
- No logging of code content

### Why do I get "Failed to list models: 401"?

This is a Copilot SDK auth error (model listing), not a GitHub API error. Re-authenticate with GitHub CLI and export the OAuth token:

```bash
gh auth login
export GH_TOKEN="$(gh auth token)"
```

See [issue-publishing.md](issue-publishing.md) for the full step-by-step guide.

### Why does `--issue` return 401/403?

Your PAT lacks write access to issues or does not have repo access.
The same rule applies to Web UI publishing (`Publish to GitHub Issues`).

- Classic PAT: ensure `repo` (or `public_repo`) is selected
- Fine-grained PAT: ensure **Metadata (read)**, **Contents (read)**, **Issues (read/write)**
- Confirm you have permission to create issues in that repo

---

## Pricing & Limits

### Is RepoCheckAI free?

RepoCheckAI is **open source and free**. However, it requires:

- **GitHub Copilot subscription** (paid)
- **GitHub API access** (free with limits)

### What are the GitHub API rate limits?

| Token Type | Rate Limit |
|------------|------------|
| Unauthenticated | 60 requests/hour |
| Authenticated | 5,000 requests/hour |

**Quick analysis** uses ~10-30 requests per repository.  
**Deep analysis** uses ~50-100 requests per repository.

### What happens if I hit rate limits?

You'll see an error like "Rate limit exceeded". Solutions:

1. Wait 1 hour for limits to reset
2. Use a GitHub token (higher limits)
3. Use `/analyze` instead of `/deep` (fewer requests)

### Are there costs for AI usage?

AI usage is included in your GitHub Copilot subscription. There are no additional charges from RepoCheckAI.

**Note:** Premium models like `claude-opus-4.5` consume rate limits faster (3x cost), which may affect your Copilot usage for other tools.

---

## More Questions?

- 💬 [Start a Discussion](https://github.com/glaucia86/repocheckai/discussions)
- 🐛 [Report an Issue](https://github.com/glaucia86/repocheckai/issues)
- 📖 [Read the Full Documentation](index.md)

---

<p align="center">
  <a href="index.md">← Back to Documentation</a>
</p>


