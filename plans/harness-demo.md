# Harness Demo Plan

## Goal

Build a small, GitHub-native coding harness that can implement features in the Daymark todo
application through a repeatable context, plan, generate, and evaluate workflow.

The first validation path is GitHub Copilot CLI in a local checkout. The second path is GitHub Copilot
cloud agent, including invocation through the GitHub integration in Microsoft Teams. Both paths must
use the same repository skill, harness version, project configuration, generated scenarios, and
evaluation contract.

## Decisions

- The reusable harness will live in a separate private repository:
  `harness-validations-org/harness-demo`.
- Its preferred sibling checkout is `../harness-demo`.
- The todo repository will consume the harness as a Git submodule at `.harness/engine`.
- The project skill will be named `harness`.
- The harness installer will project ignored, host-discoverable adapters into the todo repository:
  `.github/skills/harness/SKILL.md`, `.github/agents/*.agent.md`, and `.mcp.json`.
- The generated router will resolve the pinned harness engine from `.harness/engine`.
- Setup will be explicit, idempotent, and drift-checkable through `npm run harness:install` and
  `npm run harness:check`. It will not depend on a Git hook that silently executes after clone.
- `npm run harness:setup` will provide the one-command local bootstrap by initializing the submodule,
  installing app dependencies, projecting adapters, checking drift, and running the doctor.
- Generated host adapters will not be committed. Generated run state and evidence will be committed
  for future comparison and analysis.
- Run artifacts must be public-safe: no credentials, tokens, private URLs, raw authentication
  headers, machine-specific absolute paths, or private conversation content.
- The initial harness will not manage commits, pushes, pull requests, merges, reviewers, or releases.
  Copilot will stop after implementation and evaluation unless the user separately requests Git
  operations.
- The harness will use only GitHub capabilities and local development tools. It will not
  contain organization-specific or enterprise work-system integrations.

## Repository Layout

### Harness repository: `harness-validations-org/harness-demo`

```text
README.md
LICENSE
package.json
bin/
  harness.mjs
  install.mjs
lib/
  config.mjs
  git.mjs
  state.mjs
  commands.mjs
  sanitize.mjs
schemas/
  project-config.schema.json
  context.schema.json
  plan.schema.json
  scenarios.schema.json
  evaluation.schema.json
skills/
  build-feature/
    SKILL.md
templates/
  project/
    .github/
      skills/harness/SKILL.md
      agents/harness-scenario-planner.agent.md
    .mcp.json
test/
  config.test.mjs
  state.test.mjs
  sanitize.test.mjs
  evaluate.test.mjs
```

The harness should use Node.js standard-library modules where practical. Avoid adding a framework,
database, service, detached orchestration runtime, or package-distribution system in the first
version.

### Todo repository integration

```text
.github/
  skills/
    harness/
      SKILL.md              # generated and ignored
  agents/
    harness-scenario-planner.agent.md  # generated and ignored
  workflows/
    copilot-setup-steps.yml
.mcp.json                   # generated and ignored CLI MCP configuration
.harness/
  engine/                  # private Git submodule
  config.json              # Daymark project contract
  installed.json           # generated and ignored provenance
harness-runs/
  <run-id>/
    request.md
    context.json
    plan.json
    scenarios.json
    scenarios.md
    evaluation.json
    report.md
plans/
  harness-demo.md
.gitmodules
```

`harness-runs/` is intentionally committed. Generated files should use stable formatting and avoid
timestamps or machine-specific data unless that data is necessary to understand a run.

## Project Skill

The todo repository will expose one project skill:

```text
.github/skills/harness/SKILL.md
```

Example invocation:

```text
/harness Work on issue #12.
```

or:

```text
/harness We need to add a feature to edit existing tasks.
```

These are complete prompts. The user should not need to reference this plan or repeat the harness
workflow. The generated skill owns context gathering, scenario generation before coding,
implementation, deterministic checks, Playwright evaluation, artifact preservation, repair limits,
and the default prohibition on commit or push.

The project skill is a generated router. It must:

1. Verify that `.harness/engine` is initialized.
2. Read `.harness/engine/skills/build-feature/SKILL.md`.
3. Load `.harness/config.json`.
4. Start or resume a run under `harness-runs/`.
5. Follow the context, plan, generate, and evaluate phases.
6. Stop with an explicit report and changed-file summary.
7. Avoid commit, push, or pull-request actions unless separately requested.

If the submodule is missing or projected adapters are stale, the skill should stop with:

```bash
git submodule update --init --recursive
npm run harness:install
```

