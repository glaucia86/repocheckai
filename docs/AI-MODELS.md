# 🤖 Available AI Models

RepoCheckAI now uses a single shared model catalog across the CLI, API, and Web UI, and enriches it with live `client.listModels()` data from the GitHub Copilot SDK when available.

This page reflects the official GitHub Copilot model and plan state published through **April 24, 2026**.

---

## Highlights

- `claude-sonnet-4` remains RepoCheckAI's default model.
- `auto` is now exposed as a first-class option across the product.
- `GPT-5.5` is the newest GPT rollout and is currently available to `Pro+`, `Business`, and `Enterprise`.
- `Claude Opus 4.7` is now the top-tier Opus recommendation for compatible plans.
- Retired models such as `gpt-5`, `gpt-5.1`, `gpt-5.1-codex*`, `gemini-3-pro-preview`, and `o3` are no longer advertised by default.

---

## Plan Snapshot

| Copilot plan | Included monthly premium requests | Notes |
|--------------|-----------------------------------|-------|
| `Free` | `50` | Includes up to `2,000` inline suggestions per month |
| `Student` | `300` | New signups paused since April 20, 2026 |
| `Pro` | `300` | New signups paused since April 20, 2026 |
| `Pro+` | `1,500` | New signups paused since April 20, 2026 |
| `Business` | `300` per user | New self-serve signups paused since April 22, 2026 |
| `Enterprise` | `1,000` per user | Highest bundled organizational allowance |

---

## Recommended Models

| Model | Access | Multiplier | Best for |
|-------|--------|------------|----------|
| `auto` | All Copilot plans | Dynamic | Let Copilot choose the best model automatically |
| `gpt-4o` | All Copilot plans | `0x` paid / `1x` free | Fast daily checks |
| `gpt-4.1` | All Copilot plans | `0x` paid / `1x` free | Balanced general-purpose analysis |
| `gpt-5-mini` | All Copilot plans | `0x` paid / `1x` free | Lightweight scans |
| `claude-sonnet-4` | Student and paid plans | `1x` | RepoCheckAI default |
| `claude-sonnet-4.6` | Student and paid plans | `1x` | Strong premium generalist |
| `gpt-5.3-codex` | Student and paid plans | `1x` | Code-heavy repositories |
| `gpt-5.5` | Pro+, Business, Enterprise | `7.5x` promo | Newest GPT rollout for complex multi-step work |
| `claude-opus-4.7` | Pro+, Business, Enterprise | `7.5x` promo | Current top-tier deep reasoning model |

> `Claude Opus 4.7` and `GPT-5.5` are rolling out gradually. If you do not see them in your client yet, RepoCheckAI will fall back to the models your current Copilot environment reports.

---

## Current Curated Catalog

RepoCheckAI currently curates these model IDs:

- `auto`
- `gpt-4o`
- `gpt-4.1`
- `gpt-5-mini`
- `claude-sonnet-4`
- `claude-sonnet-4.5`
- `claude-sonnet-4.6`
- `claude-haiku-4.5`
- `claude-opus-4.5`
- `claude-opus-4.6`
- `claude-opus-4.7`
- `gpt-5.2`
- `gpt-5.2-codex`
- `gpt-5.3-codex`
- `gpt-5.4`
- `gpt-5.4-mini`
- `gpt-5.4-nano`
- `gpt-5.5`
- `gemini-2.5-pro`
- `gemini-3-flash`
- `gemini-3.1-pro`
- `grok-code-fast-1`
- `raptor-mini`
- `goldeneye`

Variants with ambiguous public IDs, such as `Claude Opus 4.6 (fast mode)`, are documented by GitHub but only appear in RepoCheckAI when the runtime reports them directly.

---

## Usage Examples

```bash
# Default premium model
repocheck vercel/next.js --model claude-sonnet-4

# Let Copilot choose automatically
repocheck vercel/next.js --model auto

# Code-focused premium analysis
repocheck vercel/next.js --model gpt-5.3-codex --deep

# Top-tier premium analysis for compatible plans
repocheck vercel/next.js --model claude-opus-4.7 --deep

# Latest GPT rollout for compatible plans
repocheck vercel/next.js --model gpt-5.5 --deep
```

---

## Recommendations By Scenario

| Scenario | Recommended model |
|----------|-------------------|
| Quick daily checks | `gpt-4o` |
| Lowest-cost included usage | `gpt-4.1` or `gpt-5-mini` |
| Safe default for most repos | `claude-sonnet-4` |
| Detailed premium audits | `claude-sonnet-4.6` |
| Code-focused deep review | `gpt-5.3-codex` |
| Complex monorepos on Pro+ or org plans | `claude-opus-4.7` |
| Latest GPT capabilities on compatible plans | `gpt-5.5` |
| Unsure what to pick | `auto` |

> `Opus` models are no longer the default recommendation for `Pro`. GitHub removed Opus access from `Pro` on April 20, 2026.

---

## How Model Discovery Works

RepoCheckAI does not scrape `copilot --help` anymore. It now:

1. Uses the Copilot SDK's `client.listModels()` with a short timeout.
2. Merges runtime-reported models with RepoCheckAI's curated metadata.
3. Falls back to the curated catalog if runtime discovery is unavailable.

This keeps the `/model` command, the Web picker, and `GET /models` aligned with current Copilot behavior.

---

## Troubleshooting

### "Model not available"

- Check whether your Copilot plan includes that model.
- Remember that `GPT-5.5` and `Claude Opus 4.7` currently target `Pro+`, `Business`, and `Enterprise`.
- Try `auto`, `gpt-4o`, or `gpt-4.1` if you need a broadly available fallback.

### "Failed to list models: 401"

This comes from Copilot SDK authentication, not the GitHub REST API.

```bash
gh auth login
export GH_TOKEN="$(gh auth token)"
```

### "Why don't I see a model listed in GitHub docs?"

GitHub publishes some model names without guaranteeing the exact runtime ID in every client. RepoCheckAI only hardcodes conservative IDs and lets runtime discovery expose anything more specific.


