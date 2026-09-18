---
name: harness
description: "Build a repository feature through the pinned Harness Demo context, plan, generated-scenario, implementation, and Playwright evaluation workflow. Use when the user says 'use the harness', requests harness-led feature development, or asks to implement a GitHub issue through the harness."
license: MIT
metadata:
  version: "0.1.0"
  source: ".harness/engine"
---

# Harness

This repository pins its reusable harness at `.harness/engine`.

## User interface

The complete user-facing invocation is:

```text
/harness <feature request>
```

or:

```text
/harness Work on issue #<number>
```

Treat all text after `/harness` as the request. Do not require the user to repeat workflow mechanics,
name plan files, describe testing steps, or provide harness-specific flags.

## Orchestration contract

For every request:

1. Gather repository context and, when an issue is named, retrieve the issue and relevant public
   GitHub context.
2. Generate and record acceptance scenarios before changing application code.
3. Implement the feature and its automated tests.
4. Run every deterministic check declared in `.harness/config.json`.
5. Use Playwright to execute every required browser scenario and check the browser console.
6. Preserve repository-safe context, plan, scenarios, evaluation evidence, and the final report under
   `harness-runs/<run-id>/`.
7. Perform at most two bounded repair and reevaluation attempts.
8. Stop after showing the outcome, report, and source diff.
9. Do not commit, push, or open a pull request unless the user separately and explicitly requests it.

Required scenarios that are failed, blocked, or not run mean the harness run is not complete.

## Bootstrap and execution

1. Verify `.harness/engine/skills/build-feature/SKILL.md` exists. If it does not, stop and instruct:

   ```bash
   git submodule update --init --recursive
   npm run harness:install
   ```

2. Run `npm run harness:check` and stop if generated project adapters are stale.
3. Read `.harness/config.json`.
4. Read `.harness/engine/skills/build-feature/SKILL.md`.
5. Follow that skill's workflow exactly for the user's feature request.
6. Ask the `harness-scenario-planner` custom agent for an independent scenario draft when it is
   available. The main agent owns the final plan and must reconcile the draft with repository evidence.
7. Generate and record acceptance scenarios before changing application code.
8. Preserve repository-safe artifacts under `harness-runs/<run-id>/` with the feature changes.

The harness and run artifacts must not record credentials, authentication headers, private
conversation text, raw MCP responses, absolute machine paths, or hidden model reasoning.
