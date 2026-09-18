import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { installProject } from '../lib/install.mjs'

test('installs and checks project adapters', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-install-'))
  fs.mkdirSync(path.join(root, '.git'))

  const installed = installProject({ targetRoot: root })
  assert.equal(installed.ok, true)
  assert.equal(fs.existsSync(path.join(root, '.github', 'skills', 'harness', 'SKILL.md')), true)
  assert.equal(fs.existsSync(path.join(root, '.github', 'agents', 'harness-scenario-planner.agent.md')), true)
  assert.equal(fs.existsSync(path.join(root, '.mcp.json')), true)
  assert.equal(fs.existsSync(path.join(root, '.harness', 'installed.json')), true)

  const checked = installProject({ targetRoot: root, check: true })
  assert.equal(checked.ok, true)

  fs.writeFileSync(path.join(root, '.mcp.json'), '{}\n')
  const stale = installProject({ targetRoot: root, check: true })
  assert.equal(stale.ok, false)
  assert.equal(stale.files.find((file) => file.path === '.mcp.json').status, 'stale')
})
