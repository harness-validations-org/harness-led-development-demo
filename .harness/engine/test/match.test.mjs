import test from 'node:test'
import assert from 'node:assert/strict'
import { matchesAny } from '../lib/match.mjs'

test('matches recursive and single segment globs', () => {
  assert.equal(matchesAny('src/App.tsx', ['src/**']), true)
  assert.equal(matchesAny('src/data/todos.ts', ['src/*']), false)
  assert.equal(matchesAny('.git/config', ['.git/**']), true)
})
