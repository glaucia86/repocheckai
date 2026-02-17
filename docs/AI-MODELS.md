# 🤖 Available AI Models

RepoCheckAI supports multiple AI models through the GitHub Copilot SDK. Choose the model that best fits your needs and subscription level.

---

## Model Comparison

| Model | Type | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `gpt-4o` | ✅ Free | ⚡⚡⚡ | ⭐⭐⭐ | Quick analyses, daily use |
| `gpt-4.1` | ✅ Free | ⚡⚡⚡ | ⭐⭐⭐ | General purpose |
| `gpt-5-mini` | ✅ Free | ⚡⚡⚡ | ⭐⭐⭐ | Lightweight tasks |
| `claude-sonnet-4` | ⚡ Premium | ⚡⚡ | ⭐⭐⭐⭐ | Default, balanced |
| `claude-sonnet-4.5` | ⚡ Premium | ⚡⚡ | ⭐⭐⭐⭐ | Enhanced reasoning |
| `claude-opus-4.5` | ⚡ Premium | ⚡ | ⭐⭐⭐⭐⭐ | Deep analysis, complex repos |
| `gpt-5` | ⚡ Premium | ⚡⚡ | ⭐⭐⭐⭐ | Advanced tasks |
| `gpt-5.1-codex` | ⚡ Premium | ⚡⚡ | ⭐⭐⭐⭐ | Code-focused analysis |
| `gpt-5.2-codex` | ⚡ Premium | ⚡⚡ | ⭐⭐⭐⭐ | Latest code optimization |
| `gpt-5.3-codex` | ⚡ Premium | ⚡⚡ | ⭐⭐⭐⭐⭐ | Advanced coding tasks |
| `o3` | ⚡ Premium | ⚡ | ⭐⭐⭐⭐⭐ | Complex reasoning |

---

## Free Models

Available to all GitHub Copilot users (Individual, Business, Enterprise):

### GPT-4o
```bash
repocheck vercel/next.js --model gpt-4o
```
- **Best for:** Quick health checks, daily use
- **Speed:** Fast
- **Quality:** Good for most repositories

### GPT-4.1
```bash
repocheck vercel/next.js --model gpt-4.1
```
- **Best for:** General purpose analysis
- **Speed:** Fast
- **Quality:** Latest GPT-4 improvements

### GPT-5 Mini
```bash
repocheck vercel/next.js --model gpt-5-mini
```
- **Best for:** Lightweight tasks, simple repositories
- **Speed:** Very fast
- **Quality:** Good for quick scans

---

## Premium Models

Require GitHub Copilot Pro, Business, or Enterprise subscription:

### Claude Sonnet 4 (Default)
```bash
repocheck vercel/next.js --model claude-sonnet-4
```
- **Best for:** Balanced analysis, recommended default
- **Speed:** Moderate
- **Quality:** Excellent reasoning and recommendations

### Claude Sonnet 4.5
```bash
repocheck vercel/next.js --model claude-sonnet-4.5
```
- **Best for:** Enhanced reasoning tasks
- **Speed:** Moderate
- **Quality:** Improved over Sonnet 4

### Claude Opus 4.5
```bash
repocheck vercel/next.js --model claude-opus-4.5
```
- **Best for:** Complex repositories, deep analysis
- **Speed:** Slower (3x rate limit cost)
- **Quality:** Most capable, best recommendations

### GPT-5
```bash
repocheck vercel/next.js --model gpt-5
```
- **Best for:** Advanced analysis
- **Speed:** Moderate
- **Quality:** Preview of latest capabilities

### GPT-5.1 Codex
```bash
repocheck vercel/next.js --model gpt-5.1-codex
```
- **Best for:** Code-heavy repositories
- **Speed:** Moderate
- **Quality:** Optimized for code analysis

### GPT-5.2 Codex
```bash
repocheck vercel/next.js --model gpt-5.2-codex
```
- **Best for:** Latest code analysis capabilities
- **Speed:** Moderate
- **Quality:** Most recent Codex improvements

### GPT-5.3 Codex
```bash
repocheck vercel/next.js --model gpt-5.3-codex
```
- **Best for:** Advanced coding tasks and complex codebases
- **Speed:** Moderate
- **Quality:** Cutting-edge code analysis and optimization

### O3
```bash
repocheck vercel/next.js --model o3
```
- **Best for:** Complex reasoning, large repositories
- **Speed:** Slower
- **Quality:** Best for deep logical analysis

---

## Switching Models

### During Analysis

Use the `/model` command to switch models interactively:

```bash
/model gpt-4o      # Switch to GPT-4o
/model claude-sonnet-4  # Switch to Claude Sonnet
```

### Via Command Line

Specify the model when starting:

```bash
repocheck owner/repo --model gpt-4o
```

### Interactive Selection

When starting without arguments, you'll be prompted to select a model:

```
Select AI Model:
❯ claude-sonnet-4 (Premium) - Default, balanced
  gpt-4o (Free) - Fast, efficient
  gpt-4.1 (Free) - Latest GPT-4
  ...
```

---

## Recommendations

| Use Case | Recommended Model |
|----------|-------------------|
| Quick daily checks | `gpt-4o` |
| Free tier users | `gpt-4o` or `gpt-4.1` |
| Detailed audits | `claude-sonnet-4` |
| Publishing with `--issue` | `claude-sonnet-4.5` |
| Complex monorepos | `claude-opus-4.5` |
| Code-focused analysis | `gpt-5.1-codex` |
| Advanced coding tasks | `gpt-5.3-codex` |
| Deep reasoning needed | `o3` |

---

## Rate Limits

Different models have different rate limit costs:

| Model | Rate Limit Cost |
|-------|----------------|
| Free models | 1x |
| Sonnet models | 1x |
| GPT-5 variants | 1x |
| Opus models | 3x |
| O3 | 2x |

> 💡 **Tip:** Use free models for frequent quick checks, and premium models for thorough audits.

---

## Troubleshooting

### "Model not available"

- Check your Copilot subscription level
- Premium models require Copilot Pro/Business/Enterprise
- Try a free model: `gpt-4o`

### "Rate limit exceeded"

- Wait a few minutes and retry
- Switch to a lower-cost model
- Use `gpt-4o` for bulk analyses

### "Model timeout"

- Some models are slower
- Increase timeout: `--timeout 180000`
- Try a faster model for large repos

### "Failed to list models: 401"

This is a Copilot SDK auth error. Re-authenticate with GitHub CLI and export the OAuth token:

```bash
gh auth login
export GH_TOKEN="$(gh auth token)"
```

See [issue-publishing.md](issue-publishing.md) for full steps.


