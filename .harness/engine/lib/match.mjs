function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
}

export function globToRegex(glob) {
  const marker = '\u0000'
  const source = escapeRegex(glob)
    .replaceAll('**', marker)
    .replaceAll('*', '[^/]*')
    .replaceAll(marker, '.*')
  return new RegExp(`^${source}$`)
}

export function matchesAny(file, patterns) {
  return patterns.some((pattern) => globToRegex(pattern).test(file))
}
