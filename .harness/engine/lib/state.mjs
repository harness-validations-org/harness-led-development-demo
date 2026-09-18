import fs from 'node:fs'
import path from 'node:path'
import { writeJson, writeText } from './files.mjs'

export function validateRunId(runId) {
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(runId)) {
    throw new Error('Run id must be 2-64 lowercase letters, numbers, or hyphens')
  }
  return runId
}

export function runsRoot(repoRoot) {
  return path.join(repoRoot, 'harness-runs')
}

export function runDir(repoRoot, runId) {
  return path.join(runsRoot(repoRoot), validateRunId(runId))
}

export function initializeRun({ repoRoot, runId, request, startCommit, harnessCommit }) {
  const directory = runDir(repoRoot, runId)
  if (fs.existsSync(directory)) throw new Error(`Run already exists: harness-runs/${runId}`)
  fs.mkdirSync(directory, { recursive: true })
  writeText(path.join(directory, 'request.md'), `# Request\n\n${request.trim()}\n`)
  writeJson(path.join(directory, 'run.json'), {
    schemaVersion: 1,
    runId,
    status: 'initialized',
    startCommit,
    harnessCommit,
  })
  return directory
}

export function updateRun(directory, patch) {
  const file = path.join(directory, 'run.json')
  const current = JSON.parse(fs.readFileSync(file, 'utf8'))
  writeJson(file, { ...current, ...patch })
}
