import fs from 'node:fs'
import path from 'node:path'

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

export function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, value.endsWith('\n') ? value : `${value}\n`)
}

export function requireFile(file, label = file) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${label}: ${file}`)
  return file
}
