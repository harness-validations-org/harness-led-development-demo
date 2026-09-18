import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeJson } from './files.mjs'
import { headCommit } from './git.mjs'

const ENGINE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const PROJECT_FILES = [
  {
    source: 'templates/project/.github/skills/harness/SKILL.md',
    destination: '.github/skills/harness/SKILL.md',
  },
  {
    source: 'templates/project/.github/agents/harness-scenario-planner.agent.md',
    destination: '.github/agents/harness-scenario-planner.agent.md',
  },
  {
    source: 'templates/project/.mcp.json',
    destination: '.mcp.json',
  },
]

function hash(content) {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function readSource(relativePath) {
  return fs.readFileSync(path.join(ENGINE_ROOT, relativePath), 'utf8')
}

function harnessCommit() {
  const provenancePath = path.join(ENGINE_ROOT, 'UPSTREAM_COMMIT')
  if (fs.existsSync(provenancePath)) return fs.readFileSync(provenancePath, 'utf8').trim()
  return headCommit(ENGINE_ROOT)
}

export function projectFiles() {
  return PROJECT_FILES.map((entry) => ({
    ...entry,
    content: readSource(entry.source),
  }))
}

export function installProject({ targetRoot, check = false }) {
  const results = []
  for (const entry of projectFiles()) {
    const destination = path.join(targetRoot, entry.destination)
    const current = fs.existsSync(destination) ? fs.readFileSync(destination, 'utf8') : null
    const matches = current === entry.content
    results.push({
      path: entry.destination,
      status: matches ? 'current' : current === null ? 'missing' : 'stale',
      sha256: hash(entry.content),
    })
    if (!check && !matches) {
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.writeFileSync(destination, entry.content)
    }
  }

  const manifest = {
    schemaVersion: 1,
    harnessCommit: harnessCommit(),
    generatedFiles: results.map(({ path: file, sha256 }) => ({ path: file, sha256 })),
    mcp: {
      cliProjectConfig: '.mcp.json',
      cloudDefaults: ['github', 'playwright'],
      customCloudServers: [],
    },
  }

  const manifestPath = path.join(targetRoot, '.harness', 'installed.json')
  const expectedManifest = `${JSON.stringify(manifest, null, 2)}\n`
  const currentManifest = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : null
  const manifestMatches = currentManifest === expectedManifest
  results.push({
    path: '.harness/installed.json',
    status: manifestMatches ? 'current' : currentManifest === null ? 'missing' : 'stale',
    sha256: hash(expectedManifest),
  })
  if (!check && !manifestMatches) writeJson(manifestPath, manifest)

  const stale = results.filter((result) => result.status !== 'current')
  return {
    ok: stale.length === 0 || !check,
    mode: check ? 'check' : 'install',
    files: results,
    manifest,
  }
}
