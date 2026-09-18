export function parseArgs(argv) {
  const values = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (!value.startsWith('--')) {
      values._.push(value)
      continue
    }

    const key = value.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      values[key] = true
      continue
    }

    values[key] = next
    index += 1
  }
  return values
}

export function requireArg(args, name) {
  const value = args[name]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing required argument --${name}`)
  }
  return value.trim()
}
