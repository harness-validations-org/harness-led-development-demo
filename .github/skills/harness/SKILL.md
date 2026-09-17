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
9. Do not commit, push, or create a pull request unless the user explicitly requests it. When GitHub
   Copilot cloud agent was directly asked to create a pull request, that request is sufficient.

The harness and run artifacts must not record credentials, authentication headers, private
conversation text, raw MCP responses, absolute machine paths, or hidden model reasoning.
