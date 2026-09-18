import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function git(repoRoot, args, allowFailure = false) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.status !== 0 && !allowFailure) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`)
  }
  return result.stdout.trim()
}

export function headCommit(repoRoot) {
  return git(repoRoot, ['rev-parse', 'HEAD'], true) || null
}

export function changedPaths(repoRoot) {
  const output = git(repoRoot, ['status', '--porcelain=v1', '-uall'])
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3))
    .map((value) => value.includes(' -> ') ? value.split(' -> ')[1] : value)
    .sort()
}

export function harnessCommit(repoRoot, relativePath = '.harness/engine') {
  const provenancePath = path.join(repoRoot, relativePath, 'UPSTREAM_COMMIT')
  if (fs.existsSync(provenancePath)) {
    return fs.readFileSync(provenancePath, 'utf8').trim() || null
  }
  return git(repoRoot, ['-C', relativePath, 'rev-parse', 'HEAD'], true) || null
}
