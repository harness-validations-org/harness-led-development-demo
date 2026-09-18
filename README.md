# Daymark

Daymark is a focused, responsive todo application for planning daily work without the clutter. It ships with realistic mock tasks, category and date views, search, progress tracking, and browser persistence.

## Features

- Add, complete, and delete tasks
- Organize work by date, category, and priority
- Search tasks and optionally hide completed work
- Track daily completion at a glance
- Keep changes between visits with local storage
- Start with seeded data for immediate testing

## Development

Requires Node.js 22 or later.

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm test
npm run build
```

GitHub Actions runs separate test and production build jobs for pull requests and pushes to `main`.

## Harness-led development

This repository vendors a snapshot of the private
[`harness-validations-org/harness-demo`](https://github.com/harness-validations-org/harness-demo)
coding harness under `.harness/engine`.

Initialize a fresh checkout and verify the integration:

```bash
npm run harness:setup
```

Start Copilot from the repository root:

```bash
copilot
```

Then enter:

```text
/harness We need to add a feature to edit existing tasks.
```

or:

```text
/harness Work on issue #12.
```

The project skill generates acceptance scenarios before implementation, runs the repository checks,
uses Playwright for browser evaluation, and preserves public-safe evidence under `harness-runs/`.
See [`plans/harness-demo.md`](plans/harness-demo.md) for the architecture and sample feature backlog.

The Markdown skill is the harness entry point. The JavaScript files in the vendored engine are deterministic
helpers for installation, validation, checks, and artifact recording; they do not define the agentic
workflow.

The orchestration instructions live in:

- Generated entry/router: `.github/skills/harness/SKILL.md`
- Authoritative workflow: `.harness/engine/skills/build-feature/SKILL.md`
- Independent scenario-planning instructions:
  `.github/agents/harness-scenario-planner.agent.md`

The user does not need to specify context gathering, planning, scenario generation, testing,
Playwright evaluation, artifact recording, repair limits, or Git restrictions. Those requirements are
part of the harness orchestration contract.

Copilot CLI discovers the generated skill, scenario-planning agent, and Playwright MCP configuration
from the todo repository root. The small `.github/skills/harness/SKILL.md` router is committed so
GitHub cloud agent can discover it before setup begins. The optional scenario-planning agent,
Playwright CLI MCP configuration, and install provenance are ignored and recreated with
`npm run harness:install`. After updating the vendored snapshot, rerun the installer, commit any
router update, and start a new Copilot CLI session.

The upstream harness commit is recorded in `.harness/engine/UPSTREAM_COMMIT`. Import a reviewed update
from a clean checkout with:

```bash
git subtree pull --prefix=.harness/engine \
  https://github.com/harness-validations-org/harness-demo.git main --squash
```
