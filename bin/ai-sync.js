#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const args = process.argv.slice(2)

let profile = 'default'
let target = process.cwd()

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--profile' || args[i] === '-p') profile = args[++i]
  else if (args[i] === '--help' || args[i] === '-h') {
    console.log('Uso: ai-sync [pasta-do-repositorio] [--profile nome]')
    process.exit(0)
  } else target = path.resolve(args[i])
}

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

function syncGroup(group, label) {
  const names = config[group] || []
  const sourceDir = path.join(root, group)
  const outDir = path.join(target, '.claude', group)

  for (const name of names) {
    if (!fs.existsSync(path.join(sourceDir, `${name}.md`))) {
      console.error(`${label} "${name}" do perfil não existe em ${group}/`)
      process.exit(1)
    }
  }

  fs.mkdirSync(outDir, { recursive: true })

  const wanted = new Set(names.map((n) => `${n}.md`))
  for (const file of fs.readdirSync(outDir)) {
    const managed = fs.existsSync(path.join(sourceDir, file))
    if (managed && !wanted.has(file)) fs.rmSync(path.join(outDir, file))
  }

  console.log(`${label}s:`)
  for (const name of names) {
    fs.copyFileSync(path.join(sourceDir, `${name}.md`), path.join(outDir, `${name}.md`))
    console.log(`  ${name}`)
  }
}

syncGroup('agents', 'Agente')
syncGroup('rules', 'Regra')

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
