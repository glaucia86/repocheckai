# 🧭 Issue Publishing and 401 Troubleshooting

This guide explains how to use the `--issue` flag safely, how Copilot SDK auth differs from GitHub API auth, and how to fix 401 errors.

---

## 1) Two auth paths (very important)

RepoCheckAI uses two separate auth paths:

- **Copilot SDK auth (models and analysis)**
  - If this fails, you will see: `Failed to list models: 401`.
- **GitHub API auth (repo read + issue creation)**
  - If this fails, you will see 401/403 during repo reads or issue creation.

You must configure both.

---

## 2) Copilot SDK auth (fixes model 401)

Use GitHub CLI to authenticate with OAuth (recommended).

### Step-by-step

```powershell
# Start clean
Remove-Item Env:GITHUB_TOKEN, Env:GH_TOKEN -ErrorAction SilentlyContinue

# Login to GitHub CLI
# Choose: GitHub.com -> Login via web -> HTTPS
gh auth logout
gh auth login

# Confirm login
# Active account should be true
# Do NOT use GITHUB_TOKEN here
gh auth status

# Export OAuth token for RepoCheckAI
$env:GH_TOKEN = (gh auth token)
```

If you still see `Failed to list models: 401`, re-run `gh auth login` and verify your Copilot subscription is active on that account.

---

## 3) GitHub API token for `--issue`

You need a PAT that can create issues in the target repo.

### Option A: Classic PAT (recommended)

1. GitHub -> Settings -> Developer settings
2. Personal access tokens -> **Tokens (classic)**
3. Generate new token (classic)
4. Scopes:
   - `repo` (private + public) or `public_repo` (public only)
5. Generate and copy the token once

### Option B: Fine-grained PAT

1. GitHub -> Settings -> Developer settings
2. Personal access tokens -> **Fine-grained tokens**
3. Repository access:
   - **All repositories** (if you need issue write across your repos)
   - or **Only select repositories** (recommended)
4. Repository permissions (minimum):
   - **Metadata**: Read-only (Required)
   - **Contents**: Read-only
   - **Issues**: Read and write
5. Account permissions: keep **No access**
6. Generate and copy the token once

---

## 4) Run RepoCheckAI with `--issue` (CLI)

You can use Copilot auth (GH_TOKEN) and pass the PAT only for issue creation.

```powershell
# Copilot SDK auth
$env:GH_TOKEN = (gh auth token)

# Start in dev (chat)
npm run dev:cli
```

In the app:

```
/deep owner/repo --issue --token <YOUR_PAT>
```

Direct mode:

```powershell
repocheck analyze owner/repo --issue --token <YOUR_PAT>
```

---

## 5) Run issue publishing from Web UI

Start both services:

```bash
npm run dev:local-ui
```

In the Web UI form:

1. Enable **Publish to GitHub Issues**
2. Optionally fill **GitHub Token**
3. Run analysis

Token behavior in Web UI:

- If **GitHub Token** is filled, that value is used.
- If the field is empty, the backend tries `GITHUB_TOKEN` from server environment.
- If neither is available, analysis still runs, but issue publishing is skipped.

---

## 6) Quick diagnostics

### Check PAT can create an issue

```powershell
$env:GITHUB_TOKEN = "<YOUR_PAT>"
Invoke-RestMethod -Method Post \
  -Headers @{ Authorization = "Bearer $env:GITHUB_TOKEN" } \
  -Uri https://api.github.com/repos/owner/repo/issues \
  -Body (@{ title = "RepoCheckAI test"; body = "test" } | ConvertTo-Json) \
  -ContentType "application/json"
```

### If you see 401/403

- **Models 401** -> Copilot auth failed (redo section 2)
- **Issue 401** -> PAT missing Issues: Read/Write
- **Issue 403** -> PAT valid but no access to that repo

---

## 7) Security notes

- Never commit tokens or store them inside the repo
- Use short expiration for PATs
- Revoke tokens immediately if exposed

---

<p align="center">
  <a href="index.md">← Back to Documentation</a>
</p>


