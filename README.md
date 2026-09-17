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

This repository pins the private
[`harness-validations-org/harness-demo`](https://github.com/harness-validations-org/harness-demo)
coding harness as a Git submodule.

Initialize a fresh checkout and verify the integration:

```bash
git submodule update --init --recursive
npm run harness:install
npm ci
npm run harness:check
npm run harness:doctor
```

Then ask GitHub Copilot:

```text
Use the harness to implement <feature or public GitHub issue>.
```

The project skill generates acceptance scenarios before implementation, runs the repository checks,
uses Playwright for browser evaluation, and preserves public-safe evidence under `harness-runs/`.
See [`plans/harness-demo.md`](plans/harness-demo.md) for the architecture and sample feature backlog.

Copilot CLI discovers the generated skill, scenario-planning agent, and Playwright MCP configuration
from the todo repository's `.github` directory. Updating the submodule requires rerunning
`npm run harness:install` and committing the regenerated adapters.

Copilot cloud agent needs a read-only fine-grained token that can access the private
`harness-validations-org/harness-demo` repository. Store it as `HARNESS_REPO_TOKEN` in this
repository's `copilot` environment so `copilot-setup-steps.yml` can initialize the submodule.
