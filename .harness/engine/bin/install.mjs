#!/usr/bin/env node
import path from 'node:path'
import process from 'node:process'
import { parseArgs } from '../lib/args.mjs'
import { findRepoRoot } from '../lib/config.mjs'
import { installProject } from '../lib/install.mjs'

const args = parseArgs(process.argv.slice(2))
const targetRoot = findRepoRoot(typeof args.target === 'string' ? path.resolve(args.target) : process.cwd())
const result = installProject({ targetRoot, check: Boolean(args.check) })

for (const file of result.files) {
  console.log(`${file.status.toUpperCase()} ${file.path}`)
}

if (!result.ok) {
  console.error('Harness project adapters are missing or stale. Run: npm run harness:install')
  process.exitCode = 1
}
