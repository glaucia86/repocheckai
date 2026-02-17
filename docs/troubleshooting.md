# 🔧 Troubleshooting

Solutions for common issues when using RepoCheckAI.

> Transition note: if old scripts still call `repodoctor`, they should keep working during migration but will emit a deprecation warning.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Authentication Issues](#authentication-issues)
- [Analysis Issues](#analysis-issues)
- [AI Model Issues](#ai-model-issues)
- [Export Issues](#export-issues)
- [Performance Issues](#performance-issues)
- [Getting Help](#getting-help)

---

## Installation Issues

### "command not found: repocheck"

The global npm link wasn't created successfully.

**Solutions:**

```bash
# 1. Try relinking
npm unlink repocheck
npm link

# 2. Run directly with npx
npx repocheck

# 3. Check npm global path
npm config get prefix
# Add the /bin folder to your PATH

# 4. On Windows, try PowerShell as Administrator
npm link
```

### "Cannot find module" errors

Dependencies are missing or corrupted.

**Solutions:**

```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### "Node.js version too old"

RepoCheckAI requires Node.js 18+.

**Solutions:**

```bash
# Check your version
node --version

# Using nvm to upgrade
nvm install 18
nvm use 18

# Or download from nodejs.org
```

### Build errors with TypeScript

**Solutions:**

```bash
# Clear TypeScript cache
rm -rf dist
npm run build

# If tsconfig issues
npm install typescript --save-dev
npm run build
```

### Permission denied on macOS/Linux

**Solutions:**

```bash
# Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Or use sudo (not recommended for npm)
sudo npm link
```

---

## Authentication Issues

### "401 Unauthorized" or "Bad credentials"

Your GitHub token is invalid or expired.

**Solutions:**

```bash
# 1. Check token is set
echo $GITHUB_TOKEN

# 2. Test token with curl
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# 3. Generate new token
# Go to: github.com/settings/tokens
# Create new token with 'repo' scope

# 4. Set new token
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### "403 Forbidden - API rate limit exceeded"

You've hit GitHub's API rate limit.

**Solutions:**

```bash
# 1. Check your rate limit status
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# 2. Wait for reset (usually 1 hour)

# 3. Use authenticated requests (5000/hour vs 60/hour)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx


### "Failed to list models: 401"

This error comes from Copilot SDK authentication (model listing), not the GitHub API.

**Solutions:**

```bash
# Re-authenticate via GitHub CLI (OAuth)
# 4. Use /analyze instead of /deep (fewer requests)
```

### "403 Resource not accessible"

You don't have access to this repository.

**Solutions:**

See the full step-by-step guide in [issue-publishing.md](issue-publishing.md).

### "--issue" returns 401/403

Your PAT lacks access or write permissions.

**Fix:**
- Classic PAT: ensure `repo` (or `public_repo`) is selected
- Fine-grained PAT: ensure **Metadata (read)**, **Contents (read)**, **Issues (read/write)**
- Confirm you have write access to the target repo

- Verify the repository exists and is spelled correctly
- Check if it's private (need token with `repo` scope)
- Verify you have read access to the repository

### GitHub CLI authentication not working

**Solutions:**

```bash
# 1. Check if gh is authenticated
gh auth status

# 2. Re-authenticate
gh auth login

# 3. Select correct scopes
# Choose: GitHub.com
# Choose: HTTPS
# Authenticate in browser
```

---

## Analysis Issues

### "Repository not found"

**Possible causes and solutions:**

| Cause | Solution |
|-------|----------|
| Typo in name | Check spelling: `owner/repo` |
| Private repo | Provide token with `repo` scope |
| Renamed repo | Use current repository name |
| Deleted repo | Repository no longer exists |

```bash
# Verify repository exists
curl https://api.github.com/repos/owner/repo
```

### Analysis hangs or is very slow

**Solutions:**

```bash
# 1. Increase timeout
repocheck owner/repo --timeout 180000

# 2. Use quick analysis instead of deep
/analyze owner/repo  # Instead of /deep

# 3. Check network connectivity
ping api.github.com

# 4. Try a different model (some are faster)
repocheck owner/repo --model gpt-4o
```

### "Empty repository" error

The repository has no files or is completely empty.

**Solutions:**

- Verify the repository has commits
- Check if you're looking at the right branch

### Deep analysis fails with Repomix

**Solutions:**

```bash
# 1. Check if Repomix is working
npx repomix --version

# 2. Try with smaller repository first
/deep small-org/small-repo

# 3. Check disk space (Repomix clones locally)
df -h

# 4. Clear Repomix cache
rm -rf ~/.repomix
```

### "Analysis timeout" error

The analysis took longer than the timeout limit.

**Solutions:**

```bash
# Increase timeout (default: 120000ms = 2 minutes)
repocheck owner/repo --timeout 300000  # 5 minutes

# Use quick analysis for large repos
/analyze owner/repo

# Use a faster model
repocheck owner/repo --model gpt-4o
```

---

## AI Model Issues

### "Model not available"

The selected model isn't available for your subscription.

**Solutions:**

| Model Type | Required Subscription |
|------------|----------------------|
| Free (gpt-4o, gpt-4.1) | Any Copilot plan |
| Premium (claude-*, o3) | Copilot Pro/Business/Enterprise |

```bash
# Switch to a free model
repocheck owner/repo --model gpt-4o
```

### "Copilot session error" or "SDK error"

**Solutions:**

```bash
# 1. Verify Copilot subscription is active
# Check at: github.com/settings/copilot

# 2. Re-authenticate with GitHub
gh auth login

# 3. Clear any cached credentials
gh auth logout
gh auth login

# 4. Restart and try again
```

### Model gives inconsistent results

Different runs may produce slightly different results.

**This is normal because:**
- AI models have some randomness
- Context can affect interpretation
- Network conditions vary

**Tips for consistency:**
- Use the same model each time
- Run analysis multiple times and compare
- Use `/deep` for more thorough analysis

### "Rate limit exceeded" for premium models

Premium models like Opus consume rate limits faster.

**Solutions:**

```bash
# 1. Switch to a lower-cost model
/model claude-sonnet-4  # Instead of opus

# 2. Wait for rate limit to reset

# 3. Use free models for bulk analysis
repocheck owner/repo --model gpt-4o
```

---

## Export Issues

### Exported file has garbled characters

The file encoding might not support emojis.

**Solutions:**

```bash
# RepoCheckAI saves with UTF-8 BOM by default
# If viewing in old editors, try:
# - VS Code (recommended)
# - Notepad++ with UTF-8 encoding
# - Any modern text editor
```

### Can't find exported file

**Default export location:** `~/repocheck/reports/`

```bash
# Check default location
ls ~/repocheck/reports/

# Export to specific location
/export ~/Desktop

# Export with specific filename
/export ./my-report.md
```

### Clipboard copy not working

**Solutions by OS:**

**macOS:**
```bash
# Clipboard should work by default
# If not, check pbcopy is available
which pbcopy
```

**Linux:**
```bash
# Install xclip
sudo apt install xclip  # Debian/Ubuntu
sudo pacman -S xclip    # Arch

# Or xsel
sudo apt install xsel
```

**Windows:**
```bash
# Should work in PowerShell and cmd
# If not, try running as Administrator
```

### Export to JSON shows errors

**Solutions:**

```bash
# Ensure you specify the format
/export ~/Desktop json

# Check the file is valid JSON
cat ~/Desktop/report.json | jq .
```

---

## Performance Issues

### High memory usage

Large repositories can use significant memory during deep analysis.

**Solutions:**

```bash
# Use quick analysis instead
/analyze owner/repo

# Limit files analyzed
repocheck owner/repo --max-files 500

# Close other applications during analysis
```

### Slow on large repositories

**Solutions:**

```bash
# 1. Use quick analysis
/analyze owner/repo

# 2. Increase Node.js memory if needed
NODE_OPTIONS="--max-old-space-size=4096" repocheck owner/repo

# 3. Use faster model
repocheck owner/repo --model gpt-4o
```

### Terminal rendering issues

**Solutions:**

```bash
# 1. Use a modern terminal
# Recommended: iTerm2 (macOS), Windows Terminal, Alacritty

# 2. Check terminal supports UTF-8
echo "🩺"  # Should show stethoscope emoji

# 3. Set terminal encoding to UTF-8
export LANG=en_US.UTF-8
```

---

## Getting Help

### Before asking for help

1. **Check this troubleshooting guide**
2. **Search existing issues:** [github.com/glaucia86/repocheckai/issues](https://github.com/glaucia86/repocheckai/issues)
3. **Read the FAQ:** [faq.md](faq.md)

### Reporting a bug

Create an issue with:

1. **Description** — What happened?
2. **Expected behavior** — What should have happened?
3. **Steps to reproduce** — How can we recreate this?
4. **Environment info:**

```bash
# Include this info
node --version
npm --version
repocheck --version  # If available
```

5. **Error messages** — Full error output
6. **Screenshots** — If visual issue

### Getting support

| Channel | Best For |
|---------|----------|
| [GitHub Issues](https://github.com/glaucia86/repocheckai/issues) | Bug reports |
| [GitHub Discussions](https://github.com/glaucia86/repocheckai/discussions) | Questions, ideas |
| [Twitter @glaucia_lemos86](https://twitter.com/glaucia_lemos86) | Quick questions |

---

## Quick Fixes Cheat Sheet

| Problem | Quick Fix |
|---------|-----------|
| Command not found | `npm link` or use `npx repocheck` |
| Module errors | `rm -rf node_modules && npm install` |
| Auth failure | `export GITHUB_TOKEN=ghp_xxx` |
| Rate limited | Wait 1 hour or use token |
| Timeout | Add `--timeout 300000` |
| Model unavailable | Use `--model gpt-4o` |
| Slow analysis | Use `/analyze` instead of `/deep` |
| Export issues | `/export ~/Desktop` |

---

<p align="center">
  <a href="index.md">← Back to Documentation</a>
</p>



