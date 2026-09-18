#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { parseArgs, requireArg } from '../lib/args.mjs'
import { runCommand } from '../lib/commands.mjs'
import { findRepoRoot, loadConfig } from '../lib/config.mjs'
import { readJson, requireFile, writeJson, writeText } from '../lib/files.mjs'
import { changedPaths, harnessCommit, headCommit } from '../lib/git.mjs'
import { matchesAny } from '../lib/match.mjs'
import { sanitize } from '../lib/sanitize.mjs'
import { initializeRun, runDir, updateRun } from '../lib/state.mjs'
import { installProject } from '../lib/install.mjs'

const [command = 'help', ...rest] = process.argv.slice(2)
const args = parseArgs(rest)

function resolveRepo() {
  return findRepoRoot(typeof args.repo === 'string' ? args.repo : process.cwd())
}

function resolveRun(repoRoot) {
  return runDir(repoRoot, requireArg(args, 'run'))
}

function loadScenarios(directory) {
  const file = path.join(directory, 'scenarios.json')
  return fs.existsSync(file) ? readJson(file).scenarios || [] : []
}

function scenarioMarkdown(scenarios) {
  const sections = ['# Generated Scenarios', '']
  for (const scenario of scenarios) {
    sections.push(`## ${scenario.id}: ${scenario.title}`, '')
    sections.push(`**Priority:** ${scenario.priority || 'required'}  `)
    sections.push(`**Method:** ${scenario.method || 'playwright'}`, '')
    for (const key of ['given', 'when', 'then']) {
      sections.push(`**${key[0].toUpperCase()}${key.slice(1)}**`)
      for (const item of scenario[key] || []) sections.push(`- ${item}`)
      sections.push('')
    }
  }
  return sections.join('\n')
}

function validateContext(context) {
  if (context?.schemaVersion !== 1) throw new Error('context.schemaVersion must be 1')
  if (!context.summary) throw new Error('context.summary is required')
  for (const key of ['requirements', 'constraints', 'assumptions', 'openQuestions', 'sources']) {
    if (!Array.isArray(context[key])) throw new Error(`context.${key} must be an array`)
  }
}

function validatePlan(plan, scenarios) {
  if (plan?.schemaVersion !== 1) throw new Error('plan.schemaVersion must be 1')
  if (!plan.summary) throw new Error('plan.summary is required')
  for (const key of ['steps', 'files', 'risks', 'allowedPaths']) {
    if (!Array.isArray(plan[key])) throw new Error(`plan.${key} must be an array`)
  }
  if (!Array.isArray(scenarios?.scenarios) || scenarios.scenarios.length === 0) {
    throw new Error('scenarios.scenarios must be a non-empty array')
  }
  for (const scenario of scenarios.scenarios) {
    for (const key of ['id', 'title', 'method', 'priority']) {
      if (!scenario[key]) throw new Error(`Every scenario requires ${key}`)
    }
    for (const key of ['given', 'when', 'then']) {
      if (!Array.isArray(scenario[key]) || scenario[key].length === 0) {
        throw new Error(`Scenario ${scenario.id} requires a non-empty ${key} array`)
      }
    }
  }
}