Copilot does not recursively discover a submodule's skills, custom agents, or MCP configuration.
The installer copies only these required host adapters into the target working tree and records their
source hashes. They are ignored rather than committed. Harness implementation stays pinned in the
submodule, and the committed setup workflow regenerates the adapters before cloud-agent execution.

The harness entry point is the generated Markdown skill, not a JavaScript executable. The authoritative
agentic workflow lives in `.harness/engine/skills/build-feature/SKILL.md`. JavaScript is limited to
deterministic support such as projecting adapters, validating configuration, running declared commands,
sanitizing artifacts, and checking path budgets.

The generated `.mcp.json` configures Playwright for Copilot CLI after the repository is trusted.
GitHub Copilot cloud agent uses the repository's GitHub settings instead; its built-in GitHub and
Playwright MCP servers remain enabled without duplicating them in the settings JSON. If future harness
versions require custom MCP servers, the harness manifest will declare them, the installer will
generate the CLI configuration, and the repository administrator will explicitly add the equivalent
cloud configuration and secrets.

## Workflow

### 1. Context

Inputs may be:

- A plain-language feature request.
- A public GitHub issue in the todo repository.
- Follow-up instructions supplied in the current Copilot or Teams conversation.

The context phase will:

- Inspect the current repository structure and relevant implementation.
- Read the project contract and existing tests.
- Use the built-in GitHub MCP server when a GitHub issue or pull request is provided.
- Optionally consult a configured public documentation MCP server.
- Record a summarized, sanitized context artifact in `context.json`.
- Record the source type and public URL for externally retrieved evidence.
- Distinguish requirements, assumptions, constraints, and open questions.

Raw MCP responses should not be committed. The committed context is a bounded summary with source
provenance.

### 2. Plan and Scenario Generation

Scenario generation is a required and demo-visible part of planning.

Before code changes, the harness will generate:

- `plan.json`: scope, likely files, implementation steps, risks, commands, and allowed paths.
- `scenarios.json`: machine-readable acceptance scenarios.
- `scenarios.md`: a readable rendering used in the run report and pull-request discussion.

Scenarios should cover:

- Primary user behavior.
- Negative and validation behavior.
- Persistence or reload behavior.
- Regression behavior for existing features.
- Accessibility and keyboard behavior when relevant.
- Browser-console and runtime-error expectations.

Each scenario will contain:

```json
{
  "id": "edit-task-persists",
  "title": "Edited task persists after reload",
  "given": ["A seeded task exists"],
  "when": ["The user edits its title and saves", "The page is reloaded"],
  "then": ["The edited title is displayed", "The stored todo contains the edited title"],
  "method": "playwright",
  "priority": "required"
}
```

The scenarios become the acceptance contract for evaluation. The implementation phase may read their
intent, but it must not silently weaken or delete required scenarios to make a result pass. Any scenario
change after generation must be recorded in the plan and report with a reason.

### 3. Generate

Copilot will:

- Implement the approved plan.
- Add or update unit tests.
- Follow existing application patterns and accessibility conventions.
- Keep changes inside the plan's allowed paths.
- Preserve unrelated working-tree changes.
- Record material deviations from the plan.

The first version will run in the current checkout rather than creating worktrees. A later version may
add an optional worktree mode after the basic flow is proven.

### 4. Evaluate

The deterministic evaluator will run the commands declared by `.harness/config.json`, initially:

```bash
npm ci
npm run lint
npm test
npm run build
```

Copilot will then use Playwright MCP against the production preview to execute the generated browser
scenarios. Evaluation records:

- Command, exit code, and concise output summary.
- Scenario status: `passed`, `failed`, `blocked`, or `not-run`.
- Observable evidence for each scenario.
- Browser console errors and warnings.
- Changed paths and diff-budget checks.
- Any repair attempts and their outcomes.

The harness may perform at most two bounded repair attempts. It must not report success when a required
scenario is blocked or not run.

## Committed Run Evidence

Committed run artifacts make harness behavior reviewable over time, but they must remain concise and
safe for the repositories' intended audience.

Include:

- Original public request or a sanitized summary.
- Public source URLs.
- Generated plan and scenarios.
- Tool and command names.
- Exit statuses and summarized evidence.
- Final changed-file list.
- Scenario-level results.
- Harness submodule commit.
- Todo repository starting and ending commits when available.

Exclude:

- Tokens, cookies, credentials, authentication headers, or environment dumps.
- Private conversation text.
- Non-public repository or document content.
- Absolute home-directory paths.
- Full dependency-install logs.
- Full MCP payloads.
- Hidden model reasoning.

