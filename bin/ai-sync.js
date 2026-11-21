#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)

let profile = null
let target = process.cwd()
let check = false
let force = false

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--profile' || args[i] === '-p') profile = args[++i]
  else if (args[i] === '--help' || args[i] === '-h') {
    console.log('Uso: ai-sync [pasta-do-repositorio] [--profile nome] [--force]\n     ai-sync --check\n\n--force reinstala também os arquivos em conflito (seus ou editados), sobrescrevendo-os.\n\nSem --profile, detecta a stack do projeto e aplica o que vale para qualquer projeto mais o da stack.')
    process.exit(0)
  } else if (args[i] === '--check') check = true
  else if (args[i] === '--force') force = true
  else target = path.resolve(args[i])
}

function runCheck() {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'))
  const groups = ['agents', 'rules', 'skills']
  const knownStacks = Object.keys(catalog.stacks || {})
  const errors = []
  const warnings = []

  for (const group of groups) {
    for (const [name, item] of Object.entries(catalog[group] || {})) {
      if (!fs.existsSync(path.join(root, item.path))) errors.push(`${group}/${name}: ${item.path} não existe`)
      if (!Array.isArray(item.applies) || item.applies.length === 0) errors.push(`${group}/${name}: falta "applies"`)
      for (const a of item.applies || []) {
        if (a !== 'all' && !knownStacks.includes(a)) errors.push(`${group}/${name}: stack "${a}" não está em "stacks"`)
      }
      if (!item.description) errors.push(`${group}/${name}: falta "description"`)
    }
    const dir = path.join(root, group)
    if (fs.existsSync(dir)) {
      const registered = new Set(Object.values(catalog[group] || {}).map((i) => path.normalize(i.path)))
      for (const file of fs.readdirSync(dir)) {
        if (!registered.has(path.join(group, file))) warnings.push(`${group}/${file} não está no catalog.json`)
      }
    }
  }

  const profilesDir = path.join(root, 'profiles')
  for (const file of fs.readdirSync(profilesDir)) {
    const profileConfig = JSON.parse(fs.readFileSync(path.join(profilesDir, file), 'utf8'))
    for (const group of groups) {
      for (const name of profileConfig[group] || []) {
        if (!(catalog[group] || {})[name]) errors.push(`perfil ${file}: ${group}/${name} não está no catalog.json`)
      }
    }
  }

  warnings.forEach((w) => console.warn(`aviso: ${w}`))
  errors.forEach((e) => console.error(`erro: ${e}`))
  if (errors.length > 0) process.exit(1)
  console.log('Catálogo e perfis consistentes')
  process.exit(0)
}

if (check) runCheck()

if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
  console.error(`Pasta não encontrada: ${target}`)
  process.exit(1)
}

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'))
const groups = ['agents', 'rules', 'skills']
const ignoredDirs = new Set(['node_modules', 'vendor', 'dist', 'build', 'coverage'])

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

function projectDependencies() {
  const dirs = [target]
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && !ignoredDirs.has(entry.name)) {
      dirs.push(path.join(target, entry.name))
    }
  }
  const found = new Set()
  for (const dir of dirs) {
    const pkg = readJson(path.join(dir, 'package.json'))
    const composer = readJson(path.join(dir, 'composer.json'))
    for (const key of ['dependencies', 'devDependencies']) Object.keys(pkg[key] || {}).forEach((d) => found.add(d))
    for (const key of ['require', 'require-dev']) Object.keys(composer[key] || {}).forEach((d) => found.add(d))
  }
  return found
}

function stacksWithContent() {
  const stacks = new Set()
  for (const group of groups) {
    for (const item of Object.values(catalog[group] || {})) {
      item.applies.filter((a) => a !== 'all').forEach((a) => stacks.add(a))
    }
  }
  return stacks
}

function detectStacks() {
  const dependencies = projectDependencies()
  const available = stacksWithContent()
  return Object.entries(catalog.stacks || {})
    .filter(([name]) => available.has(name))
    .filter(([, stack]) => (stack.detect?.dependencies || []).some((d) => dependencies.has(d)))
    .map(([name]) => name)
}

