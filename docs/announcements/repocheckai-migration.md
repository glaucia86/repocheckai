# RepoCheckAI Migration Announcement

Date: 2026-02-17

## Summary

`Repo Check AI` is now `RepoCheckAI`.

- Official npm package: `repocheckai`
- Official CLI command: `repocheck`
- Legacy command in transition: `repodoctor`

## Why We Changed

The new identity aligns product name, package name, and command conventions while keeping continuity for existing users.

## Command Transition Policy

- Effective release: `2.5.0`
- Legacy support window: `2` releases
- Legacy support until: `2.6.x`

During transition:

- `repocheck` is the default and recommended command.
- `repodoctor` still runs, but shows a deprecation warning.

After transition:

- `repodoctor` will be rejected with migration guidance.

## What You Need To Do

1. Update scripts and docs to use `repocheck`.
2. Ensure installation references `npm i -g repocheckai`.
3. Remove hard dependencies on `repodoctor` before the end of the transition window.

## Migration Examples

```bash
# install
npm i -g repocheckai

# old (transition only)
repodoctor analyze owner/repo

# new (recommended)
repocheck analyze owner/repo
```