## Initial Daymark Configuration

`.harness/config.json` should initially declare:

```json
{
  "schemaVersion": 1,
  "project": {
    "name": "Daymark",
    "type": "react-vite"
  },
  "commands": {
    "install": "npm ci",
    "lint": "npm run lint",
    "test": "npm test",
    "build": "npm run build",
    "serve": "npm run preview -- --host 127.0.0.1 --port 4173"
  },
  "evaluation": {
    "baseUrl": "http://127.0.0.1:4173",
    "browser": "playwright-mcp",
    "maxRepairAttempts": 2,
    "requireNoConsoleErrors": true
  },
  "safety": {
    "allowedPaths": [
      "src/**",
      "public/**",
      "package.json",
      "package-lock.json",
      "README.md",
      "harness-runs/**"
    ],
    "forbiddenPaths": [
      ".git/**",
      ".harness/engine/**"
    ],
    "maxChangedFiles": 12
  }
}
```

The committed workflow and skill files may be changed only when the feature request explicitly targets
the harness integration.

## Local CLI Validation

The first end-to-end validation will run from the todo repository:

1. Initialize the private submodule using the developer's GitHub credentials.
2. Run `npm run harness:setup`.
3. Start Copilot CLI from the repository root.
4. Invoke the `/harness` project skill with a feature request.
5. Review the generated plan and scenarios.
6. Allow Copilot to implement the feature.
7. Run deterministic checks and Playwright scenarios.
8. Review the committed-ready run evidence and source diff.
9. Commit only after human review.

## GitHub Cloud Agent and Teams Validation

The same project skill must work when GitHub Copilot cloud agent is started from GitHub or through the
GitHub integration in Microsoft Teams.

The todo repository will include `.github/workflows/copilot-setup-steps.yml` to:

- Use a supported Node.js version.
- Initialize the private `.harness/engine` submodule.
- Run `npm run harness:setup`, which installs dependencies, projects adapters, checks drift, and runs
  the doctor.

Because both repositories are private, the setup job needs a read-only fine-grained token or GitHub
App token that can read `harness-validations-org/harness-demo`. Store it as a
`HARNESS_REPO_TOKEN` secret in the todo repository's `copilot` environment and pass it to
`actions/checkout` as the submodule checkout token. Local CLI users can rely on their existing GitHub
credentials.

The Teams test should use only a public or synthetic feature discussion. The prompt should identify the
repository when it is not already configured as the conversation's default:

```text
@GitHub Use the repository harness to implement the task-editing feature discussed in this thread.
Follow the generated scenarios and create a pull request.
repo=harness-validations-org/harness-led-development-demo
```

The cloud run should demonstrate that it:

- Discovers `.github/skills/harness/SKILL.md`.
- Resolves the pinned private harness submodule.
- Generates and preserves scenarios before implementation.
- Builds and tests the application.
- Uses Playwright MCP for browser validation.
- Commits the sanitized run evidence alongside the feature.
- Creates a reviewable GitHub pull request.

## MCP Configuration

No custom repository MCP server is required for the first version.

GitHub enables the GitHub MCP server and Playwright MCP server by default for Copilot cloud agent:

- GitHub MCP supplies issue, pull-request, and repository context.
- Playwright MCP supplies browser automation and UI evidence.

The repository MCP settings can therefore remain:

```json
{
  "mcpServers": {}
}
```

An optional documentation MCP server may be added later to demonstrate custom MCP context. It
must be unauthenticated or use a repository Agents secret prefixed with `COPILOT_MCP_`, expose only the
required read-only tools, and never be required for the core workflow.

## First Feature

The recommended first harness-built feature is editing existing tasks.

Expected generated scenarios should include:

- Open the editor from a task.
- Change title, notes, category, priority, and due date.
- Prevent saving an empty title.
- Cancel without changing the task.
- Save and immediately display the updated values.
- Reload and verify persistence.
- Close with Escape and restore focus.
- Preserve add, complete, filter, and delete behavior.
- Produce no browser-console errors.

This feature is small enough for a reliable demo while exercising context gathering, scenario
generation, implementation, unit tests, persistence, accessibility, and Playwright evaluation.

## Sample Feature Backlog

These public, synthetic feature briefs are intentionally small enough for a Copilot CLI or cloud-agent
session. Each can be copied into a GitHub issue and then implemented with:

```text
/harness Work on issue #<number>.
```

### Feature 1: Edit existing tasks