function autoConfig(stacks) {
  const result = {}
  for (const group of groups) {
    result[group] = Object.entries(catalog[group] || {})
      .filter(([, item]) => item.applies.includes('all') || item.applies.some((a) => stacks.includes(a)))
      .map(([name]) => name)
  }
  return result
}

let config
let detected = []
if (profile) {
  const profileFile = path.join(root, 'profiles', `${profile}.json`)
  if (!fs.existsSync(profileFile)) {
    const available = fs.readdirSync(path.join(root, 'profiles')).map((f) => f.replace('.json', ''))
    console.error(`Perfil "${profile}" não existe. Disponíveis: ${available.join(', ')}`)
    process.exit(1)
  }
  config = JSON.parse(fs.readFileSync(profileFile, 'utf8'))
} else {
  detected = detectStacks()
  config = autoConfig(detected)
}

const crypto = require('crypto')

const manifestFile = path.join(target, '.claude', 'claude-core.lock.json')
const coreVersion = readJson(path.join(root, 'package.json')).version || '0.0.0'
const previous = fs.existsSync(manifestFile) ? readJson(manifestFile).files || {} : {}
const manifest = {}
const report = { created: [], updated: [], overwritten: [], removed: [], adopted: [], kept: [], warnings: [] }

const hashOf = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

function listFiles(abs) {
  if (!fs.statSync(abs).isDirectory()) return ['']
  const out = []
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.isDirectory()) listFiles(path.join(abs, entry.name)).forEach((f) => out.push(path.join(entry.name, f)))
    else out.push(entry.name)
  }
  return out
}

function desiredFiles() {
  const desired = new Map()
  for (const group of groups) {
    const items = catalog[group] || {}
    for (const name of config[group] || []) {
      const item = items[name]
      if (!item || !fs.existsSync(path.join(root, item.path))) {
        console.error(`${group}/${name} não está registrado no catalog.json ou não existe`)
        process.exit(1)
      }
      const source = path.join(root, item.path)
      for (const rel of listFiles(source)) {
        const from = rel === '' ? source : path.join(source, rel)
        const to = path.join('.claude', group, path.basename(item.path), rel)
        desired.set(to, from)
      }
    }
  }
  return desired
}

function pruneEmptyDirs(file) {
  let dir = path.dirname(file)
  const stop = path.join(target, '.claude')
  while (dir.startsWith(stop) && dir !== stop && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir)
    dir = path.dirname(dir)
  }
}

function syncFiles() {
  const desired = desiredFiles()

  for (const [rel, from] of desired) {
    const dest = path.join(target, rel)
    const sourceHash = hashOf(from)
    const recorded = previous[rel]
    const install = (list) => {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(from, dest)
      manifest[rel] = { hash: sourceHash, version: coreVersion }
      list.push(rel)
    }

    if (!fs.existsSync(dest)) {
      install(report.created)
      continue
    }

    const currentHash = hashOf(dest)
    if (currentHash === sourceHash) {
      manifest[rel] = recorded && recorded.hash === sourceHash ? recorded : { hash: sourceHash, version: coreVersion }
      if (!recorded) report.adopted.push(rel)
      continue
    }

    if (recorded && currentHash === recorded.hash) {
      install(report.updated)
      continue
    }

    if (force) {
      install(report.overwritten)
      continue
    }

    if (!recorded) {
      report.kept.push(rel)
      report.warnings.push(`${rel}: já existe um arquivo seu com esse nome; não mexi nele. O claude-core tem uma versão disponível.`)
      continue
    }

    manifest[rel] = recorded
    report.kept.push(rel)
    const newer = sourceHash !== recorded.hash
    report.warnings.push(
      `${rel}: você editou este arquivo; não mexi nele.${newer ? ' Há uma versão nova disponível no claude-core.' : ''}`
    )
  }

  for (const [rel, recorded] of Object.entries(previous)) {
    if (desired.has(rel)) continue
    const dest = path.join(target, rel)
    if (!fs.existsSync(dest)) continue
    if (hashOf(dest) === recorded.hash) {
      fs.rmSync(dest)
      pruneEmptyDirs(dest)
      report.removed.push(rel)
    } else {
      report.kept.push(rel)
      report.warnings.push(`${rel}: saiu do claude-core, mas você editou este arquivo; não removi.`)
    }
  }
}

