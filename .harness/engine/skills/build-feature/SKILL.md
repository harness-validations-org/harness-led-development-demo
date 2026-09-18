---
name: build-feature
description: "Build a repository feature through a context, plan, generated-scenario, implementation, and evaluation workflow. Use when a repository's project skill routes a coding task to Harness Demo."
license: MIT
metadata:
  version: "0.1.0"
---

# Build Feature

Use the deterministic harness scripts for state and checks. Use your coding tools and MCP tools for
judgment, implementation, and browser interaction.

## Mandatory outcome

The user supplies only a feature description or issue reference. Without requiring additional
harness-specific instructions:

- Gather issue and repository context.
- Generate acceptance scenarios before changing code.
- Implement the feature and automated tests.
- Run all deterministic checks.
- Test every required browser scenario with Playwright.
- Preserve the run artifacts.
- Perform at most two bounded repair attempts.
- Stop after showing the report and diff.
- Do not commit, push, or open a pull request unless separately requested.

A required scenario that failed, was blocked, or was not run prevents completion.

## Inputs

- The user's feature request or GitHub issue.
- Target repository root, normally the current Git root.
- `.harness/config.json`.
- A lowercase run id that describes the feature.

## Workflow

### 1. Preflight

Run:

```bash
node .harness/engine/bin/harness.mjs doctor
```

Stop if the engine, project config, Node.js, or Git checkout is unavailable.

### 2. Initialize

Choose a stable descriptive run id such as `edit-existing-tasks`. Initialize once:

```bash
node .harness/engine/bin/harness.mjs init --run <id> --request "<repository-safe request>"
```

Never place credentials, private conversation text, authentication headers, or private document
content in the request or later run artifacts.

### 3. Gather and record context

Inspect the repository, relevant tests, and recent behavior. If the request names a GitHub issue
or pull request, use the built-in GitHub MCP tools to retrieve it. Summarize rather than copying raw MCP
payloads.

Create a temporary context JSON object:

```json
{
  "schemaVersion": 1,
  "summary": "Bounded summary of the requested outcome and current implementation.",
  "requirements": ["Observable requirement"],
  "constraints": ["Repository or user constraint"],
  "assumptions": ["Explicit assumption"],
  "openQuestions": [],
  "sources": [
    {
      "type": "github-issue",
      "url": "https://github.com/owner/repo/issues/1",
      "summary": "Public source summary"
    }
  ]
}
```

Record it:

```bash
node .harness/engine/bin/harness.mjs context --run <id> --input <context-file>
```

### 4. Plan and generate scenarios before editing

Create a concise plan JSON:

```json
{
  "schemaVersion": 1,
  "summary": "Implementation approach.",
  "steps": ["Step"],
  "files": ["src/App.tsx"],
  "risks": ["Risk"],
  "allowedPaths": ["src/**"]
}
```

Generate acceptance scenarios independently from the implementation:

```json
{
  "schemaVersion": 1,
  "scenarios": [
    {
      "id": "feature-primary-flow",
      "title": "Primary user flow works",
      "given": ["Initial state"],
      "when": ["User action"],
      "then": ["Observable outcome"],
      "method": "playwright",
      "priority": "required"
    }
  ]
}
```

Include primary behavior, validation/negative behavior, persistence, regressions, accessibility when
relevant, and browser-console expectations. Record both artifacts before changing source:

```bash
node .harness/engine/bin/harness.mjs plan --run <id> --plan <plan-file> --scenarios <scenarios-file>
```

Do not weaken required scenarios after implementation begins. If a requirement genuinely changes,
explain the change in the plan and report.

### 5. Implement

Make precise source and test changes. Preserve unrelated work. Stay within the allowed paths and the
project's changed-file budget. Do not commit, push, or open a pull request unless the user separately
requests it.

### 6. Run deterministic evaluation

Run:

```bash
node .harness/engine/bin/harness.mjs evaluate --run <id>
```

This runs the configured lint, test, and build commands and records path-safety results. A nonzero exit
means the implementation is not ready. A successful checks-only result is `pending-browser`, because
the generated browser scenarios have not yet been executed.

### 7. Execute generated browser scenarios

Start the configured preview command and verify it responds. Use Playwright MCP to execute every
generated scenario. Observe accessibility-visible behavior, persistence after reload, and browser
console errors.

Create temporary results:

```json
{
  "results": [
    {
      "id": "feature-primary-flow",
      "status": "passed",
      "evidence": ["Observed result"]
    }
  ]
}
```

Allowed statuses are `passed`, `failed`, `blocked`, and `not-run`. Do not report a pass without direct
evidence. Merge browser evidence into evaluation:

```bash
node .harness/engine/bin/harness.mjs evaluate --run <id> --browser-results <results-file>
```

Use `--console-errors "<summary>"` if browser errors occurred. Perform at most two bounded repair and
reevaluation attempts.

### 8. Report

Run:

```bash
node .harness/engine/bin/harness.mjs report --run <id>
node .harness/engine/bin/harness.mjs status --run <id>
```

Return the feature outcome, generated scenarios, deterministic checks, Playwright evidence, safety
result, and changed files. Required `blocked` or `not-run` scenarios mean the run is not complete.