**User outcome:** A user can correct or expand an existing task without deleting and recreating it.

**Seed requirements:**

- Add an accessible Edit action to every task.
- Allow editing title, notes, category, priority, and due date.
- Reject an empty title.
- Support Save, Cancel, and Escape.
- Restore focus to the initiating Edit control when the editor closes.
- Persist saved values after reload.
- Preserve completion and deletion behavior.

**Harness coverage:** Forms, validation, keyboard behavior, focus management, local-storage
persistence, unit tests, and Playwright.

### Feature 2: Overdue tasks

**User outcome:** A user can immediately see which incomplete tasks are overdue.

**Seed requirements:**

- Mark incomplete tasks with a due date before today as overdue.
- Show a readable `Overdue` label rather than relying on color alone.
- Sort overdue tasks before tasks due today in the Today view.
- Never mark completed tasks overdue.
- Keep Upcoming behavior unchanged.
- Handle local dates without UTC day shifts.

**Harness coverage:** Date boundaries, deterministic sorting, accessible visual status, regression
scenarios, and browser clock assumptions.

### Feature 3: Undo deletion

**User outcome:** A user can recover a task deleted by mistake.

**Seed requirements:**

- Show an undo notification immediately after deleting a task.
- Restore the exact task data and list position when Undo is selected.
- Allow only the most recently deleted task to be restored.
- Dismiss the notification after a short timeout.
- Make the notification and action accessible to keyboard and screen-reader users.
- Ensure a deletion remains deleted after reload when it was not undone.

**Harness coverage:** Temporary state, timers, ordering, accessibility, persistence, and Playwright
timing.

### Feature 4: Import and export todos

**User outcome:** A user can back up tasks and restore them in another browser.

**Seed requirements:**

- Export all todos as a versioned JSON file.
- Import a valid exported file and replace the current todos only after confirmation.
- Validate every imported todo and reject malformed or unsupported data.
- Display a clear error without changing current data when import fails.
- Preserve categories, priorities, notes, dates, and completion state.
- Add unit tests for valid, invalid, and unsupported versions.

**Harness coverage:** File interaction, schema validation, destructive-action confirmation, error
handling, and browser upload/download behavior.

### Feature 5: Tags and saved filters

**User outcome:** A user can organize tasks across categories using multiple tags and quickly return
to a useful filter.

**Seed requirements:**

- Add and remove free-form tags while creating or editing a task.
- Filter tasks by one or more tags.
- Save the current search, category, completion, and tag filters under a user-provided name.
- Restore and delete saved filters.
- Persist tags and saved filters locally.
- Keep existing category counts and views correct.

**Harness coverage:** Data-model evolution, compound filtering, persistence migration, complex
interaction scenarios, and regression testing.

### Feature 6: Recurring tasks

**User outcome:** A user can automatically create the next occurrence when completing a repeating
task.

**Seed requirements:**

- Support daily, weekly, and monthly recurrence.
- Create the next occurrence only when the current task changes from active to completed.
- Preserve title, notes, category, priority, and recurrence settings.
- Handle month ends predictably.
- Avoid duplicate next occurrences when a completed task is toggled repeatedly.
- Clearly display recurrence in task metadata.

**Harness coverage:** State transitions, date calculations, idempotency, persistence, and generated
edge-case scenarios.

### Recommended execution order

1. Edit existing tasks.
2. Overdue tasks.
3. Undo deletion.
4. Import and export.
5. Tags and saved filters.
6. Recurring tasks.

The first three should establish whether the harness reliably generates useful scenarios and closes
the plan-to-browser-evidence loop. The later features deliberately increase data-model and validation
complexity.

## Delivery Stages

1. Create the private `harness-validations-org/harness-demo` repository and sibling checkout.
2. Implement the zero- or minimal-dependency harness core and its unit tests.
3. Add the submodule and project skill to the todo repository.
4. Add the Daymark harness configuration and cloud-agent setup workflow.
5. Validate the task-editing feature locally through Copilot CLI.
6. Review and commit the generated run artifacts.
7. Validate the same feature path through GitHub Copilot cloud agent.
8. Invoke the flow through the GitHub integration in Teams and compare the evidence.

## Non-Goals for Version One

- Multiple target repositories in one run.
- Private or enterprise data sources.
- Long-running detached execution.
- Autonomous Git or pull-request lifecycle management.
- Reviewer automation or merge management.
- Blind model judging or hidden acceptance criteria.
- Learning systems, memory stores, personas, scorecards, or telemetry services.
- Deployment, release, or production operations.
