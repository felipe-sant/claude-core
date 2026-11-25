const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const GENERATED_PATHS = ['.claude/agents', '.claude/rules', '.claude/skills', '.claude/settings.json', '.claude/claude-kit.lock.json']
const TEMP_PREFIX = 'claude-kit-hook-'
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

function exportHead(destination) {
  const archive = spawnSync('git', ['archive', 'HEAD'], { maxBuffer: 1024 * 1024 * 512 })
  if (archive.status !== 0) return false
  const extraction = spawnSync('tar', ['-x', '-C', destination], { input: archive.stdout })
  return extraction.status === 0
}

function syncSucceeds(exported, destination) {
  const result = spawnSync('node', [path.join(exported, 'bin', 'ai-sync.js'), destination, '--profile', 'tooling'], { encoding: 'utf8' })
  return result.status === 0
}

function prepareHeadFolders(workspace) {
  const exportedHead = path.join(workspace, 'head')
  const syncedHead = path.join(workspace, 'head-synced')
  fs.mkdirSync(exportedHead)
  fs.mkdirSync(syncedHead)
  return { exportedHead, syncedHead }
}

function headDifferences(workspace) {
  const { exportedHead, syncedHead } = prepareHeadFolders(workspace)
  if (!exportHead(exportedHead) || !syncSucceeds(exportedHead, syncedHead)) return []
  return differences(readGenerated(exportedHead), readGenerated(syncedHead))
}

function headSyncFails(workspace) {
  const { exportedHead, syncedHead } = prepareHeadFolders(workspace)
  return exportHead(exportedHead) && !syncSucceeds(exportedHead, syncedHead)
}

function stageSyncFailureMessage() {
  return [
    'Commit recusado: o sync falhou ao atualizar o .claude/ a partir do que está no stage.',
    'Confira o que está preparado para o commit (stage): o catalog.json, os perfis em profiles/ e as fontes (agents/, rules/, skills/, templates/).',
    'Corrija, prepare de novo e commite de novo.'
  ].join('\n')
}

function headSyncFailureMessage() {
  return [
    'Commit recusado: o sync falhou ao atualizar o .claude/ a partir do último commit.',
    'Confira o último commit: o catalog.json, os perfis em profiles/ e as fontes (agents/, rules/, skills/, templates/) estão inválidos nele.',
    'Corrija esses arquivos e commite a correção pelos caminhos exatos antes de fazer este commit.'
  ].join('\n')
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

function headRefusalMessage(files) {
  return [
    'Commit recusado: o último commit está fora de sincronia com o .claude/, e este commit não o corrige.',
    '',
    'Arquivos fora de sincronia no último commit:',
    ...files.map((file) => `  - ${file}`),
    '',
    'Como corrigir:',
    '  1. Rode npm run sync.',
    '  2. Commite os arquivos gerados do .claude/ que mudaram, pelos caminhos exatos (git add e git commit -- <gerados>).',
    '  3. Faça este commit de novo.',
    '',
    'Se esses arquivos têm trabalho de outro agente, espere o dono commitar ou trabalhe em uma worktree isolada.'
  ].join('\n')
}

function main() {
  const compareWith = process.argv[2] === COMPARE_FOLDER ? COMPARE_FOLDER : COMPARE_STAGE
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX))
  const exported = path.join(workspace, 'stage')
  const synced = path.join(workspace, 'stage-synced')
  fs.mkdirSync(exported)
  fs.mkdirSync(synced)
  try {
    exportStage(exported)
    if (!syncSucceeds(exported, synced)) {
      process.stderr.write(`${headSyncFails(workspace) ? headSyncFailureMessage() : stageSyncFailureMessage()}\n`)
      return 1
    }
    const actualRoot = compareWith === COMPARE_FOLDER ? process.cwd() : exported
    const outOfSync = differences(readGenerated(actualRoot), readGenerated(synced))
    if (outOfSync.length === 0) return 0
    const headOutOfSync = headDifferences(workspace)
    const message = headOutOfSync.length > 0 ? headRefusalMessage(headOutOfSync) : refusalMessage(outOfSync)
    process.stderr.write(`${message}\n`)
    return 1
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 1
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true })
  }
}

process.exit(main())
