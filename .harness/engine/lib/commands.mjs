import { spawnSync } from 'node:child_process'

const MAX_SUMMARY = 3000

function summarize(text) {
  const clean = text.trim()
  if (clean.length <= MAX_SUMMARY) return clean
  return `${clean.slice(0, MAX_SUMMARY)}\n... output truncated ...`
}

export function runCommand(command, cwd) {
  const started = Date.now()
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: '1' },
  })
  return {
    command,
    status: result.status === 0 ? 'passed' : 'failed',
    exitCode: result.status,
    durationMs: Date.now() - started,
    stdout: summarize(result.stdout || ''),
    stderr: summarize(result.stderr || ''),
  }
}
