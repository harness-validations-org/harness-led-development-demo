import test from 'node:test'
import assert from 'node:assert/strict'
import { validateConfig } from '../lib/config.mjs'

const valid = {
  schemaVersion: 1,
  project: { name: 'Demo', type: 'react-vite' },
  commands: { lint: 'npm run lint', test: 'npm test', build: 'npm run build' },
  evaluation: {},
  safety: {
    allowedPaths: ['src/**'],
    forbiddenPaths: ['.git/**'],
    maxChangedFiles: 10,
  },
}

test('accepts a valid project configuration', () => {
  assert.equal(validateConfig(valid), valid)
})

test('requires deterministic commands', () => {
  assert.throws(() => validateConfig({
    ...valid,
    commands: { lint: 'npm run lint', test: 'npm test' },
  }), /commands\.build/)
})
