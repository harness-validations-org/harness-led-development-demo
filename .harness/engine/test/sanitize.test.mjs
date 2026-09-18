import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitize } from '../lib/sanitize.mjs'

test('redacts sensitive keys and repository paths', () => {
  const result = sanitize({
    token: 'secret-value',
    detail: '/tmp/example/src/App.tsx',
  }, '/tmp/example')
  assert.deepEqual(result, {
    token: '<redacted>',
    detail: '<repo>/src/App.tsx',
  })
})
