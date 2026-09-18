# Harness Demo

Harness Demo is a deliberately small coding harness for GitHub Copilot. It gives a target
repository a repeatable workflow:

```text
context -> plan + generated scenarios -> implementation -> deterministic checks + Playwright -> report
```

The harness is designed to be vendored as a reviewed snapshot at `.harness/engine` and invoked through a
Markdown project skill at `.github/skills/harness/SKILL.md`. The Markdown skill is the entry point and
owns the agentic workflow. The JavaScript is deterministic support code only. The project has no
runtime dependencies beyond Node.js 22 or later and Git.

The complete user interface is intentionally small:

```text
/harness Add a feature to edit existing tasks.
/harness Work on issue #12.
```

The harness itself gathers context, generates scenarios before coding, implements, runs deterministic
checks, validates required browser scenarios with Playwright, records evidence, and stops with the
report and diff.

## Commands

Run these from a target repository containing `.harness/config.json`:

```bash
node .harness/engine/bin/install.mjs
node .harness/engine/bin/install.mjs --check
node .harness/engine/bin/harness.mjs doctor
node .harness/engine/bin/harness.mjs init --run edit-tasks --request "Add task editing"
node .harness/engine/bin/harness.mjs context --run edit-tasks --input context.json
node .harness/engine/bin/harness.mjs plan --run edit-tasks --plan plan.json --scenarios scenarios.json
node .harness/engine/bin/harness.mjs evaluate --run edit-tasks
node .harness/engine/bin/harness.mjs evaluate --run edit-tasks --browser-results browser-results.json
node .harness/engine/bin/harness.mjs report --run edit-tasks
node .harness/engine/bin/harness.mjs status --run edit-tasks
```

The Copilot skill owns contextual judgment, planning, implementation, and Playwright interaction.
The Node scripts own repository-safe state, command execution, changed-path checks, and final reporting.

## Project adapters

Copilot does not recursively discover skills, custom agents, or MCP configuration inside a nested
harness directory. `bin/install.mjs` projects the harness-owned adapters into the target repository:

- `.github/skills/harness/SKILL.md`
- `.github/agents/harness-scenario-planner.agent.md`
- `.mcp.json`
- `.harness/installed.json` with source-commit and file hashes

Target repositories ignore these generated files and recreate them locally or during cloud-agent
setup. `--check` detects drift after the vendored snapshot is updated. Installation is explicit rather than a
Git hook: cloning a repository must never silently execute code.

For private GitHub repositories and cloud-agent/Teams demos, a vendored snapshot avoids a second
authenticated clone. The upstream repository remains the source of truth; record the imported revision
in `.harness/engine/UPSTREAM_COMMIT`.

Start a new Copilot CLI session after installing. In an existing session, run `/skills reload` for
the skill; restart the session to ensure newly generated custom-agent and MCP configuration is loaded.

## Public evidence

Run artifacts are intended to be committed by target repositories. Before writing JSON or Markdown,
the harness removes sensitive keys and replaces absolute repository and home-directory paths with
portable placeholders. Do not pass private conversations or raw authenticated MCP payloads as input.

## Non-goals

Version 0.1 does not create branches, commits, pushes, pull requests, or merges. It does not run a
detached orchestration service, manage multiple repositories, or connect to private work systems.
