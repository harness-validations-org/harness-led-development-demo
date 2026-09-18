import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const HARNESS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLI = path.join(HARNESS_ROOT, 'bin', 'harness.mjs')

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return result.stdout.trim()
}

test('runs context, plan, checks, browser evidence, and report end to end', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cli-'))
  fs.mkdirSync(path.join(root, '.harness', 'engine', 'bin'), { recursive: true })
  fs.writeFileSync(path.join(root, '.harness', 'engine', 'bin', 'harness.mjs'), '')
  fs.writeFileSync(path.join(root, '.harness', 'config.json'), JSON.stringify({
    schemaVersion: 1,
    project: { name: 'Fixture', type: 'test' },
    commands: {
      lint: 'node -e "process.exit(0)"',
      test: 'node -e "process.exit(0)"',
      build: 'node -e "process.exit(0)"',
    },
    evaluation: {
      browser: 'playwright-mcp',
      baseUrl: 'http://127.0.0.1:4173',
      maxRepairAttempts: 2,
      requireNoConsoleErrors: true,
    },
    safety: {
      allowedPaths: ['harness-runs/**'],
      forbiddenPaths: ['.git/**'],
      maxChangedFiles: 10,
    },
  }, null, 2))
  fs.writeFileSync(path.join(root, 'context-input.json'), JSON.stringify({
    schemaVersion: 1,
    summary: 'Fixture context',
    requirements: ['The scenario passes'],
    constraints: [],
    assumptions: [],
    openQuestions: [],
    sources: [],
  }))
  fs.writeFileSync(path.join(root, 'plan-input.json'), JSON.stringify({
    schemaVersion: 1,
    summary: 'Fixture plan',
    steps: ['Evaluate the fixture'],
    files: [],
    risks: [],
    allowedPaths: ['harness-runs/**'],
  }))
  fs.writeFileSync(path.join(root, 'scenario-input.json'), JSON.stringify({
    schemaVersion: 1,
    scenarios: [{
      id: 'fixture-passes',
      title: 'Fixture passes',
      given: ['A fixture'],
      when: ['It is evaluated'],
      then: ['It passes'],
      method: 'playwright',
      priority: 'required',
    }],
  }))
  fs.writeFileSync(path.join(root, 'browser-input.json'), JSON.stringify({
    results: [{
      id: 'fixture-passes',
      status: 'passed',
      evidence: ['Observed fixture result'],
    }],
  }))

  run('git', ['init', '-q'], root)
  run('git', ['config', 'user.email', 'fixture@example.com'], root)
  run('git', ['config', 'user.name', 'Fixture'], root)
  run('git', ['add', '.'], root)
  run('git', ['commit', '-qm', 'fixture'], root)

  run(process.execPath, [CLI, 'init', '--run', 'fixture-run', '--request', 'Evaluate fixture'], root)
  run(process.execPath, [CLI, 'context', '--run', 'fixture-run', '--input', 'context-input.json'], root)
  run(process.execPath, [
    CLI,
    'plan',
    '--run',
    'fixture-run',
    '--plan',
    'plan-input.json',
    '--scenarios',
    'scenario-input.json',
  ], root)
  assert.equal(run(process.execPath, [CLI, 'evaluate', '--run', 'fixture-run'], root), 'pending-browser')
  assert.equal(run(process.execPath, [
    CLI,
    'evaluate',
    '--run',
    'fixture-run',
    '--browser-results',
    'browser-input.json',
  ], root), 'passed')
  run(process.execPath, [CLI, 'report', '--run', 'fixture-run'], root)

  const evaluation = JSON.parse(fs.readFileSync(
    path.join(root, 'harness-runs', 'fixture-run', 'evaluation.json'),
    'utf8',
  ))
  assert.equal(evaluation.status, 'passed')
  assert.equal(evaluation.scenarios[0].status, 'passed')
  assert.equal(fs.existsSync(path.join(root, 'harness-runs', 'fixture-run', 'report.md')), true)
})
