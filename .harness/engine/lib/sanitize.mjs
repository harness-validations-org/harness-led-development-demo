import os from 'node:os'
import path from 'node:path'

const SENSITIVE_KEY = /(authorization|cookie|credential|password|secret|token|api[-_]?key)/i

function replacePaths(value, repoRoot) {
  let result = value
  const replacements = [
    [repoRoot, '<repo>'],
    [path.resolve(repoRoot), '<repo>'],
    [os.homedir(), '<home>'],
  ].sort((a, b) => b[0].length - a[0].length)

  for (const [source, replacement] of replacements) {
    if (source) result = result.split(source).join(replacement)
  }
  return result
}

export function sanitize(value, repoRoot) {
  if (Array.isArray(value)) return value.map((item) => sanitize(item, repoRoot))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? '<redacted>' : sanitize(item, repoRoot),
    ]))
  }
  if (typeof value === 'string') return replacePaths(value, repoRoot)
  return value
}