function doctor() {
  const repoRoot = resolveRepo()
  const config = loadConfig(repoRoot)
  const major = Number(process.versions.node.split('.')[0])
  const checks = [
    { name: 'node', ok: major >= 22, detail: process.version },
    { name: 'git repository', ok: Boolean(headCommit(repoRoot)), detail: headCommit(repoRoot) || 'no commit' },
    { name: 'project config', ok: true, detail: path.relative(repoRoot, config.__path) },
    {
      name: 'harness engine',
      ok: fs.existsSync(path.join(repoRoot, '.harness', 'engine', 'bin', 'harness.mjs')),
      detail: '.harness/engine/bin/harness.mjs',
    },
  ]
  const adapters = installProject({ targetRoot: repoRoot, check: true })
  checks.push({
    name: 'project adapters',
    ok: adapters.ok,
    detail: adapters.ok
      ? `${adapters.files.length} generated files current`
      : adapters.files.filter((file) => file.status !== 'current').map((file) => file.path).join(', '),
  })
  for (const check of checks) console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`)
  if (checks.some((check) => !check.ok)) process.exitCode = 1
}

function install() {
  const repoRoot = resolveRepo()
  const result = installProject({ targetRoot: repoRoot, check: Boolean(args.check) })
  for (const file of result.files) {
    console.log(`${file.status.toUpperCase()} ${file.path}`)
  }
  if (!result.ok) {
    console.error('Harness project adapters are missing or stale. Run the install command without --check.')
    process.exitCode = 1
  }
}

function init() {
  const repoRoot = resolveRepo()
  loadConfig(repoRoot)
  const runId = requireArg(args, 'run')
  const request = typeof args.request === 'string'
    ? args.request
    : fs.readFileSync(requireFile(requireArg(args, 'request-file'), 'request file'), 'utf8')
  const directory = initializeRun({
    repoRoot,
    runId,
    request: sanitize(request, repoRoot),
    startCommit: headCommit(repoRoot),
    harnessCommit: harnessCommit(repoRoot),
  })
  console.log(path.relative(repoRoot, directory))
}

function context() {
  const repoRoot = resolveRepo()
  const directory = resolveRun(repoRoot)
  const input = readJson(requireFile(requireArg(args, 'input'), 'context input'))
  validateContext(input)
  writeJson(path.join(directory, 'context.json'), sanitize(input, repoRoot))
  updateRun(directory, { status: 'context-recorded' })
}

function plan() {
  const repoRoot = resolveRepo()
  const directory = resolveRun(repoRoot)
  requireFile(path.join(directory, 'context.json'), 'recorded context')
  const planInput = readJson(requireFile(requireArg(args, 'plan'), 'plan input'))
  const scenarioInput = readJson(requireFile(requireArg(args, 'scenarios'), 'scenarios input'))
  validatePlan(planInput, scenarioInput)
  const cleanPlan = sanitize(planInput, repoRoot)
  const cleanScenarios = sanitize(scenarioInput, repoRoot)
  writeJson(path.join(directory, 'plan.json'), cleanPlan)
  writeJson(path.join(directory, 'scenarios.json'), cleanScenarios)
  writeText(path.join(directory, 'scenarios.md'), scenarioMarkdown(cleanScenarios.scenarios))
  updateRun(directory, { status: 'planned' })
}

function safetyResult(config, paths) {
  const forbidden = paths.filter((file) => matchesAny(file, config.safety.forbiddenPaths))
  const outsideAllowed = paths.filter((file) => !matchesAny(file, config.safety.allowedPaths))
  return {
    status: forbidden.length === 0
      && outsideAllowed.length === 0
      && paths.length <= config.safety.maxChangedFiles
      ? 'passed'
      : 'failed',
    changedFiles: paths.length,
    maxChangedFiles: config.safety.maxChangedFiles,
    forbidden,
    outsideAllowed,
  }
}

function evaluate() {
  const repoRoot = resolveRepo()
  const config = loadConfig(repoRoot)
  const directory = resolveRun(repoRoot)
  requireFile(path.join(directory, 'plan.json'), 'recorded plan')
  const scenarios = loadScenarios(directory)
  const commandNames = [
    ...(args['include-install'] && config.commands.install ? ['install'] : []),
    'lint',
    'test',
    'build',
  ]
  const commands = commandNames.map((name) => ({
    name,
    ...runCommand(config.commands[name], repoRoot),
  }))
  let browserResults = []
  if (typeof args['browser-results'] === 'string') {
    const input = readJson(requireFile(args['browser-results'], 'browser results'))
    browserResults = Array.isArray(input.results) ? input.results : []
  }
  const byId = new Map(browserResults.map((result) => [result.id, result]))
  const scenarioResults = scenarios.map((scenario) => {
    const result = byId.get(scenario.id)
    return result
      ? sanitize({ id: scenario.id, title: scenario.title, priority: scenario.priority, ...result }, repoRoot)
      : {
          id: scenario.id,
          title: scenario.title,
          priority: scenario.priority,
          status: 'not-run',
          evidence: [],
        }
  })
  const safety = safetyResult(config, changedPaths(repoRoot))
  const hasBrowserResults = browserResults.length > 0
  const requiredScenariosPass = scenarioResults
    .filter((scenario) => scenario.priority === 'required')
    .every((scenario) => scenario.status === 'passed')
  const deterministicChecksPass = commands.every((result) => result.status === 'passed')
    && safety.status === 'passed'
  const status = !deterministicChecksPass
    ? 'failed'
    : hasBrowserResults && requiredScenariosPass
      ? 'passed'
      : hasBrowserResults
        ? 'failed'
        : 'pending-browser'
  writeJson(path.join(directory, 'evaluation.json'), sanitize({
    schemaVersion: 1,
    status,
    commands,
    safety,
    scenarios: scenarioResults,
    console: {
      status: browserResults.length ? (args['console-errors'] ? 'failed' : 'passed') : 'not-run',
      errors: args['console-errors'] ? [args['console-errors']] : [],
    },
  }, repoRoot))
  updateRun(directory, {
    status: status === 'passed'
      ? 'evaluated'
      : status === 'pending-browser'
        ? 'checks-passed'
        : 'evaluation-failed',
  })
  console.log(status)
  if (status === 'failed') process.exitCode = 1
}

function report() {
  const repoRoot = resolveRepo()
  const directory = resolveRun(repoRoot)
  const request = fs.readFileSync(requireFile(path.join(directory, 'request.md')), 'utf8').trim()
  const contextData = readJson(requireFile(path.join(directory, 'context.json')))
  const planData = readJson(requireFile(path.join(directory, 'plan.json')))
  const evaluation = readJson(requireFile(path.join(directory, 'evaluation.json')))
  const lines = [
    '# Harness Run Report',
    '',
    `**Status:** ${evaluation.status}`,
    '',
    request,
    '',
    '## Context',
    '',
    contextData.summary,
    '',
    '## Plan',
    '',
    planData.summary,
    '',
    ...planData.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Deterministic checks',
    '',
    '| Check | Status | Exit code |',
    '|---|---|---:|',
    ...evaluation.commands.map((item) => `| ${item.name} | ${item.status} | ${item.exitCode} |`),
    '',
    '## Generated scenario results',
    '',
    '| Scenario | Priority | Status |',
    '|---|---|---|',
    ...evaluation.scenarios.map((item) => `| ${item.id} | ${item.priority} | ${item.status} |`),
    '',
    '## Safety',
    '',
    `- Status: ${evaluation.safety.status}`,
    `- Changed files: ${evaluation.safety.changedFiles}/${evaluation.safety.maxChangedFiles}`,
    `- Outside allowed paths: ${evaluation.safety.outsideAllowed.join(', ') || 'none'}`,
    `- Forbidden paths: ${evaluation.safety.forbidden.join(', ') || 'none'}`,
    '',
  ]
  writeText(path.join(directory, 'report.md'), lines.join('\n'))
  updateRun(directory, { status: 'reported', result: evaluation.status, endCommit: headCommit(repoRoot) })
}

function status() {
  const repoRoot = resolveRepo()
  const directory = resolveRun(repoRoot)
  const run = readJson(requireFile(path.join(directory, 'run.json')))
  console.log(JSON.stringify({
    ...run,
    files: fs.readdirSync(directory).sort(),
  }, null, 2))
}

function help() {
  console.log(`Harness Demo

Usage: node .harness/engine/bin/harness.mjs <command> [options]

Commands:
  doctor
  install [--check]
  init --run <id> (--request <text> | --request-file <file>)
  context --run <id> --input <context.json>
  plan --run <id> --plan <plan.json> --scenarios <scenarios.json>
  evaluate --run <id> [--include-install] [--browser-results <results.json>] [--console-errors <text>]
  report --run <id>
  status --run <id>
`)
}

const commands = { doctor, install, init, context, plan, evaluate, report, status, help }

try {
  const handler = commands[command]
  if (!handler) throw new Error(`Unknown command: ${command}`)
  handler()
} catch (error) {
  console.error(`ERROR: ${error.message}`)
  process.exitCode = 1
}
