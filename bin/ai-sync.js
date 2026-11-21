#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)

let profile = 'default'
let target = process.cwd()
let check = false

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--profile' || args[i] === '-p') profile = args[++i]
  else if (args[i] === '--help' || args[i] === '-h') {
    console.log('Uso: ai-sync [pasta-do-repositorio] [--profile nome]\n     ai-sync --check')
    process.exit(0)
  } else if (args[i] === '--check') check = true
  else target = path.resolve(args[i])
}

function runCheck() {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'))
  const groups = ['agents', 'rules', 'skills']
  const errors = []
  const warnings = []

  for (const group of groups) {
    for (const [name, item] of Object.entries(catalog[group] || {})) {
      if (!fs.existsSync(path.join(root, item.path))) errors.push(`${group}/${name}: ${item.path} não existe`)
      if (!Array.isArray(item.applies) || item.applies.length === 0) errors.push(`${group}/${name}: falta "applies"`)
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

const profileFile = path.join(root, 'profiles', `${profile}.json`)
if (!fs.existsSync(profileFile)) {
  const available = fs.readdirSync(path.join(root, 'profiles')).map((f) => f.replace('.json', ''))
  console.error(`Perfil "${profile}" não existe. Disponíveis: ${available.join(', ')}`)
  process.exit(1)
}
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
  console.error(`Pasta não encontrada: ${target}`)
  process.exit(1)
}

const config = JSON.parse(fs.readFileSync(profileFile, 'utf8'))
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'))

function syncGroup(group, label) {
  const names = config[group] || []
  const items = catalog[group] || {}
  const outDir = path.join(target, '.claude', group)

  for (const name of names) {
    const item = items[name]
    if (!item || !fs.existsSync(path.join(root, item.path))) {
      console.error(`${label} "${name}" do perfil não está registrado no catalog.json ou não existe`)
      process.exit(1)
    }
  }

  if (names.length === 0 && !fs.existsSync(outDir)) return

  fs.mkdirSync(outDir, { recursive: true })

  const fileOf = (name) => path.basename(items[name].path)
  const wanted = new Set(names.map(fileOf))
  const managed = new Set(Object.keys(items).map(fileOf))
  for (const file of fs.readdirSync(outDir)) {
    if (managed.has(file) && !wanted.has(file)) fs.rmSync(path.join(outDir, file), { recursive: true })
  }

  console.log(`${label}s:`)
  for (const name of names) {
    fs.cpSync(path.join(root, items[name].path), path.join(outDir, fileOf(name)), { recursive: true })
    console.log(`  ${name}`)
  }
}

syncGroup('agents', 'Agente')
syncGroup('rules', 'Regra')
syncGroup('skills', 'Skill')

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

console.log(`\nPerfil "${profile}" aplicado em ${target}`)
console.log('Para conversar com o orquestrador: claude --agent orchestrator')
