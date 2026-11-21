const fs = require('node:fs')
const path = require('node:path')

const GROUPS = ['agents', 'rules', 'skills']
const REQUIRED_AGENT_KEYS = ['name', 'description', 'model']
const MODELS = ['haiku', 'sonnet', 'opus']

function readJson(file, errors, label) {
  const text = fs.readFileSync(file, 'utf8')
  if (!text.endsWith('\n')) errors.push(`${label}: o arquivo deve terminar com uma quebra de linha`)
  try {
    return JSON.parse(text)
  } catch (error) {
    errors.push(`${label}: JSON inválido (${error.message})`)
    return null
  }
}

function parseFrontmatter(text) {
  const lines = text.split('\n')
  if (lines[0] !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end === -1) return null
  const data = {}
  for (const line of lines.slice(1, end)) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (!match) return { invalid: line }
    data[match[1]] = match[2]
  }
  return data
}

function contentDirs(root, group) {
  const dirs = [path.join(root, group)]
  const stacksDir = path.join(root, 'stacks')
  if (fs.existsSync(stacksDir)) {
    for (const stack of fs.readdirSync(stacksDir)) dirs.push(path.join(stacksDir, stack, group))
  }
  return dirs.filter((dir) => fs.existsSync(dir))
}

function lintAgent(file, label, errors) {
  const data = parseFrontmatter(fs.readFileSync(file, 'utf8'))
  if (!data) return errors.push(`${label}: falta o cabeçalho entre "---" no início do arquivo`)
  if (data.invalid) return errors.push(`${label}: linha inválida no cabeçalho: "${data.invalid}"`)
  for (const key of REQUIRED_AGENT_KEYS) {
    if (!data[key]) errors.push(`${label}: falta "${key}" no cabeçalho`)
  }
  if (data.name && data.name !== path.basename(file, '.md')) {
    errors.push(`${label}: "name" (${data.name}) deve ser igual ao nome do arquivo`)
  }
  if (data.model && !MODELS.includes(data.model)) {
    errors.push(`${label}: "model" deve ser um de ${MODELS.join(', ')}`)
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(path.basename(file, '.md'))) {
    errors.push(`${label}: o nome do arquivo deve ser em minúsculas, com hífen`)
  }
}

function lintRule(file, label, errors) {
  let text = fs.readFileSync(file, 'utf8')
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---\n', 4)
    if (end === -1) return errors.push(`${label}: cabeçalho sem o "---" de fechamento`)
    const header = text.slice(4, end).split('\n')
    const valid = header[0] === 'paths:' && header.length > 1 && header.slice(1).every((l) => /^ {2}- "[^"]+"$/.test(l))
    if (!valid) errors.push(`${label}: o cabeçalho da regra só aceita "paths:" com uma lista de padrões entre aspas`)
    text = text.slice(end + 5).replace(/^\n/, '')
  }
  if (!text.startsWith('# ')) errors.push(`${label}: a regra deve começar com um título "# ..."`)
  if (!text.endsWith('\n')) errors.push(`${label}: o arquivo deve terminar com uma quebra de linha`)
}

function lintSkill(dir, label, errors) {
  if (!fs.existsSync(path.join(dir, 'SKILL.md'))) errors.push(`${label}: falta o SKILL.md`)
}

function lintProfile(file, label, errors) {
  const profile = readJson(file, errors, label)
  if (!profile) return
  for (const [key, value] of Object.entries(profile)) {
    if (!GROUPS.includes(key)) {
      errors.push(`${label}: chave desconhecida "${key}"`)
      continue
    }
    if (!Array.isArray(value) || value.some((n) => typeof n !== 'string')) {
      errors.push(`${label}: "${key}" deve ser uma lista de nomes`)
      continue
    }
    if (new Set(value).size !== value.length) errors.push(`${label}: "${key}" tem nomes repetidos`)
  }
}

function lintContent(root) {
  const errors = []
  const rel = (file) => path.relative(root, file)

  for (const dir of contentDirs(root, 'agents')) {
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.md')) lintAgent(path.join(dir, file), rel(path.join(dir, file)), errors)
      else errors.push(`${rel(path.join(dir, file))}: agente deve ser um arquivo .md`)
    }
  }
  for (const dir of contentDirs(root, 'rules')) {
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.md')) lintRule(path.join(dir, file), rel(path.join(dir, file)), errors)
      else errors.push(`${rel(path.join(dir, file))}: regra deve ser um arquivo .md`)
    }
  }
  for (const dir of contentDirs(root, 'skills')) {
    for (const entry of fs.readdirSync(dir)) lintSkill(path.join(dir, entry), rel(path.join(dir, entry)), errors)
  }

  const profilesDir = path.join(root, 'profiles')
  if (fs.existsSync(profilesDir)) {
    for (const file of fs.readdirSync(profilesDir)) {
      const full = path.join(profilesDir, file)
      if (file.endsWith('.json')) lintProfile(full, rel(full), errors)
      else errors.push(`${rel(full)}: perfil deve ser um arquivo .json`)
    }
  }

  for (const file of ['catalog.json', 'package.json']) {
    const full = path.join(root, file)
    if (fs.existsSync(full)) readJson(full, errors, file)
  }

  return errors
}

if (require.main === module) {
  const errors = lintContent(path.resolve(__dirname, '..'))
  errors.forEach((e) => console.error(`erro: ${e}`))
  if (errors.length > 0) process.exit(1)
  console.log('Conteúdo no formato esperado')
}

module.exports = { lintContent }
