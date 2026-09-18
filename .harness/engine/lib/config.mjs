import fs from 'node:fs'
import path from 'node:path'

const REQUIRED_COMMANDS = ['lint', 'test', 'build']

export function findRepoRoot(start = process.cwd()) {
  let current = path.resolve(start)
  while (true) {
    if (fs.existsSync(path.join(current, '.git'))) return current
    const parent = path.dirname(current)
    if (parent === current) throw new Error(`No Git repository found from ${start}`)
    current = parent
  }
}

export function loadConfig(repoRoot) {
  const configPath = path.join(repoRoot, '.harness', 'config.json')
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing ${path.relative(repoRoot, configPath)}`)
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  validateConfig(config)
  return { ...config, __path: configPath, __repoRoot: repoRoot }
}

export function validateConfig(config) {
  if (config?.schemaVersion !== 1) throw new Error('config.schemaVersion must be 1')
  if (!config?.project?.name) throw new Error('config.project.name is required')
  if (!config?.commands || typeof config.commands !== 'object') {
    throw new Error('config.commands is required')
  }
  for (const command of REQUIRED_COMMANDS) {
    if (typeof config.commands[command] !== 'string' || !config.commands[command].trim()) {
      throw new Error(`config.commands.${command} is required`)
    }
  }
  if (!Array.isArray(config?.safety?.allowedPaths) || config.safety.allowedPaths.length === 0) {
    throw new Error('config.safety.allowedPaths must be a non-empty array')
  }
  if (!Array.isArray(config?.safety?.forbiddenPaths)) {
    throw new Error('config.safety.forbiddenPaths must be an array')
  }
  const maxChangedFiles = config?.safety?.maxChangedFiles
  if (!Number.isInteger(maxChangedFiles) || maxChangedFiles < 1) {
    throw new Error('config.safety.maxChangedFiles must be a positive integer')
  }
  return config
}
