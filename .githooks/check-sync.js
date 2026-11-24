const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const GENERATED_PATHS = ['.claude/agents', '.claude/rules', '.claude/skills', '.claude/settings.json', '.claude/claude-core.lock.json']
const TEMP_PREFIX = 'claude-core-hook-'
const COMPARE_STAGE = 'stage'
const COMPARE_FOLDER = 'folder'

function listFiles(root, rel) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) return []
  if (!fs.statSync(full).isDirectory()) return [rel]
  return fs.readdirSync(full).flatMap((name) => listFiles(root, path.join(rel, name)))
}

function readGenerated(root) {
  const files = new Map()
  for (const rel of GENERATED_PATHS.flatMap((generatedPath) => listFiles(root, generatedPath))) {
    files.set(rel, fs.readFileSync(path.join(root, rel)))
  }
  return files
}

function differences(actual, expected) {
  const names = new Set([...actual.keys(), ...expected.keys()])
  return [...names].filter((name) => !actual.has(name) || !expected.has(name) || !actual.get(name).equals(expected.get(name))).sort()
}

function exportStage(destination) {
  const result = spawnSync('git', ['checkout-index', '-a', `--prefix=${destination}/`], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`Não consegui ler o que está no stage: ${result.stderr}`)
}

function syncFromExport(exported, destination) {
  const result = spawnSync('node', [path.join(exported, 'bin', 'ai-sync.js'), destination, '--profile', 'tooling'], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`O sync das fontes do stage falhou: ${result.stdout}${result.stderr}`)
}

function refusalMessage(files) {
  return [
    'Commit recusado: os arquivos gerados do .claude/ não batem com as fontes que vão neste commit.',
    '',
    'Arquivos fora de sincronia:',
    ...files.map((file) => `  - ${file}`),
    '',
    'Como corrigir:',
    '  1. Rode npm run sync.',
    '  2. Inclua os arquivos gerados nos caminhos do commit (git add e git commit -- <fontes> <gerados>).',
    '  3. Commite de novo.',
    '',
    'Se outro agente tem fontes alteradas e não commitadas nesta pasta, os gerados refletem o trabalho dele e não podem ir neste commit:',
    'espere o dono commitar as fontes dele, ou trabalhe em uma worktree isolada.'
  ].join('\n')
}

function main() {
  const compareWith = process.argv[2] === COMPARE_FOLDER ? COMPARE_FOLDER : COMPARE_STAGE
  const exported = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX))
  const synced = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX))
  try {
    exportStage(exported)
    syncFromExport(exported, synced)
    const actualRoot = compareWith === COMPARE_FOLDER ? process.cwd() : exported
    const outOfSync = differences(readGenerated(actualRoot), readGenerated(synced))
    if (outOfSync.length === 0) return 0
    process.stderr.write(`${refusalMessage(outOfSync)}\n`)
    return 1
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 1
  } finally {
    fs.rmSync(exported, { recursive: true, force: true })
    fs.rmSync(synced, { recursive: true, force: true })
  }
}

process.exit(main())