function writeManifest() {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([x], [y]) => x.localeCompare(y)))
  const content = `${JSON.stringify({ files: sorted }, null, 2)}\n`
  const current = fs.existsSync(manifestFile) ? fs.readFileSync(manifestFile, 'utf8') : ''
  if (Object.keys(sorted).length === 0 && current === '') return
  if (current === content) return
  fs.mkdirSync(path.dirname(manifestFile), { recursive: true })
  fs.writeFileSync(manifestFile, content)
}

function printReport() {
  const sections = [
    ['Criados', report.created],
    ['Atualizados', report.updated],
    ['Sobrescritos (--force)', report.overwritten],
    ['Removidos', report.removed],
    ['Já em dia (passaram a ser acompanhados)', report.adopted],
    ['Deixados como estavam', report.kept]
  ]
  for (const [title, list] of sections) {
    if (list.length === 0) continue
    console.log(`${title}:`)
    list.forEach((f) => console.log(`  ${f}`))
  }
  if (Object.values(report).every((l) => l.length === 0)) console.log('Tudo em dia, nada mudou.')
  if (report.warnings.length > 0) {
    console.log('\nAvisos:')
    report.warnings.forEach((w) => console.log(`  ${w}`))
  }
}

syncFiles()
writeManifest()
printReport()

function allowWorktrees() {
  const dir = path.join(path.dirname(target), `${path.basename(target)}-worktrees`)
  const file = path.join(target, '.claude', 'settings.local.json')

  let settings = {}
  if (fs.existsSync(file)) {
    try {
      settings = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      console.error(`\n${file} não é um JSON válido. Adicione a mão em permissions.additionalDirectories: ${dir}`)
      return
    }
  }

  const permissions = settings.permissions || {}
  const dirs = Array.isArray(permissions.additionalDirectories) ? permissions.additionalDirectories : []
  const memoryDir = path.join(target, '.claude', 'team-memory')
  const obsolete = [`Edit(${dir}/**)`, `Write(${dir}/**)`, `Edit(/${memoryDir}/**)`]
  const allow = (Array.isArray(permissions.allow) ? permissions.allow : []).filter((rule) => !obsolete.includes(rule))
  const rules = [`Edit(/${dir}/**)`]

  const missingDir = !dirs.includes(dir)
  const missingRules = rules.filter((rule) => !allow.includes(rule))
  const hadObsolete = (permissions.allow || []).length !== allow.length
  if (!missingDir && missingRules.length === 0 && !hadObsolete) return

  settings.permissions = {
    ...permissions,
    additionalDirectories: missingDir ? [...dirs, dir] : dirs,
    allow: [...allow, ...missingRules]
  }
  fs.writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`)
  console.log(`\nPasta de worktrees liberada (leitura e edição): ${dir}`)
}

function excludeTeamMemory() {
  const gitDir = path.join(target, '.git')
  if (!fs.existsSync(gitDir) || !fs.statSync(gitDir).isDirectory()) return

  const file = path.join(gitDir, 'info', 'exclude')
  const entry = '.claude/team-memory/'
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  if (current.split('\n').includes(entry)) return

  fs.mkdirSync(path.dirname(file), { recursive: true })
  const separator = current === '' || current.endsWith('\n') ? '' : '\n'
  fs.writeFileSync(file, `${current}${separator}${entry}\n`)
  console.log(`\nMemória do time fora do git: ${entry}`)
}

allowWorktrees()
excludeTeamMemory()

if (profile) {
  console.log(`\nPerfil "${profile}" aplicado em ${target} (sem detecção de stack)`)
} else {
  console.log(`\nStacks detectadas: ${detected.length ? detected.join(', ') : 'nenhuma'}`)
  if (detected.length === 0) console.log('Nenhuma stack reconhecida: foi aplicado só o que vale para qualquer projeto.')
  console.log(`Aplicado em ${target}`)
}
console.log('Para conversar com o orquestrador: claude --agent orchestrator')
