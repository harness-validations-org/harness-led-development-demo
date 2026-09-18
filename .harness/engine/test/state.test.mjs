import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { initializeRun, validateRunId } from '../lib/state.mjs'

test('validates stable run ids', () => {
  assert.equal(validateRunId('edit-existing-tasks'), 'edit-existing-tasks')
  assert.throws(() => validateRunId('../escape'), /Run id/)
})

test('initializes repository-safe run artifacts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-demo-'))
  const directory = initializeRun({
    repoRoot: root,
    runId: 'edit-tasks',
    request: 'Add editing',
    startCommit: 'abc',
    harnessCommit: 'def',
  })
  assert.equal(fs.existsSync(path.join(directory, 'request.md')), true)
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'run.json'))).status, 'initialized')
})
