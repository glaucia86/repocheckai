---
name: go-reliability
title: Go Reliability and Module Hygiene
description: Reliability checks for Go modules with focus on module setup, tests, and CI behavior.
category: stack
applies_to: go
modes: quick,deep
priority: 9
---

## When to Use
Use when `go.mod` exists or Go source dominates the repository.

## Checks
- Verify `go.mod`/`go.sum` consistency and module naming clarity.
- Check test baseline (`go test ./...`) and race detector usage where applicable.
- Check lint/static analysis hints (`golangci-lint`, `staticcheck`).
- Validate CI executes build/test for supported Go versions.

## Evidence Rules
- Quote module name and relevant directives from `go.mod`.
- Reference workflow files and exact test/lint commands.
- In deep mode, cite concrete patterns around error wrapping and context usage.

## Scoring Hints
- Missing tests in production Go service code is usually P1.
- No CI coverage for Go commands is P1 for active repos.
- Inconsistent module setup or outdated version constraints is often P2.

